import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";
import { getSeoPage, notFoundSeo, SITE_ORIGIN, type SeoPage } from "./lib/seo-pages";
import { isAdminRequest } from "./routes/admin";

const app: Express = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));

app.use((req, res, next) => {
  const host = req.hostname.toLowerCase();
  if (host === "www.dandsironworks.com") {
    res.redirect(301, `${SITE_ORIGIN}${req.originalUrl}`);
    return;
  }
  next();
});

app.use("/api", router);
app.get("/images/admin-uploads/:filename", (req, res) => {
  res.redirect(301, `/api/admin/images/${encodeURIComponent(String(req.params.filename ?? ""))}`);
});

const staticRoot = process.env["IRONWORKS_DIST_PATH"] || path.resolve(__dirname, "../../ironworks/dist/public");
if (existsSync(staticRoot)) {
  const template = readFileSync(path.join(staticRoot, "index.html"), "utf8");
  const escapeHtml = (value: string) => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const renderPage = (page: SeoPage) => {
    const canonical = `${SITE_ORIGIN}${page.path === "/" ? "/" : page.path}`;
    const image = page.image
      ? (page.image.startsWith("http") ? page.image : `${SITE_ORIGIN}${page.image}`)
      : `${SITE_ORIGIN}/opengraph.jpg`;
    const title = escapeHtml(page.title);
    const description = escapeHtml(page.description);
    const robots = page.robots ?? "index, follow";
    const jsonLd = page.jsonLd
      ? `<script id="route-json-ld" type="application/ld+json">${JSON.stringify(page.jsonLd).replaceAll("<", "\\u003c")}</script>`
      : "";
    const fallback = `<main id="seo-fallback" style="max-width:72rem;margin:0 auto;padding:8rem 1.5rem 4rem;color:#f5f5f4;font-family:Arial,sans-serif"><h1>${escapeHtml(page.heading)}</h1><p>${description}</p><p><a href="/services" style="color:#fb923c">Explore services</a> · <a href="/contact" style="color:#fb923c">Request a quote</a></p></main>`;

    return template
      .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
      .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${description}" />`)
      .replace(/<meta name="robots"[^>]*>/i, `<meta name="robots" content="${robots}" />`)
      .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`)
      .replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${page.type ?? "website"}" />`)
      .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`)
      .replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${image}" />`)
      .replace(/<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`)
      .replace(/<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}" />`)
      .replace(/<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${image}" />`)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, jsonLd)
      .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  };

  app.get("/preview.html", (_req, res) => res.redirect(301, "/"));
  app.use(express.static(staticRoot, { index: false, redirect: false }));
  app.get(/^(?!\/api).*/, (req, res) => {
    const pathname = req.path.length > 1 ? req.path.replace(/\/+$/, "") : "/";
    if (pathname !== req.path) {
      res.redirect(301, `${pathname}${req.url.slice(req.path.length)}`);
      return;
    }

    const page = getSeoPage(pathname);
    if (page) {
      if (pathname === "/admin") {
        res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
        if (!isAdminRequest(req)) {
          res.redirect(302, "/");
          return;
        }
      }
      res.status(200).type("html").send(renderPage(page));
      return;
    }

    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.status(404).type("html").send(renderPage(notFoundSeo(pathname)));
  });
}

export default app;
