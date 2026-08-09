import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import {
  appendAdminRecord,
  assertAdminContentKey,
  readAdminContent,
  writeAdminContent,
} from "../lib/admin-content-store";
import {
  adminImageExists,
  adminStorageBackend,
  readAdminImage,
  readProductData,
  verifyAdminStorage,
  writeAdminImage,
} from "../lib/admin-storage";

const router = Router();
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ADMIN_COOKIE = "ds_admin_session";

function adminPassword() {
  const password = process.env["ADMIN_PASSWORD"];
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }
  return password;
}

function adminSessionToken() {
  const secret = process.env["ADMIN_SESSION_SECRET"];
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }
  return createHmac("sha256", secret).update("dandsironworks-admin-session-v1").digest("hex");
}

function equalSecret(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isAdminRequest(req: Request) {
  return equalSecret(String(req.cookies?.[ADMIN_COOKIE] ?? ""), adminSessionToken());
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAdminRequest(req)) {
    res.status(401).json({ ok: false, error: "Admin session expired. Sign in again." });
    return;
  }
  next();
}

router.post("/admin/login", (req, res) => {
  if (!equalSecret(String(req.body?.password ?? ""), adminPassword())) {
    res.status(401).json({ ok: false, error: "Incorrect password." });
    return;
  }
  res.cookie(ADMIN_COOKIE, adminSessionToken(), {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "strict",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
  res.json({ ok: true });
});

router.post("/admin/logout", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/admin/session", (req, res) => {
  res.status(isAdminRequest(req) ? 200 : 401).json({ ok: isAdminRequest(req) });
});

const mimeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const uploadedImagePattern = /^[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/i;

function cleanName(value: unknown) {
  return String(value ?? "upload")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "upload";
}

async function readPreMadeProducts() {
  const saved = await readAdminContent("premade-products");
  if (saved && Array.isArray(saved.payload)) return saved.payload;

  try {
    const raw = await readProductData();
    const parsed = JSON.parse(raw) as unknown;
    const products = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { products?: unknown }).products)
        ? (parsed as { products: unknown[] }).products
        : undefined;
    if (products) {
      await writeAdminContent("premade-products", products);
      return products;
    }
  } catch {
    // No saved admin data yet.
  }
  return [];
}

function validatePreMadeProducts(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error("Pre-made products payload must be an array.");
  }

  const serialized = JSON.stringify(value);
  if (serialized.includes("data:image/") || serialized.includes("data:application/octet-stream;base64,")) {
    throw new Error("Uploaded photos must be saved as site image files before saving products.");
  }

  return value;
}

function validatePersistentContent(value: unknown) {
  const serialized = JSON.stringify(value);
  if (serialized.includes("data:image/") || serialized.includes("data:application/octet-stream;base64,")) {
    throw new Error("Images must finish uploading to App Storage before this content can be saved.");
  }
  if (Buffer.byteLength(serialized, "utf8") > 4 * 1024 * 1024) {
    throw new Error("This content collection is too large to save safely.");
  }
  return value;
}

function validateContentShape(key: string, value: unknown) {
  if (["premade-products", "etsy-products", "premium-products", "services", "orders", "inquiries"].includes(key) && !Array.isArray(value)) {
    throw new Error("This content collection must be a list.");
  }
  if (key === "settings" && (!value || typeof value !== "object" || Array.isArray(value))) {
    throw new Error("Settings must be an object.");
  }
  return validatePersistentContent(value);
}

router.get("/admin/premade-products", async (_req, res) => {
  try {
    const products = await readPreMadeProducts();
    const saved = await readAdminContent("premade-products");
    res.json({ ok: true, products, version: saved?.version ?? 0 });
  } catch (error) {
    res.status(503).json({ ok: false, error: error instanceof Error ? error.message : "Could not load pre-made products." });
  }
});

router.put("/admin/premade-products", requireAdmin, async (req, res) => {
  try {
    const products = validatePreMadeProducts(req.body?.products);
    const saved = await writeAdminContent("premade-products", products, Number.isInteger(req.body?.version) ? req.body.version : undefined);
    res.json({ ok: true, products: saved.payload, version: saved.version });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : "Could not save pre-made products." });
  }
});

