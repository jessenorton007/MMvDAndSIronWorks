import { randomUUID } from "node:crypto";
import { Router } from "express";
import {
  adminImageExists,
  adminStorageBackend,
  readAdminImage,
  readProductData,
  verifyAdminStorage,
  writeAdminImage,
  writeProductData,
} from "../lib/admin-storage";

const router = Router();
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

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
  try {
    const raw = await readProductData();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { products?: unknown }).products)) {
      return (parsed as { products: unknown[] }).products;
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

router.get("/admin/premade-products", async (_req, res) => {
  const products = await readPreMadeProducts();
  res.json({ ok: true, products });
});

router.put("/admin/premade-products", async (req, res) => {
  try {
    const products = validatePreMadeProducts(req.body?.products);
    await writeProductData(JSON.stringify({ products, updatedAt: new Date().toISOString() }, null, 2));
    res.json({ ok: true, products });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : "Could not save pre-made products." });
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

router.get("/admin/storage-status", async (_req, res) => {
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

router.post("/admin/images", async (req, res) => {
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

    res.json({ ok: true, url: `/api/admin/images/${filename}` });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Could not save image." });
  }
});

export default router;
