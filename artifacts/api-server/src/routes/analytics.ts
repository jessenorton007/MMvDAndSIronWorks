import { Router } from "express";
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = process.env["IRONWORKS_ANALYTICS_FILE"] || join(__dirname, "../../analytics-data.json");

// ── Types ────────────────────────────────────────────────────────────────────
interface VisitorRecord {
  id: string;
  fingerprint: string;
  firstSeen: number;
  lastSeen: number;
  sessionCount: number;
  pageviewCount: number;
  identified: { name?: string; email?: string; phone?: string };
}

interface SessionRecord {
  id: string;
  visitorId: string;
  startedAt: number;
  lastSeen: number;
  landingPage: string;
  exitPage: string;
  device: string;
  browser: string;
  screen: string;
  timezone: string;
  language: string;
  connection: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  fingerprint: string;
  isReturning: boolean;
  pageviews: string[];
  duration: number;
}

interface AnalyticsEvent {
  type: string;
  sessionId: string;
  visitorId: string;
  page: string;
  ts: number;
  data: Record<string, unknown>;
}

interface Store {
  visitors: Record<string, VisitorRecord>;
  sessions: Record<string, SessionRecord>;
  events: AnalyticsEvent[];
}

// ── In-memory store ──────────────────────────────────────────────────────────
let store: Store = { visitors: {}, sessions: {}, events: [] };
const MAX_EVENTS = 50_000;

async function loadStore() {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    store = JSON.parse(raw) as Store;
    if (!store.visitors) store.visitors = {};
    if (!store.sessions) store.sessions = {};
    if (!store.events) store.events = [];
  } catch {
    // fresh start — no file yet
  }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      await writeFile(DATA_FILE, JSON.stringify(store), "utf-8");
    } catch { /* non-fatal */ }
  }, 5_000);
}

loadStore().catch(() => {});

// ── Helpers ──────────────────────────────────────────────────────────────────
function rangeMs(range: string, from?: string, to?: string): [number, number] {
  const now = Date.now();
  if (from && to) return [new Date(from).getTime(), new Date(to).getTime()];
  const map: Record<string, number> = {
    today: 0,
    yesterday: 1,
    "7d": 7,
    "30d": 30,
    "60d": 60,
    "90d": 90,
  };
  const days = map[range] ?? 7;
  if (range === "today") {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return [start.getTime(), now];
  }
  if (range === "yesterday") {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 1);
    const end = new Date(start); end.setHours(23, 59, 59, 999);
    return [start.getTime(), end.getTime()];
  }
  return [now - days * 86_400_000, now];
}

// ── Router ───────────────────────────────────────────────────────────────────
const router = Router();

