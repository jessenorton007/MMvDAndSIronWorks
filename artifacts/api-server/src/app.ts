import { breadcrumbSchema, breadcrumbsFor, websiteSchema } from './lib/seo-structure';
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
import { readPublicServices } from "./lib/service-content";
import { readPublicProducts, preMadeSeo, etsySeo, collectionSeo } from "./lib/product-content";
import { publicSitemap } from './lib/sitemap';
import { classesTransaction } from './lib/classes-store';

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
    const robots = page.robots ?? "index, follow, max-image-preview:large";
    const breadcrumbs = robots.includes("noindex") ? [] : breadcrumbsFor(page.path, page.heading);
    const breadcrumb = breadcrumbs.length ? breadcrumbSchema(page.path, page.heading) : undefined;
    const breadcrumbHtml = breadcrumbs.length ? `<nav aria-label="Breadcrumb"><ol>${breadcrumbs.map((item, i) => `<li>${i === breadcrumbs.length - 1 ? `<span aria-current="page">${escapeHtml(item.name)}</span>` : `<a href="${item.path}">${escapeHtml(item.name)}</a>`}</li>`).join("")}</ol></nav>` : "";
    const extraHead = `<script id="site-json-ld" type="application/ld+json">${JSON.stringify(websiteSchema)}</script>`
      + (breadcrumb ? `<script id="breadcrumb-json-ld" type="application/ld+json">${JSON.stringify(breadcrumb).replaceAll("<", "\\u003c")}</script>` : "")
      + `<meta property="og:site_name" content="D&amp;S Iron Works" /><meta property="og:locale" content="en_US" /><meta property="og:image:alt" content="${escapeHtml(page.heading)}" /><meta name="twitter:image:alt" content="${escapeHtml(page.heading)}" />`;
    const jsonLd = page.jsonLd
      ? `<script id="route-json-ld" type="application/ld+json">${JSON.stringify(page.jsonLd).replaceAll("<", "\\u003c")}</script>`
      : "";
    const fallback = `<main id="seo-fallback" style="max-width:72rem;margin:0 auto;padding:8rem 1.5rem 4rem;color:#f5f5f4;font-family:Arial,sans-serif">${breadcrumbHtml}<h1>${escapeHtml(page.heading)}</h1>${page.contentHtml ?? `<p>${description}</p>`}<p><a href="/services" style="color:#fb923c">Explore services</a> · <a href="/contact" style="color:#fb923c">Request a quote</a></p></main>`;

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
      .replace('</head>', `${extraHead}</head>`)
      .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`);
  };

  app.get("/index.html", (req, res) => res.redirect(301, `/${req.url.slice(req.path.length)}`));
  app.get("/preview.html", (_req, res) => res.redirect(301, "/"));
  // Read the same public collections as the pages; admin changes need no rebuild.
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache');
      res.type('application/xml').send(await publicSitemap());
    } catch (error) {
      logger.warn({ err: error }, 'Could not load current sitemap content');
      res.setHeader('Retry-After', '300');
      res.status(503).type('text').send('Sitemap temporarily unavailable.');
    }
  });
  app.use(express.static(staticRoot, { index: false, redirect: false, setHeaders(res, filePath) {
    if (/[/\\]assets[/\\]/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } }));
  app.get(/^(?!\/api).*/, async (req, res) => {
    const pathname = req.path.length > 1 ? req.path.replace(/\/+$/, "") : "/";
    if (pathname !== req.path) {
      res.redirect(301, `${pathname}${req.url.slice(req.path.length)}`);
      return;
    }

    let publicServices;
    if (pathname === "/" || pathname === "/services" || pathname.startsWith("/services/")) {
      try {
        publicServices = await readPublicServices();
      } catch (error) {
        logger.warn({ err: error }, "Could not load service content for HTML");
        res.setHeader("Retry-After", "300");
        res.status(503).type("text").send("Current content is temporarily unavailable. Please try again.");
        return;
      }
    }
    let page = getSeoPage(pathname, publicServices);
    if (pathname === '/classes' || pathname.startsWith('/classes/')) {
      try {
        const classes = await classesTransaction(state => state.classes.filter(c => c.published), false);
        const item = classes.find(c => `/classes/${c.slug}` === pathname);
        if (pathname === '/classes') {
          page = { path: pathname, title: 'Blacksmithing Classes | D&S Iron Works', heading: 'Blacksmithing Classes', description: 'Beginner, intermediate, advanced, and date night blacksmithing classes at D&S Iron Works.', contentHtml: '<p>Explore classes and upcoming sessions.</p><ul>' + classes.map(c => `<li><a href="/classes/${escapeHtml(c.slug)}">${escapeHtml(c.title)}</a></li>`).join('') + '</ul>' };
        } else if (item) {
          page = { path: pathname, title: `${item.title} | D&S Iron Works`, heading: item.title, description: item.description.slice(0, 160), image: item.images[0]?.src, contentHtml: `<p>${escapeHtml(item.description)}</p><p>${escapeHtml(item.duration)} · ${escapeHtml(item.location)}</p><p>Registration requests require D&S confirmation.</p>` };
        }
      } catch (error) { logger.warn({ err: error }, 'Could not load classes'); res.status(503).type('text').send('Classes are temporarily unavailable. Please try again.'); return; }
    }
    try {
      if (pathname === '/' && page) {
        const [preMade, etsy] = await Promise.all([readPublicProducts('premade-products'), readPublicProducts('etsy-products')]);
        const links = (items: { path: string; title: string }[]) => `<ul>${items.map(item => `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.title)}</a></li>`).join('')}</ul>`;
        page = { ...page, contentHtml: `<p>${escapeHtml(page.description)}</p><h2>Custom Metalwork Services</h2>`
          + links((publicServices ?? []).map(service => ({ path: `/services/${service.slug}`, title: service.title })))
          + '<h2><a href="/pre-made">Pre-Made Steel</a></h2>' + links(preMade.map(item => ({ path: `/pre-made/${item.id}`, title: item.title })))
          + '<h2><a href="/shop">Forge Shop</a></h2>' + links(etsy.map(item => ({ path: `/shop/${item.id}`, title: item.title })))
          + '<p><a href="/projects/forged-stair-balcony-railings">Forged stair and balcony railing project</a></p>' };
      } else if (pathname === '/pre-made') {
        page = collectionSeo('/pre-made', await readPublicProducts('premade-products'));
      } else if (pathname === '/shop') {
        page = collectionSeo('/shop', await readPublicProducts('etsy-products'));
      } else if (pathname.startsWith('/pre-made/')) {
        const products = await readPublicProducts('premade-products');
        const item = products.find(product => `/pre-made/${product.id}` === pathname);
        page = item ? preMadeSeo(item, products) : undefined;
      } else if (pathname.startsWith('/shop/')) {
        const products = await readPublicProducts('etsy-products');
        const item = products.find(product => `/shop/${product.id}` === pathname);
        page = item ? etsySeo(item) : undefined;
      }
    } catch (error) {
      logger.warn({ err: error }, 'Could not load product content for HTML');
      res.setHeader('Retry-After', '300');
      res.status(503).type('text').send('Current content is temporarily unavailable. Please try again.');
      return;
    }
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
