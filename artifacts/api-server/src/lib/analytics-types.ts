// ── Types ────────────────────────────────────────────────────────────────────
export interface VisitorRecord {
  id: string;
  fingerprint: string;
  firstSeen: number;
  lastSeen: number;
  sessionCount: number;
  pageviewCount: number;
  identified: { name?: string; email?: string; phone?: string };
}

export interface SessionRecord {
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

export interface AnalyticsEvent {
  id?: string;
  type: string;
  sessionId: string;
  visitorId: string;
  page: string;
  ts: number;
  data: Record<string, unknown>;
}

export interface Store {
  visitors: Record<string, VisitorRecord>;
  sessions: Record<string, SessionRecord>;
  events: AnalyticsEvent[];
}

