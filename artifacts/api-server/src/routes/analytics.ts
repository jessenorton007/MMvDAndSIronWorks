import { Router, type RequestHandler } from "express";
import { isAdminRequest } from "./admin";
import { analyticsTransaction } from "../lib/analytics-store";
import type { AnalyticsEvent } from "../lib/analytics-types";

const MAX_EVENTS = 50_000;
const admin: RequestHandler = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  try { if (isAdminRequest(req)) { next(); return; } } catch {}
  res.status(401).json({ error: "Sign in to view analytics." });
};
const endpoint = (handler: RequestHandler): RequestHandler => async (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  try { await handler(req, res, next); }
  catch { if (!res.headersSent) res.status(503).json({ error: "Analytics storage is unavailable. Try again later." }); }
};
const validId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(v) && !["__proto__", "constructor", "prototype"].includes(v);
const allowedTypes = new Set(["session_start", "pageview", "click", "scroll_depth", "form_submit", "product_hover", "tab_hidden", "tab_visible", "idle", "active", "rage_click"]);
const cleanEventData = (data: Record<string, unknown>) => Object.fromEntries(Object.entries(data).filter(([k, v]) =>
  ["entry", "exit", "path", "duration", "device", "browser", "screen", "timezone", "language", "connection", "referrer", "utm_source", "utm_medium", "utm_campaign", "fingerprint", "isReturning", "productId", "productTitle", "action", "href", "text", "el", "x", "y", "count", "depth", "form"].includes(k)
  && ["string", "number", "boolean"].includes(typeof v)).map(([k,v]) => [k, typeof v === "string" ? v.slice(0,500) : v]));

// ── Helpers ──────────────────────────────────────────────────────────────────
const reportTimezone = "America/Denver";
function dayParts(ts: number) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: reportTimezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(ts).map(p => [p.type, Number(p.value)]));
}
function midnight(calendarDay: number) {
  let ts = calendarDay;
  for (let i = 0; i < 3; i++) {
    const p = dayParts(ts);
    ts += calendarDay - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  }
  return ts;
}
function rangeMs(range: string, from?: string, to?: string): [number, number] {
  const now = Date.now();
  if (from && to) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || !Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to)) || from > to) throw new Error("Invalid date range");
    return [midnight(Date.parse(from)), midnight(Date.parse(to) + 86400000) - 1];
  }
  const p = dayParts(now);
  const today = Date.UTC(p.year, p.month - 1, p.day);
  if (range === "today") return [midnight(today), now];
  if (range === "yesterday") return [midnight(today - 86400000), midnight(today) - 1];
  const days = ({ "7d": 7, "30d": 30, "60d": 60, "90d": 90 } as Record<string, number>)[range] ?? 7;
  return [midnight(today - (days - 1) * 86400000), now];
}

const router = Router();

// POST /api/analytics/event  — ingest batch of events
router.post("/analytics/event", endpoint(async (req, res) => {
  const result = await analyticsTransaction(store => {
  const { events } = req.body as { events?: AnalyticsEvent[] };
  if (!Array.isArray(events) || events.length === 0 || events.length > 100) {
    res.status(400).json({ error: "events array required" });
    return;
  }

  let ingested = 0;
  const existingEvents = new Set(store.events.map(e => e.id).filter(Boolean));
  for (const ev of events) {
    if (!ev || !validId(ev.visitorId) || !validId(ev.sessionId) || !allowedTypes.has(ev.type)
      || !Number.isFinite(ev.ts) || ev.ts < Date.now() - 90 * 86400000 || ev.ts > Date.now() + 300000
      || typeof ev.page !== "string" || !ev.page.startsWith("/") || ev.page.length > 500 || /^\/admin(?:\/|$)/.test(ev.page)
      || !ev.data || typeof ev.data !== "object" || Array.isArray(ev.data)) continue;
    if (ev.id && (!validId(ev.id) || existingEvents.has(ev.id))) continue;
    if (store.sessions[ev.sessionId] && store.sessions[ev.sessionId].visitorId !== ev.visitorId) continue;
    ev.data = cleanEventData(ev.data);
    if (ev.id) existingEvents.add(ev.id);
    ingested++;

    // Ensure visitor record
    if (!store.visitors[ev.visitorId]) {
      store.visitors[ev.visitorId] = {
        id: ev.visitorId,
        fingerprint: "",
        firstSeen: ev.ts,
        lastSeen: ev.ts,
        sessionCount: 0,
        pageviewCount: 0,
        identified: {},
      };
    }
    const visitor = store.visitors[ev.visitorId];
    visitor.firstSeen = Math.min(visitor.firstSeen, ev.ts);
    visitor.lastSeen = Math.max(visitor.lastSeen, ev.ts);

    // Ensure session record
    if (!store.sessions[ev.sessionId]) {
      store.sessions[ev.sessionId] = {
        id: ev.sessionId,
        visitorId: ev.visitorId,
        startedAt: ev.ts,
        lastSeen: ev.ts,
        landingPage: ev.page || "/",
        exitPage: ev.page || "/",
        device: "desktop",
        browser: "Unknown",
        screen: "",
        timezone: "",
        language: "",
        connection: "",
        referrer: "",
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        fingerprint: "",
        isReturning: false,
        pageviews: [],
        duration: 0,
      };
      visitor.sessionCount += 1;
    }
    const session = store.sessions[ev.sessionId];
    session.startedAt = Math.min(session.startedAt, ev.ts);
    session.lastSeen = Math.max(session.lastSeen, ev.ts);
    session.exitPage = ev.page || session.exitPage;
    session.duration = session.lastSeen - session.startedAt;

    // Enrich session with device data from session_start
    if (ev.type === "session_start" && ev.data) {
      const d = ev.data as Record<string, string>;
      session.device = d.device || session.device;
      session.browser = d.browser || session.browser;
      session.screen = d.screen || session.screen;
      session.timezone = d.timezone || session.timezone;
      session.language = d.language || session.language;
      session.connection = d.connection || session.connection;
      session.referrer = d.referrer || session.referrer;
      session.utm_source = d.utm_source || session.utm_source;
      session.utm_medium = d.utm_medium || session.utm_medium;
      session.utm_campaign = d.utm_campaign || session.utm_campaign;
      session.fingerprint = d.fingerprint || session.fingerprint;
      session.isReturning = !!(d as any).isReturning;
      visitor.fingerprint = session.fingerprint;
    }

    // Pageview counting
    if (ev.type === "pageview" && (ev.data as any).entry) {
      visitor.pageviewCount += 1;
      if (ev.page && !session.pageviews.includes(ev.page)) {
        session.pageviews.push(ev.page);
      }
    }

    // Trim events to cap
    if (store.events.length >= MAX_EVENTS) store.events.splice(0, 5000);
    store.events.push(ev);
  }

  return { ok: true, ingested };
  });
  if (!res.headersSent) res.json(result);
}));