router.get("/admin/content/:key", async (req, res) => {
  try {
    const key = assertAdminContentKey(String(req.params.key ?? ""));
    if ((key === "orders" || key === "inquiries") && !isAdminRequest(req)) {
      res.status(401).json({ ok: false, error: "Admin session required." });
      return;
    }
    if (key === "premade-products") await readPreMadeProducts();
    const saved = await readAdminContent(key);
    res.json({ ok: true, content: saved?.payload ?? null, version: saved?.version ?? 0 });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : "Could not load content." });
  }
});

router.put("/admin/content/:key", requireAdmin, async (req, res) => {
  try {
    const key = assertAdminContentKey(String(req.params.key ?? ""));
    if (!("content" in (req.body ?? {}))) throw new Error("Content payload is required.");
    const content = validateContentShape(key, req.body.content);
    const saved = await writeAdminContent(key, content, Number.isInteger(req.body?.version) ? req.body.version : undefined);
    res.json({ ok: true, content: saved.payload, version: saved.version, updatedAt: saved.updatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save content.";
    res.status(/another session/i.test(message) ? 409 : 400).json({ ok: false, error: message });
  }
});

router.post("/admin/records/:key", async (req, res) => {
  try {
    const key = String(req.params.key ?? "");
    if (key !== "orders" && key !== "inquiries") throw new Error("Unknown record collection.");
    const submitted = req.body?.record;
    if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) throw new Error("A record is required.");
    if (Buffer.byteLength(JSON.stringify(submitted), "utf8") > 64 * 1024) throw new Error("The submitted record is too large.");
    const prefix = key === "orders" ? "ord" : "inq";
    const record = { ...submitted, id: `${prefix}_${randomUUID()}`, submittedAt: new Date().toISOString() };
    await appendAdminRecord(key, record);
    res.status(201).json({ ok: true, record });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : "Could not save the submitted record." });
  }
});

router.get("/admin/images/:filename", async (req, res) => {
  const filename = String(req.params.filename ?? "");
  if (!uploadedImagePattern.test(filename)) {
    res.status(404).json({ ok: false, error: "Image not found." });
    return;
  }

  try {
    const image = await readAdminImage(filename);
    const extension = filename.split(".").pop()?.toLowerCase();
    const contentType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(image);
  } catch {
    res.status(404).json({ ok: false, error: "Image not found." });
  }
});

router.get("/admin/storage-status", requireAdmin, async (_req, res) => {
  try {
    const storage = await verifyAdminStorage();
    const products = await readPreMadeProducts();
    const referenced = new Set<string>();
    const collect = (value: unknown) => {
      const match = String(value ?? "").match(/\/(?:api\/admin\/images|images\/admin-uploads)\/([^/?#]+)/);
      if (match?.[1] && uploadedImagePattern.test(match[1])) referenced.add(match[1]);
    };

    for (const product of products as Array<Record<string, any>>) {
      collect(product.image);
      for (const image of product.gallery ?? []) collect(image?.src);
      collect(product.video?.poster);
      for (const video of product.videos ?? []) collect(video?.poster);
    }

    const checks = await Promise.all([...referenced].map(async filename => ({ filename, exists: await adminImageExists(filename) })));
    res.json({
      ok: true,
        backend: adminStorageBackend() === "replit-app-storage" ? "cloud-storage" : "local-filesystem",
      objectCount: storage.objectCount,
      referencedImages: checks.length,
      availableImages: checks.filter(item => item.exists).length,
      missingImages: checks.filter(item => !item.exists).map(item => item.filename),
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      backend: adminStorageBackend(),
      error: error instanceof Error ? error.message : "Could not inspect admin storage.",
    });
  }
});

router.post("/admin/images", requireAdmin, async (req, res) => {
  try {
    const image = String(req.body?.image ?? "");
    const match = image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      res.status(400).json({ ok: false, error: "Image upload must be a JPG, PNG, or WebP file." });
      return;
    }

    const mime = match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > MAX_IMAGE_BYTES) {
      res.status(413).json({ ok: false, error: "Image is too large after compression." });
      return;
    }

    const ext = mimeExtensions[mime] ?? "jpg";
    const filename = `${cleanName(req.body?.filename)}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    await writeAdminImage(filename, buffer);

    const verified = await readAdminImage(filename);
    if (verified.length !== buffer.length) {
      throw new Error("The image upload could not be verified in persistent storage.");
    }

    res.status(201).json({ ok: true, id: filename, url: `/api/admin/images/${filename}` });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Could not save image." });
  }
});

export default router;
