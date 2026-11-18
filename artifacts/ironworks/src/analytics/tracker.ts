// D&S Iron Works — client-side analytics tracker
// Handles bot filtering, fingerprinting, session management, and behavioral event collection.
import { initGa4, trackGaEvent, setGaPage } from './ga4';

const BOT_PATTERN = /bot|crawl|spider|google|bing|slurp|duckduck|baidu|yandex|facebookexternalhit|twitterbot|linkedinbot|whatsapp|headless|phantomjs|selenium|playwright|puppeteer|lighthouse|wget|curl|python-requests/i;

function isBot(): boolean {
  const ua = navigator.userAgent;
  if (BOT_PATTERN.test(ua)) return true;
  if ((navigator as any).webdriver) return true;
  if (typeof navigator.languages === 'undefined' || navigator.languages.length === 0) return true;
  // Very fast load + no mouse movement detected before first interaction = likely bot
  return false;
}

function generateFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 100, 30);
      ctx.fillStyle = '#069';
      ctx.fillText('DS Iron', 2, 2);
    }
    const signals = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      String(navigator.hardwareConcurrency || 0),
      canvas.toDataURL(),
    ].join('||');
    let h = 0x811c9dc5;
    for (let i = 0; i < signals.length; i++) {
      h ^= signals.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return 'fp_' + h.toString(36);
  } catch {
    return 'fp_' + Date.now().toString(36);
  }
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  let browser = 'Other';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  const params = new URLSearchParams(window.location.search);
  return {
    type: isMobile ? (isTablet ? 'tablet' : 'mobile') : 'desktop',
    browser,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    connection: (navigator as any).connection?.effectiveType || 'unknown',
    referrer: document.referrer || 'direct',
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    fingerprint: generateFingerprint(),
  };
}

const VID_KEY = 'ds_avid';
const SID_KEY = 'ds_asid';
const LOCAL_EVENTS_KEY = 'ds_local_analytics_events_v1';
const LOCAL_EVENT_LIMIT = 3000;

function getOrCreate(storage: Storage | undefined, key: string, prefix: string): string {
  let v = safeGet(storage, key);
  if (!v) {
    v = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    safeSet(storage, key, v);
  }
  return v;
}

type EvType = 'pageview' | 'click' | 'scroll_depth' | 'form_submit' | 'product_hover'
  | 'tab_hidden' | 'tab_visible' | 'idle' | 'active' | 'rage_click' | 'text_copy' | 'session_start';

interface TEvent {
  id: string;
  type: EvType;
  sessionId: string;
  visitorId: string;
  page: string;
  ts: number;
  data: Record<string, unknown>;
}

let _vid = '';
let _sid = '';
let _page = '';
let _pageEnteredAt = 0;
let _queue: TEvent[] = [];
let _scrollMilestones = new Set<number>();
let _idleTimer: ReturnType<typeof setTimeout> | null = null;
let _isIdle = false;
let _activeMs = 0;
let _lastActiveAt = 0;
let _flushTimer: ReturnType<typeof setInterval> | null = null;
let _inited = false;
let _lastEventAt = 0;
let _flushing = false;
const SESSION_TIMEOUT = 30 * 60 * 1000;
const LAST_EVENT_KEY = 'ds_asid_last';
const PENDING_KEY = 'ds_pending_analytics_v2';
// Some privacy modes throw when accessing the storage property itself.
function browserStorage(kind: 'localStorage' | 'sessionStorage'): Storage | undefined {
  try { return window[kind]; } catch { return undefined; }
}
const localStorage = browserStorage('localStorage');
const sessionStorage = browserStorage('sessionStorage');
function safeGet(storage: Storage | undefined, key: string) { try { return storage?.getItem(key) ?? null; } catch { return null; } }
function safeSet(storage: Storage | undefined, key: string, value: string) { try { storage?.setItem(key, value); } catch {} }
const adminPage = (path: string) => /^\/admin(?:\/|$)/.test(path);
function persistQueue() { safeSet(sessionStorage, PENDING_KEY, JSON.stringify(_queue.slice(-1000))); }

// Recent clicks for rage detection
const _recentClicks: Array<{ x: number; y: number; ts: number }> = [];

function push(type: EvType, data: Record<string, unknown> = {}) {
  if (adminPage(_page)) return;
  const now = Date.now();
  if (type !== 'session_start' && now - _lastEventAt > SESSION_TIMEOUT) {
    const activeEvent = (type === 'pageview' && data.entry) || ['click', 'active', 'tab_visible', 'scroll_depth', 'product_hover', 'form_submit'].includes(type);
    if (!activeEvent) return;
    _sid = `s_${crypto.randomUUID()}`;
    safeSet(sessionStorage, SID_KEY, _sid);
    _lastEventAt = now;
    const d = getDeviceInfo();
    push('session_start', { ...d, device: d.type, isReturning: true });
    if (!(type === 'pageview' && data.entry)) push('pageview', {path: _page, entry: true});
  }
  _lastEventAt = now;
  safeSet(sessionStorage, LAST_EVENT_KEY, String(now));
  _queue.push({ id: crypto.randomUUID(), type, sessionId: _sid, visitorId: _vid, page: _page, ts: now, data });
  if (_queue.length > 1000) _queue.splice(0, _queue.length - 1000);
  persistQueue();
}

