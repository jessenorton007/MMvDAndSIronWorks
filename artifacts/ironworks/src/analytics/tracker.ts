// D&S Iron Works — client-side analytics tracker
// Handles bot filtering, fingerprinting, session management, and behavioral event collection.
import { initGa4, trackGaEvent } from './ga4';

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

function getOrCreate(storage: Storage, key: string, prefix: string): string {
  let v = storage.getItem(key);
  if (!v) {
    v = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    storage.setItem(key, v);
  }
  return v;
}

type EvType = 'pageview' | 'click' | 'scroll_depth' | 'form_submit' | 'product_hover'
  | 'tab_hidden' | 'tab_visible' | 'idle' | 'active' | 'rage_click' | 'text_copy' | 'session_start';

interface TEvent {
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

// Recent clicks for rage detection
const _recentClicks: Array<{ x: number; y: number; ts: number }> = [];

function push(type: EvType, data: Record<string, unknown> = {}) {
  _queue.push({ type, sessionId: _sid, visitorId: _vid, page: _page, ts: Date.now(), data });
}

function storeLocalEvents(events: TEvent[]) {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || '[]') as TEvent[];
    const updated = [...current, ...events].slice(-LOCAL_EVENT_LIMIT);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(updated));
  } catch {
    /* Local analytics should never interrupt the site. */
  }
}

async function flush(keepalive = false) {
  if (_queue.length === 0) return;
  const batch = _queue.splice(0, _queue.length);
  storeLocalEvents(batch);
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive,
    });
  } catch { /* API may be down — fail silently */ }
}

function trackPageView(path: string) {
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
  window.setTimeout(() => {
    trackGaEvent('page_view', {
      page_location: window.location.href,
      page_path: `${window.location.pathname}${window.location.search}`,
      page_title: document.title,
    });
  }, 50);
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
  if (!_inited) return;
  if (entered) {
    push('product_hover', { productId, productTitle, action: 'enter' });
  } else {
    push('product_hover', { productId, productTitle, action: 'leave' });
  }
}

export function identifyVisitor(info: { name?: string; email?: string; phone?: string }) {
  if (!_inited) return;
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
  _sid = getOrCreate(sessionStorage, SID_KEY, 's');
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
    isReturning: !!localStorage.getItem(`${VID_KEY}_seen`),
  });
  localStorage.setItem(`${VID_KEY}_seen`, '1');
  push('pageview', { path: _page, entry: true });

  // Patch history for SPA navigation
  const origPush = history.pushState.bind(history);
  history.pushState = (...args) => {
    origPush(...args);
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
    resetIdle();
    const target = e.target as HTMLElement;
    const el = target.tagName.toLowerCase();
    const text = (target.textContent || '').slice(0, 80).trim();
    const href = (target as HTMLAnchorElement).href || target.closest('a')?.href || '';
    push('click', { el, text, href: href.replace(window.location.origin, ''), x: e.clientX, y: e.clientY });

    if (/^(tel:|mailto:|sms:)/i.test(href)) {
      trackGaEvent('contact_intent', { method: href.split(':')[0].toLowerCase(), link_text: text });
    } else if (/etsy\.com/i.test(href)) {
      trackGaEvent('shopping_intent', { destination: 'etsy', link_url: href, link_text: text });
    } else if (target.closest('[data-analytics-cta]')) {
      trackGaEvent('contact_intent', { method: 'website_cta', link_text: text });
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

  // Text copy
  document.addEventListener('copy', () => {
    const sel = window.getSelection()?.toString().slice(0, 200).trim() || '';
    if (sel) push('text_copy', { text: sel, path: _page });
  });

  // Tab visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      _activeMs += Date.now() - _lastActiveAt;
      push('tab_hidden', { path: _page });
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
    if (_flushTimer) clearInterval(_flushTimer);
  });

  // First flush after 3s to capture session_start
  setTimeout(() => flush(), 3_000);
}