// POST /api/analytics/identify  — link visitor to real identity
router.post("/analytics/identify", endpoint(async (req, res) => {
  const result = await analyticsTransaction(store => {
  const { visitorId, name, email, phone } = req.body as {
    visitorId?: string; name?: string; email?: string; phone?: string;
  };
  if (!validId(visitorId) || [name, email, phone].some(v => v !== undefined && (typeof v !== "string" || v.length > 254))) { res.status(400).json({ error: "Valid visitor and contact details required" }); return; }
  if (!store.visitors[visitorId]) {
    store.visitors[visitorId] = {
      id: visitorId, fingerprint: "", firstSeen: Date.now(), lastSeen: Date.now(),
      sessionCount: 0, pageviewCount: 0, identified: {},
    };
  }
  const id = store.visitors[visitorId].identified;
  if (name?.trim()) id.name = name.trim();
  if (email?.trim()) id.email = email.trim();
  if (phone?.trim()) id.phone = phone.trim();
  return { ok: true };
  });
  if (!res.headersSent) res.json(result);
}));

// GET /api/analytics/dashboard?range=7d&from=&to=
router.get("/analytics/dashboard", admin, endpoint(async (req, res) => {
  const result = await analyticsTransaction(store => {
  const range = String(req.query.range || "7d");
  const [fromMs, toMs] = rangeMs(range, req.query.from as string, req.query.to as string);

  const eventsInRange = store.events.filter(e => e.ts >= fromMs && e.ts <= toMs && !/^\/admin(?:\/|$)/.test(e.page));
  const activeSessions = new Set(eventsInRange.map(e => e.sessionId));
  const sessionsInRange = Object.values(store.sessions).filter(s => activeSessions.has(s.id));
  const visitorIdsInRange = new Set(sessionsInRange.map(s => s.visitorId));

  // Unique visitors
  const returning = [...visitorIdsInRange].filter(id => store.visitors[id]?.firstSeen < fromMs).length;
  const newV = visitorIdsInRange.size - returning;
  const identified = [...visitorIdsInRange].filter(id => {
    const v = store.visitors[id];
    return v && (v.identified.name || v.identified.email || v.identified.phone);
  }).length;

  // Avg session duration (ms)
  const durations = sessionsInRange.map(s => s.duration);
  const avgDuration = durations.length ? Math.floor(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  // Top pages
  const pageCounts: Record<string, number> = Object.create(null);
  eventsInRange.filter(e => e.type === "pageview" && (e.data as any).entry).forEach(e => {
    const p = e.page || "/";
    pageCounts[p] = (pageCounts[p] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([page, views]) => ({ page, views }));

  // Top products hovered/viewed
  const productCounts: Record<string, { title: string; hovers: number; clicks: number }> = Object.create(null);
  eventsInRange.filter(e => e.type === "product_hover" && (e.data as any).action === "enter").forEach(e => {
    const id = String((e.data as any).productId || "");
    const title = String((e.data as any).productTitle || id);
    if (!productCounts[id]) productCounts[id] = { title, hovers: 0, clicks: 0 };
    productCounts[id].hovers += 1;
  });
  eventsInRange.filter(e => e.type === "click").forEach(e => {
    const href = String((e.data as any).href || "");
    if (/^\/(shop|pre-made)\//.test(href)) {
      const id = href.replace(/^\/(shop|pre-made)\//, "");
      if (!productCounts[id]) productCounts[id] = { title: id, hovers: 0, clicks: 0 };
      productCounts[id].clicks += 1;
    }
  });
  const topProducts = Object.values(productCounts).sort((a, b) => (b.hovers + b.clicks) - (a.hovers + a.clicks)).slice(0, 8);

  // CTA clicks
  const ctaCounts: Record<string, number> = Object.create(null);
  eventsInRange.filter(e => e.type === "click").forEach(e => {
    const text = String((e.data as any).text || "").slice(0, 60);
    if (text) ctaCounts[text] = (ctaCounts[text] || 0) + 1;
  });
  const topCtas = Object.entries(ctaCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, clicks]) => ({ label, clicks }));

  // Scroll depth averages per page
  const scrollData: Record<string, number[]> = Object.create(null);
  const maxScroll = new Map<string, AnalyticsEvent>();
  eventsInRange.filter(e => e.type === "scroll_depth").forEach(e => {
    const key = `${e.sessionId}:${e.page}`;
    if (Number(e.data.depth) > Number(maxScroll.get(key)?.data.depth ?? -1)) maxScroll.set(key, e);
  });
  [...maxScroll.values()].forEach(e => {
    const p = e.page;
    if (!scrollData[p]) scrollData[p] = [];
    scrollData[p].push(Number((e.data as any).depth || 0));
  });
  const scrollDepths = Object.entries(scrollData).map(([page, depths]) => ({
    page,
    avg: Math.round(depths.reduce((a, b) => a + b, 0) / depths.length),
  })).sort((a, b) => b.avg - a.avg).slice(0, 6);

  // Device breakdown
  const deviceBreakdown: Record<string, number> = Object.create(null);
  sessionsInRange.forEach(s => {
    deviceBreakdown[s.device || "unknown"] = (deviceBreakdown[s.device || "unknown"] || 0) + 1;
  });

  // Recent sessions with visitor info
  const recentSessions = sessionsInRange
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 50)
    .map(s => ({
      ...s,
      visitor: store.visitors[s.visitorId] || null,
    }));

  // Rage clicks
  const rageclicks = eventsInRange.filter(e => e.type === "rage_click").length;
  const clicks = eventsInRange.filter(e => e.type === "click");
  const referrers: Record<string, number> = Object.create(null);
  sessionsInRange.forEach(s => { const ref = s.utm_source || s.referrer || "direct"; referrers[ref] = (referrers[ref] || 0) + 1; });
  const depths = [...maxScroll.values()].map(e => Number(e.data.depth) || 0);

  return {
    totalVisitors: visitorIdsInRange.size,
    newVisitors: newV,
    returningVisitors: returning,
    identifiedVisitors: identified,
    totalSessions: sessionsInRange.length,
    totalPageviews: eventsInRange.filter(e => e.type === "pageview" && (e.data as any).entry).length,
    avgSessionDuration: avgDuration,
    rageclicks,
    totalClicks: clicks.length,
    productClicks: clicks.filter(e => /^\/(shop|pre-made)\//.test(String(e.data.href))).length,
    leadSubmits: eventsInRange.filter(e => e.type === "form_submit").length,
    avgScrollDepth: depths.length ? Math.round(depths.reduce((a,b) => a+b,0) / depths.length) : 0,
    topReferrers: Object.entries(referrers).map(([referrer, sessions]) => ({referrer, sessions})).sort((a,b) => b.sessions-a.sessions),
    report: { from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString(), timezone: "America/Denver", source: process.env.NODE_ENV === "production" ? "Website tracker (not Google Analytics)" : "Development preview data (not live website traffic)", oldestEvent: store.events.length ? new Date(Math.min(...store.events.map(e => e.ts))).toISOString() : null, eventLimit: MAX_EVENTS },
    topPages,
    topProducts,
    topCtas,
    scrollDepths,
    deviceBreakdown,
    recentSessions,
  };
  }, false);
  res.json(result);
}));

// GET /api/analytics/visitors  — paginated visitor list
router.get("/analytics/visitors", admin, endpoint(async (_req, res) => {
  const result = await analyticsTransaction(store => {
  const visitors = Object.values(store.visitors)
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, 200)
    .map(v => ({
      ...v,
      sessions: Object.values(store.sessions)
        .filter(s => s.visitorId === v.id)
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 20),
    }));
  return { visitors };
  }, false);
  res.json(result);
}));

// GET /api/analytics/visitors/:id/events  — full event timeline for a visitor
router.get("/analytics/visitors/:id/events", admin, endpoint(async (req, res) => {
  const result = await analyticsTransaction(store => {
  const { id } = req.params;
  const events = store.events
    .filter(e => e.visitorId === id)
    .sort((a, b) => a.ts - b.ts)
    .slice(-500);
  return { events };
  }, false);
  res.json(result);
}));

export default router;