function storeLocalEvents(events: TEvent[]) {
  try {
    const current = JSON.parse(safeGet(localStorage, LOCAL_EVENTS_KEY) || '[]') as TEvent[];
    const updated = [...current, ...events].slice(-LOCAL_EVENT_LIMIT);
    safeSet(localStorage, LOCAL_EVENTS_KEY, JSON.stringify(updated));
  } catch {
    /* Local analytics should never interrupt the site. */
  }
}

async function flush(keepalive = false) {
  if (_queue.length === 0 || _flushing) return;
  _flushing = true;
  const batch = _queue.slice(0, 20);
  try {
    const response = await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive,
    });
    if (!response.ok) throw new Error('Analytics unavailable');
    const ids = new Set(batch.map(e => e.id));
    _queue = _queue.filter(e => !ids.has(e.id));
    persistQueue();
    storeLocalEvents(batch);
  } catch { /* Retain the same IDs for retry; the server deduplicates them. */ }
  finally { _flushing = false; }
}

function trackPageView(path: string) {
  setGaPage(path);
  initGa4();
  if (path === _page) return;
  if (_page) {
    const spent = Date.now() - _pageEnteredAt + _activeMs;
    push('pageview', { path: _page, exit: true, duration: spent });
  }
  _page = path;
  _pageEnteredAt = Date.now();
  _activeMs = 0;
  _scrollMilestones = new Set();
  push('pageview', { path, entry: true });
  // GA4 enhanced measurement already tracks History API navigation for this stream.
  // Sending a manual page_view here doubled route views in Google Analytics.
}

function resetIdle() {
  if (_isIdle) {
    _isIdle = false;
    _lastActiveAt = Date.now();
    push('active', {});
  }
  _lastActiveAt = Date.now();
  if (_idleTimer) clearTimeout(_idleTimer);
  _idleTimer = setTimeout(() => {
    if (!_isIdle) {
      _isIdle = true;
      // accumulate active time
      _activeMs += Date.now() - _lastActiveAt;
      push('idle', {});
    }
  }, 30_000); // idle after 30s of no interaction
}

export function trackProductHover(productId: string, productTitle: string, entered: boolean) {
  if (!_inited || adminPage(_page)) return;
  if (entered) {
    push('product_hover', { productId, productTitle, action: 'enter' });
  } else {
    push('product_hover', { productId, productTitle, action: 'leave' });
  }
}

export function identifyVisitor(info: { name?: string; email?: string; phone?: string }) {
  if (!_inited || adminPage(_page) || _page.startsWith('/classes')) return;
  const trimmed: Record<string, string> = {};
  if (info.name?.trim()) trimmed.name = info.name.trim();
  if (info.email?.trim()) trimmed.email = info.email.trim();
  if (info.phone?.trim()) trimmed.phone = info.phone.trim();
  if (Object.keys(trimmed).length === 0) return;

  fetch('/api/analytics/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId: _vid, sessionId: _sid, ...trimmed }),
  }).catch(() => {});
}