// POST /api/analytics/event  — ingest batch of events
router.post("/analytics/event", (req, res) => {
  const { events } = req.body as { events?: AnalyticsEvent[] };
  if (!Array.isArray(events) || events.length === 0) {
    res.status(400).json({ error: "events array required" });
    return;
  }

  for (const ev of events) {
    if (!ev.visitorId || !ev.sessionId || !ev.type) continue;

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

  scheduleSave();
  res.json({ ok: true, ingested: events.length });
});

// POST /api/analytics/identify  — link visitor to real identity
router.post("/analytics/identify", (req, res) => {
  const { visitorId, name, email, phone } = req.body as {
    visitorId?: string; name?: string; email?: string; phone?: string;
  };
  if (!visitorId) { res.status(400).json({ error: "visitorId required" }); return; }
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
  scheduleSave();
  res.json({ ok: true });
});

// GET /api/analytics/dashboard?range=7d&from=&to=
router.get("/analytics/dashboard", (req, res) => {
  const range = String(req.query.range || "7d");
  const [fromMs, toMs] = rangeMs(range, req.query.from as string, req.query.to as string);

  const sessionsInRange = Object.values(store.sessions).filter(
    s => s.startedAt >= fromMs && s.startedAt <= toMs
  );
  const visitorIdsInRange = new Set(sessionsInRange.map(s => s.visitorId));
  const eventsInRange = store.events.filter(e => e.ts >= fromMs && e.ts <= toMs);

  // Unique visitors
  const allVisitorIds = Object.keys(store.visitors);
  const firstSeenBefore = allVisitorIds.filter(id => store.visitors[id].firstSeen < fromMs);
  const returning = sessionsInRange.filter(s => store.visitors[s.visitorId]?.firstSeen < fromMs).length;
  const newV = sessionsInRange.filter(s => !firstSeenBefore.includes(s.visitorId)).length;
  const identified = [...visitorIdsInRange].filter(id => {
    const v = store.visitors[id];
    return v && (v.identified.name || v.identified.email || v.identified.phone);
  }).length;

  // Avg session duration (ms)
  const durations = sessionsInRange.map(s => s.duration).filter(d => d > 0);
  const avgDuration = durations.length ? Math.floor(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  // Top pages
  const pageCounts: Record<string, number> = {};
  eventsInRange.filter(e => e.type === "pageview" && (e.data as any).entry).forEach(e => {
    const p = e.page || "/";
    pageCounts[p] = (pageCounts[p] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([page, views]) => ({ page, views }));

  // Top products hovered/viewed
  const productCounts: Record<string, { title: string; hovers: number; clicks: number }> = {};
  eventsInRange.filter(e => e.type === "product_hover" && (e.data as any).action === "enter").forEach(e => {
    const id = String((e.data as any).productId || "");
    const title = String((e.data as any).productTitle || id);
    if (!productCounts[id]) productCounts[id] = { title, hovers: 0, clicks: 0 };
    productCounts[id].hovers += 1;
  });
  eventsInRange.filter(e => e.type === "click").forEach(e => {
    const href = String((e.data as any).href || "");
    if (href.startsWith("/shop/")) {
      const id = href.replace("/shop/", "");
      if (!productCounts[id]) productCounts[id] = { title: id, hovers: 0, clicks: 0 };
      productCounts[id].clicks += 1;
    }
  });
  const topProducts = Object.values(productCounts).sort((a, b) => (b.hovers + b.clicks) - (a.hovers + a.clicks)).slice(0, 8);

  // CTA clicks
  const ctaCounts: Record<string, number> = {};
  eventsInRange.filter(e => e.type === "click").forEach(e => {
    const text = String((e.data as any).text || "").slice(0, 60);
    if (text) ctaCounts[text] = (ctaCounts[text] || 0) + 1;
  });
  const topCtas = Object.entries(ctaCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, clicks]) => ({ label, clicks }));

  // Scroll depth averages per page
  const scrollData: Record<string, number[]> = {};
  eventsInRange.filter(e => e.type === "scroll_depth").forEach(e => {
    const p = e.page;
    if (!scrollData[p]) scrollData[p] = [];
    scrollData[p].push(Number((e.data as any).depth || 0));
  });
  const scrollDepths = Object.entries(scrollData).map(([page, depths]) => ({
    page,
    avg: Math.round(depths.reduce((a, b) => a + b, 0) / depths.length),
  })).sort((a, b) => b.avg - a.avg).slice(0, 6);

  // Device breakdown
  const deviceBreakdown: Record<string, number> = {};
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

  res.json({
    totalVisitors: visitorIdsInRange.size,
    newVisitors: newV,
    returningVisitors: returning,
    identifiedVisitors: identified,
    totalSessions: sessionsInRange.length,
    totalPageviews: eventsInRange.filter(e => e.type === "pageview" && (e.data as any).entry).length,
    avgSessionDuration: avgDuration,
    rageclicks,
    topPages,
    topProducts,
    topCtas,
    scrollDepths,
    deviceBreakdown,
    recentSessions,
  });
});

// GET /api/analytics/visitors  — paginated visitor list
router.get("/analytics/visitors", (_req, res) => {
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
  res.json({ visitors });
});

// GET /api/analytics/visitors/:id/events  — full event timeline for a visitor
router.get("/analytics/visitors/:id/events", (req, res) => {
  const { id } = req.params;
  const events = store.events
    .filter(e => e.visitorId === id)
    .sort((a, b) => a.ts - b.ts)
    .slice(-500);
  res.json({ events });
});

export default router;
