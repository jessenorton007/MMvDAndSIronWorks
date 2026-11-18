import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Eye, Clock, TrendingUp, Smartphone, Monitor, Tablet,
  MousePointer, Repeat, UserCheck, AlertTriangle, ChevronDown, ChevronRight,
  RefreshCw, Map as MapIcon, BarChart2, ShoppingBag as ShoppingBagIcon
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────
interface DashboardData {
  report?: { from: string; to: string; timezone: string; source: string; oldestEvent: string | null; eventLimit: number };
  totalVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  identifiedVisitors: number;
  totalSessions: number;
  totalPageviews: number;
  avgSessionDuration: number;
  rageclicks: number;
  totalClicks?: number;
  productClicks?: number;
  leadSubmits?: number;
  avgScrollDepth?: number;
  topPages: { page: string; views: number }[];
  topProducts: { title: string; hovers: number; clicks: number }[];
  topCtas: { label: string; clicks: number }[];
  topReferrers?: { referrer: string; sessions: number }[];
  conversionPaths?: { label: string; count: number }[];
  scrollDepths: { page: string; avg: number }[];
  deviceBreakdown: Record<string, number>;
  recentSessions: SessionWithVisitor[];
}

interface SessionWithVisitor {
  id: string;
  visitorId: string;
  startedAt: number;
  lastSeen: number;
  landingPage: string;
  exitPage: string;
  device: string;
  browser: string;
  timezone: string;
  referrer: string;
  utm_source: string;
  isReturning: boolean;
  pageviews: string[];
  duration: number;
  visitor: {
    id: string;
    firstSeen: number;
    sessionCount: number;
    pageviewCount: number;
    identified: { name?: string; email?: string; phone?: string };
  } | null;
}

const RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '60 days', value: '60d' },
  { label: '90 days', value: '90d' },
];