export function init() {
  if (_inited || typeof window === 'undefined') return;
  if (isBot()) return;
  _inited = true;
  initGa4();

  _vid = getOrCreate(localStorage, VID_KEY, 'v');
  _lastEventAt = Number(safeGet(sessionStorage, LAST_EVENT_KEY) || 0);
  if (Date.now() - _lastEventAt > SESSION_TIMEOUT) safeSet(sessionStorage, SID_KEY, `s_${crypto.randomUUID()}`);
  _sid = getOrCreate(sessionStorage, SID_KEY, 's');
  try { const pending = JSON.parse(safeGet(sessionStorage, PENDING_KEY) || '[]'); if (Array.isArray(pending)) _queue = pending.slice(-1000).filter(e => e && typeof e.id === 'string'); } catch {}
  _page = window.location.pathname;
  _pageEnteredAt = Date.now();
  _lastActiveAt = Date.now();

  const device = getDeviceInfo();

  // Session start event with device info
  push('session_start', {
    path: _page,
    device: device.type,
    browser: device.browser,
    screen: device.screen,
    timezone: device.timezone,
    language: device.language,
    connection: device.connection,
    referrer: device.referrer,
    utm_source: device.utm_source,
    utm_medium: device.utm_medium,
    utm_campaign: device.utm_campaign,
    fingerprint: device.fingerprint,
    isReturning: !!safeGet(localStorage, `${VID_KEY}_seen`),
  });
  safeSet(localStorage, `${VID_KEY}_seen`, '1');
  push('pageview', { path: _page, entry: true });

  // Patch history for SPA navigation
  const origPush = history.pushState.bind(history);
  history.pushState = (...args) => {
    const next = args[2] ? new URL(String(args[2]), window.location.href).pathname : window.location.pathname;
    setGaPage(next);
    origPush(...args);
    setTimeout(() => trackPageView(window.location.pathname), 0);
  };
  const origReplace = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    const next = args[2] ? new URL(String(args[2]), window.location.href).pathname : window.location.pathname;
    setGaPage(next);
    origReplace(...args);
    setTimeout(() => trackPageView(window.location.pathname), 0);
  };
  window.addEventListener('popstate', () => trackPageView(window.location.pathname));

  // Scroll depth
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = Math.floor((scrolled / total) * 100);
      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !_scrollMilestones.has(milestone)) {
          _scrollMilestones.add(milestone);
          push('scroll_depth', { depth: milestone, path: _page });
        }
      }
    });
  }, { passive: true });

  // Click tracking + rage click detection
  document.addEventListener('click', (e) => {
    if (adminPage(window.location.pathname)) return;
    resetIdle();
    const target = e.target as HTMLElement;
    const el = target.tagName.toLowerCase();
    const text = (target.closest('a, button')?.textContent || target.textContent || '').slice(0, 80).trim();
    const href = (target as HTMLAnchorElement).href || target.closest('a')?.href || '';
    push('click', { el, text, href: href.replace(window.location.origin, ''), x: e.clientX, y: e.clientY });

    if (/^(tel:|mailto:|sms:)/i.test(href)) {
      trackGaEvent('contact_intent', { method: href.split(':')[0].toLowerCase(), link_text: text });
    } else if (/etsy\.com/i.test(href)) {
      trackGaEvent('shopping_intent', { destination: 'etsy', link_url: href, link_text: text });
    } else if (target.closest('[data-analytics-cta]')) {
      trackGaEvent('contact_intent', { method: 'website_cta', cta: target.closest('[data-analytics-cta]')?.getAttribute('data-analytics-cta') ?? '', link_text: text });
    }

    // Rage click: 3+ clicks within 40px and 1000ms
    const now = Date.now();
    _recentClicks.push({ x: e.clientX, y: e.clientY, ts: now });
    const recent = _recentClicks.filter(c => now - c.ts < 1000 && Math.abs(c.x - e.clientX) < 40 && Math.abs(c.y - e.clientY) < 40);
    if (recent.length >= 3) {
      push('rage_click', { el, text, x: e.clientX, y: e.clientY, count: recent.length });
      _recentClicks.length = 0;
    }
    if (_recentClicks.length > 20) _recentClicks.splice(0, 10);
  }, true);

  // Tab visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      _activeMs += Date.now() - _lastActiveAt;
      push('tab_hidden', { path: _page });
      void flush(true);
    } else {
      _lastActiveAt = Date.now();
      push('tab_visible', { path: _page });
    }
  });

  // Idle detection
  ['mousemove', 'keydown', 'touchstart', 'wheel'].forEach(ev =>
    document.addEventListener(ev, resetIdle, { passive: true })
  );
  resetIdle();

  // Form submission interception for visitor identification
  document.addEventListener('submit', (e) => {
    if (adminPage(window.location.pathname) || window.location.pathname.startsWith('/classes')) return;
    const form = e.target as HTMLFormElement;
    const data: Record<string, string> = {};
    const fd = new FormData(form);
    fd.forEach((v, k) => { if (typeof v === 'string') data[k] = v; });

    const nameVal = data.name || data.fullName || data.full_name || '';
    const emailVal = data.email || data.email_address || '';
    const phoneVal = data.phone || data.phone_number || '';
    if (nameVal || emailVal || phoneVal) {
      identifyVisitor({ name: nameVal, email: emailVal, phone: phoneVal });
    }
    push('form_submit', { form: form.id || form.className.split(' ')[0] || 'form', fields: Object.keys(data) });
  }, true);

  // Flush every 10s
  _flushTimer = setInterval(() => flush(), 10_000);

  // Flush on page unload
  window.addEventListener('pagehide', () => flush(true));
  window.addEventListener('beforeunload', () => {
    _activeMs += document.hidden ? 0 : Date.now() - _lastActiveAt;
    push('pageview', { path: _page, exit: true, duration: Date.now() - _pageEnteredAt });
    flush(true);
    // Do not cancel the timer: Back/Forward Cache can restore this document.
  });

  // Start immediately so short visits are not lost before the first timer fires.
  void flush();
}
