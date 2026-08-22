---
name: Ironworks production routing build
description: Production HTML routing is served by the API process, which must build both the Vite frontend and API bundle.
---

Ironworks production must run the API server for the root web service rather than static hosting; its combined build supplies the server-rendered SEO template and frontend assets.

**Why:** Static hosting bypasses server-side titles, canonicals, redirects, 404 status, and admin noindex behavior. The Vite build also requires `PORT` and `BASE_PATH` during non-development builds.

**How to apply:** Keep the root service's production build pointed at the combined API build and its run command pointed at the API bundle. Do not remove the separate `/api` service or change database/Object Storage resources.