function fmsDuration(ms: number): string {
  if (ms < 1000) return '<1s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

function fmDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function pageName(p: string): string {
  if (!p || p === '/') return 'Home';
  if (p.startsWith('/shop/')) return 'Product: ' + p.replace('/shop/', '');
  if (p.startsWith('/pre-made/')) return 'Pre-Made: ' + p.replace('/pre-made/', '');
  if (p === '/contact') return 'Contact';
  if (p === '/admin') return 'Admin';
  return p;
}

function KpiCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string | number; sub?: string; icon: any; accent?: boolean;
}) {
  return (
    <div className="rounded-xl p-5" style={{ background: accent ? 'rgba(255,140,26,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${accent ? 'rgba(255,140,26,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,140,26,0.12)', border: '1px solid rgba(255,140,26,0.2)' }}>
          <Icon size={13} className="text-orange-400" />
        </div>
        <p className="text-xs font-display tracking-widest uppercase text-white/40">{label}</p>
      </div>
      <p className="text-3xl font-display text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-white/30 font-sans mt-1.5">{sub}</p>}
    </div>
  );
}

function Bar({ value, max, color = '#ff8c1a' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function SessionRow({ session }: { session: SessionWithVisitor }) {
  const [open, setOpen] = useState(false);
  const v = session.visitor;
  const identified = v?.identified;
  const label = identified?.name || identified?.email || session.visitorId.slice(0, 12) + '…';
  const isIdent = !!(identified?.name || identified?.email);

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-display"
          style={{ background: isIdent ? 'rgba(255,140,26,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isIdent ? 'rgba(255,140,26,0.3)' : 'rgba(255,255,255,0.1)'}`, color: isIdent ? '#ff8c1a' : 'rgba(255,255,255,0.4)' }}>
          {isIdent ? <UserCheck size={12} /> : <Users size={12} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-sans" style={{ color: isIdent ? '#ff8c1a' : 'rgba(255,255,255,0.7)' }}>{label}</span>
            {identified?.email && identified.name && <span className="text-xs text-white/30 truncate">{identified.email}</span>}
            {session.isReturning && (
              <span className="text-[10px] font-display tracking-widest uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,179,237,0.1)', color: '#63b3ed' }}>Returning</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-white/30 font-sans">{fmDate(session.startedAt)}</span>
            <span className="text-xs text-white/25">·</span>
            <span className="text-xs text-white/30">{fmsDuration(session.duration)}</span>
            <span className="text-xs text-white/25">·</span>
            <span className="text-xs text-white/30">{session.device || 'desktop'}</span>
            {session.referrer && session.referrer !== 'direct' && (
              <><span className="text-xs text-white/25">·</span><span className="text-xs text-white/25 truncate max-w-[140px]">from: {session.referrer.replace(/^https?:\/\//, '').split('/')[0]}</span></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-white/25 hidden sm:block">{session.pageviews.length} pages</span>
          {open ? <ChevronDown size={13} className="text-white/30" /> : <ChevronRight size={13} className="text-white/30" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 mt-3">
            {[
              { label: 'Landing', val: pageName(session.landingPage) },
              { label: 'Exit', val: pageName(session.exitPage) },
              { label: 'Browser', val: session.browser || '—' },
              { label: 'Timezone', val: session.timezone || '—' },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-[10px] font-display tracking-widest uppercase text-white/25 mb-0.5">{label}</p>
                <p className="text-xs text-white/65 font-sans truncate">{val}</p>
              </div>
            ))}
          </div>
          {session.pageviews.length > 0 && (
            <div>
              <p className="text-[10px] font-display tracking-widest uppercase text-white/25 mb-2">Pages visited</p>
              <div className="flex flex-wrap gap-1.5">
                {session.pageviews.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded font-sans" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                    {pageName(p)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {identified?.phone && (
            <p className="text-xs text-white/40 font-sans mt-2">📞 {identified.phone}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export function AnalyticsTab() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState<'api' | 'local'>('api');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const loadId = useRef(0);

  const load = useCallback(async () => {
    const currentLoad = ++loadId.current;
    setLoading(true);
    setError('');
    try {
      const dates = from && to ? `&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : '';
      const res = await fetch(`/api/analytics/dashboard?range=${range}${dates}`, { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (currentLoad !== loadId.current) return;
      setData(json as DashboardData);
      setSource('api');
    } catch (e) {
      if (currentLoad !== loadId.current) return;
      setData(null);
      setSource('api');
      setError('The website analytics could not be loaded. Check your admin sign-in and server connection, then refresh. Browser-only visits are not substituted for website traffic.');
    } finally {
      if (currentLoad === loadId.current) setLoading(false);
    }
  }, [range, from, to]);

  useEffect(() => { load(); }, [load, lastRefresh]);

  const deviceTotal = data ? Object.values(data.deviceBreakdown).reduce((a, b) => a + b, 0) : 0;

  return (
    <div>
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-widest text-white">Visitor Analytics</h2>
          <p className="text-white/35 text-xs font-sans mt-1">
            {data?.report?.source ?? 'Website tracker · Separate from Google Analytics'} · Mountain time
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => { setRange(r.value); setFrom(''); setTo(''); }}
                className="px-3 py-1.5 text-xs font-display tracking-widest uppercase transition-colors"
                style={{
                  background: range === r.value ? 'rgba(255,140,26,0.15)' : 'transparent',
                  color: range === r.value ? '#ff8c1a' : 'rgba(255,255,255,0.35)',
                  borderRight: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setLastRefresh(Date.now())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 text-white/50 text-sm space-y-3">
        <p>This dashboard counts visits recorded by this website. Google Analytics, Search Console, and Business Profile measure different activity. Compare the same dates and metric; totals may differ.</p>
        <div className="flex gap-4 flex-wrap"><label>From <input aria-label="Analytics start date" type="date" value={from} onChange={e => setFrom(e.target.value)} className="bg-black/30 border border-white/15 rounded p-2" /></label><label>Through <input aria-label="Analytics end date" type="date" min={from || undefined} value={to} onChange={e => setTo(e.target.value)} className="bg-black/30 border border-white/15 rounded p-2" /></label></div>
        {data?.report && <p>Showing {new Date(data.report.from).toLocaleString('en-US', {timeZone:'America/Denver'})} through {new Date(data.report.to).toLocaleString('en-US', {timeZone:'America/Denver'})} Mountain time. {data.report.oldestEvent ? `Available event history begins ${new Date(data.report.oldestEvent).toLocaleDateString('en-US', {timeZone:'America/Denver'})}.` : 'No recorded traffic yet.'} Up to {data.report.eventLimit.toLocaleString()} recent events are retained.</p>}
        <p className="text-xs">Visitors are distinct browser IDs. New means first seen during this period; returning means first seen earlier. Blocked tracking and cleared browser storage affect these estimates. Form submissions are lead signals, not verified sales.</p>
      </div>

      {error && (
        <div className="rounded-xl p-5 mb-6 flex items-center gap-3" style={{ background: source === 'local' ? 'rgba(255,140,26,0.06)' : 'rgba(255,80,80,0.06)', border: `1px solid ${source === 'local' ? 'rgba(255,140,26,0.2)' : 'rgba(255,80,80,0.2)'}` }}>
          <AlertTriangle size={16} className={`${source === 'local' ? 'text-orange-400' : 'text-red-400'} flex-shrink-0`} />
          <p className={`text-sm font-sans ${source === 'local' ? 'text-orange-200/75' : 'text-red-300/80'}`}>{error}</p>
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={20} className="text-orange-400 animate-spin" />
            <p className="text-white/30 text-sm font-sans">Loading analytics…</p>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* KPI Row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Visitors" value={data.totalVisitors} icon={Users}
              sub={`${data.newVisitors} new · ${data.returningVisitors} returning`} accent />
            <KpiCard label="Pageviews" value={data.totalPageviews} icon={Eye}
              sub={`${data.totalSessions} sessions`} />
            <KpiCard label="Avg Session" value={fmsDuration(data.avgSessionDuration)} icon={Clock} />
            <KpiCard label="Identified" value={data.identifiedVisitors} icon={UserCheck}
              sub={data.totalVisitors > 0 ? `${Math.round(data.identifiedVisitors / data.totalVisitors * 100)}% of visitors` : ''} />
          </div>

          {/* KPI Row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="New Visitors" value={data.newVisitors} icon={TrendingUp} />
            <KpiCard label="Returning" value={data.returningVisitors} icon={Repeat}
              sub={data.totalVisitors > 0 ? `${Math.round(data.returningVisitors / data.totalVisitors * 100)}% rate` : ''} />
            <KpiCard label="Rage Clicks" value={data.rageclicks} icon={AlertTriangle}
              sub="Frustrated taps detected" />
            <KpiCard label="Top Label Clicks" value={data.topCtas.reduce((s, c) => s + c.clicks, 0)} icon={MousePointer} sub="Sum of the displayed top labels" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Lead Signals" value={data.leadSubmits ?? 0} icon={UserCheck}
              sub="Form submit events; not confirmed orders" accent />
            <KpiCard label="Product Clicks" value={data.productClicks ?? 0} icon={ShoppingBagIcon}
              sub="Shop and pre-made detail clicks" />
            <KpiCard label="Total Clicks" value={data.totalClicks ?? data.topCtas.reduce((s, c) => s + c.clicks, 0)} icon={MousePointer} />
            <KpiCard label="Avg Scroll" value={`${data.avgScrollDepth ?? 0}%`} icon={MapIcon}
              sub="Average page depth reached" />
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Pages */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <Eye size={14} className="text-orange-400" />
                <h3 className="font-display uppercase tracking-widest text-sm text-white/60">Top Pages</h3>
              </div>
              {data.topPages.length === 0 ? (
                <p className="text-white/25 text-sm font-sans">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topPages.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-white/25 w-4 text-right font-display">{i + 1}</span>
                      <span className="text-sm text-white/75 font-sans flex-1 truncate">{pageName(p.page)}</span>
                      <Bar value={p.views} max={data.topPages[0].views} />
                      <span className="text-xs text-orange-400/70 font-display w-8 text-right">{p.views}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 size={14} className="text-orange-400" />
                <h3 className="font-display uppercase tracking-widest text-sm text-white/60">Product Interest</h3>
              </div>
              {data.topProducts.length === 0 ? (
                <p className="text-white/25 text-sm font-sans">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-white/25 w-4 text-right font-display">{i + 1}</span>
                      <span className="text-sm text-white/75 font-sans flex-1 truncate" title={p.title}>{p.title.replace(/,.*/, '').slice(0, 28)}</span>
                      <Bar value={p.hovers + p.clicks} max={(data.topProducts[0]?.hovers || 0) + (data.topProducts[0]?.clicks || 0)} />
                      <span className="text-xs text-orange-400/70 font-display w-8 text-right">{p.hovers + p.clicks}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Device Breakdown */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <Monitor size={14} className="text-orange-400" />
                <h3 className="font-display uppercase tracking-widest text-sm text-white/60">Devices</h3>
              </div>
              {deviceTotal === 0 ? (
                <p className="text-white/25 text-sm font-sans">No data yet</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(data.deviceBreakdown).map(([device, count]) => {
                    const Icon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor;
                    const pct = Math.round((count / deviceTotal) * 100);
                    return (
                      <div key={device}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon size={12} className="text-white/40" />
                            <span className="text-sm text-white/65 font-sans capitalize">{device}</span>
                          </div>
                          <span className="text-xs text-white/40 font-display">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#FF4D00,#FFB347)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {((data.topReferrers?.length ?? 0) > 0 || (data.conversionPaths?.length ?? 0) > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp size={14} className="text-orange-400" />
                  <h3 className="font-display uppercase tracking-widest text-sm text-white/60">Traffic Sources</h3>
                </div>
                {(data.topReferrers?.length ?? 0) === 0 ? (
                  <p className="text-white/25 text-sm font-sans">No referrer data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.topReferrers?.map((referrer, i) => (
                      <div key={referrer.referrer} className="flex items-center gap-3">
                        <span className="text-xs text-white/25 w-4 text-right font-display">{i + 1}</span>
                        <span className="text-sm text-white/75 font-sans flex-1 truncate">{referrer.referrer === 'direct' ? 'Direct / typed URL' : referrer.referrer.replace(/^https?:\/\//, '').split('/')[0]}</span>
                        <Bar value={referrer.sessions} max={data.topReferrers?.[0]?.sessions ?? referrer.sessions} />
                        <span className="text-xs text-orange-400/70 font-display w-8 text-right">{referrer.sessions}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <MapIcon size={14} className="text-orange-400" />
                  <h3 className="font-display uppercase tracking-widest text-sm text-white/60">Common Paths</h3>
                </div>
                {(data.conversionPaths?.length ?? 0) === 0 ? (
                  <p className="text-white/25 text-sm font-sans">No path data yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.conversionPaths?.map((path) => (
                      <div key={path.label} className="flex items-center gap-3">
                        <span className="text-sm text-white/70 font-sans flex-1 truncate">{path.label}</span>
                        <Bar value={path.count} max={data.conversionPaths?.[0]?.count ?? path.count} />
                        <span className="text-xs text-orange-400/70 font-display w-8 text-right">{path.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA Clicks */}
          {data.topCtas.length > 0 && (
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <MousePointer size={14} className="text-orange-400" />
                <h3 className="font-display uppercase tracking-widest text-sm text-white/60">Button & Link Clicks</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.topCtas.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-white/25 w-4 text-right font-display">{i + 1}</span>
                    <span className="text-sm text-white/70 font-sans flex-1 truncate">{c.label || '(unlabeled)'}</span>
                    <Bar value={c.clicks} max={data.topCtas[0].clicks} />
                    <span className="text-xs text-orange-400/70 font-display w-8 text-right">{c.clicks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scroll Depth */}
          {data.scrollDepths.length > 0 && (
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <MapIcon size={14} className="text-orange-400" />
                <h3 className="font-display uppercase tracking-widest text-sm text-white/60">Avg Scroll Depth by Page</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.scrollDepths.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-white/65 font-sans">{pageName(s.page)}</span>
                      <span className="text-xs text-orange-400/70 font-display">{s.avg}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.avg}%`, background: s.avg >= 75 ? '#22c55e' : s.avg >= 50 ? '#ff8c1a' : '#ef4444' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions / Visitors */}
          <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-5">
              <Users size={14} className="text-orange-400" />
              <h3 className="font-display uppercase tracking-widest text-sm text-white/60">
                Recent Sessions <span className="text-white/25 normal-case font-sans tracking-normal text-xs"> — click to expand</span>
              </h3>
            </div>
            {data.recentSessions.length === 0 ? (
              <p className="text-white/25 text-sm font-sans">No sessions yet in this period.</p>
            ) : (
              <div className="space-y-2">
                {data.recentSessions.map(s => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
