/**
 * @fileoverview Admin "Player Activity" dashboard — industrial data console.
 *
 * Sections over a shared time window (24h / 7d / 30d):
 *  1. KPI strip — active players, rejected payloads, failed alerts, cats in play
 *  2. Active players — who played recently and when their last cloud save was
 *  3. Rejected payloads — secure telemetry RPC rejections
 *     (application_logs, label `TelemetryRPC`)
 *  4. Failed admin alerts — failed send-admin-alert calls
 *     (application_logs, label `AdminAlert`)
 *
 * Route: /catking/activity
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  ShieldAlert,
  Bell,
  Cat,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { TELEMETRY_RPC_LOG_LABEL } from '@/lib/telemetryRpcAudit';
import { ADMIN_ALERT_LOG_LABEL } from '@/lib/adminAlertAudit';

const WINDOWS: Record<string, { label: string; short: string; hours: number }> = {
  '24h': { label: 'Last 24 hours', short: '24h', hours: 24 },
  '7d': { label: 'Last 7 days', short: '7d', hours: 24 * 7 },
  '30d': { label: 'Last 30 days', short: '30d', hours: 24 * 30 },
};

interface ActivePlayer {
  user_id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  email: string | null;
  last_played_at: string | null;
  day: number;
  cats: number;
  money: number;
}

/** Players with a cloud save inside the window, newest first. */
function useActivePlayers(hours: number) {
  return useQuery({
    queryKey: ['admin-active-players', hours],
    queryFn: async () => {
      const since = new Date(Date.now() - hours * 3600_000).toISOString();

      const { data: saves, error: savesError } = await supabase
        .from('game_saves')
        .select('user_id, last_played_at, game_state')
        .gte('last_played_at', since)
        .order('last_played_at', { ascending: false })
        .limit(200);
      if (savesError) throw savesError;

      const userIds = (saves ?? []).map((s) => s.user_id);
      if (userIds.length === 0) return [] as ActivePlayer[];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, email')
        .in('id', userIds);
      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return (saves ?? []).map((s) => {
        const gs = (s.game_state ?? {}) as Record<string, unknown>;
        const p = profileMap.get(s.user_id);
        return {
          user_id: s.user_id,
          display_name: p?.display_name ?? p?.email ?? null,
          avatar_emoji: p?.avatar_emoji ?? null,
          email: p?.email ?? null,
          last_played_at: s.last_played_at,
          day: typeof gs.day === 'number' ? gs.day : 0,
          cats: Array.isArray(gs.cats) ? gs.cats.length : 0,
          money: typeof gs.money === 'number' ? gs.money : 0,
        } satisfies ActivePlayer;
      });
    },
    staleTime: 30000,
  });
}

interface AuditRow {
  id: string;
  message: string;
  timestamp: string | null;
  metadata: Record<string, unknown> | null;
}

function useAuditRows(label: string, hours: number) {
  return useQuery({
    queryKey: ['admin-audit-summary', label, hours],
    queryFn: async () => {
      const since = new Date(Date.now() - hours * 3600_000).toISOString();
      const { data, error } = await supabase
        .from('application_logs')
        .select('id, message, timestamp, metadata')
        .eq('label', label)
        .gte('timestamp', since)
        .order('timestamp', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
    staleTime: 30000,
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

/** "2m ago" style relative label, falling back to a date for old rows. */
function fmtRelative(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtClock(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string | null): string {
  if (!name) return '??';
  const parts = name.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '');
  return letters.toUpperCase() || '??';
}

function countBy(rows: AuditRow[], key: (m: Record<string, unknown>) => string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r.metadata ?? {});
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

interface KpiProps {
  label: string;
  value: number | null;
  loading: boolean;
  icon: React.ReactNode;
  footnote: string;
  tone?: 'neutral' | 'warn' | 'alert';
}

function Kpi({ label, value, loading, icon, footnote, tone = 'neutral' }: KpiProps) {
  const toneClass =
    tone === 'alert'
      ? 'text-rose-600 dark:text-rose-400'
      : tone === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : 'admin-muted';
  return (
    <div className="admin-panel admin-fade-in p-5">
      <div className="flex items-start justify-between">
        <p className="admin-label">{label}</p>
        <span className="admin-muted">{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-20 mt-2" />
      ) : (
        <p className="admin-display text-3xl font-bold mt-2 tabular-nums">
          {(value ?? 0).toLocaleString()}
        </p>
      )}
      <p className={`mt-3 text-xs font-medium ${toneClass}`}>{footnote}</p>
    </div>
  );
}

export default function AdminPlayerActivity() {
  const [window, setWindow] = useState<string>('24h');
  const hours = WINDOWS[window].hours;

  const players = useActivePlayers(hours);
  const rejected = useAuditRows(TELEMETRY_RPC_LOG_LABEL, hours);
  const alerts = useAuditRows(ADMIN_ALERT_LOG_LABEL, hours);

  const playerRows = players.data ?? [];
  const rejectedRows = rejected.data ?? [];
  const alertRows = alerts.data ?? [];

  const byRpc = countBy(rejectedRows, (m) => String(m.telemetry_rpc ?? 'unknown'));
  const byCategory = countBy(rejectedRows, (m) =>
    String(m.category_label ?? m.category ?? m.raw_server_message ?? 'Unknown'),
  );
  const byAlertKind = countBy(alertRows, (m) => (m.is_test === true ? 'Test alert' : 'Job alert'));
  const catsInPlay = playerRows.reduce((sum, p) => sum + p.cats, 0);

  const refreshing = players.isFetching || rejected.isFetching || alerts.isFetching;

  const refreshAll = () => {
    players.refetch();
    rejected.refetch();
    alerts.refetch();
  };

  return (
    <AdminLayout>
      <div className="admin-console -m-4 p-4 md:-m-6 md:p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="admin-display text-2xl font-bold">Overview</h1>
              <p className="text-sm admin-muted mt-1">
                Active players, save health and telemetry rejections.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshAll}
                className="admin-muted hover:opacity-70 transition-opacity"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="admin-seg">
                {Object.entries(WINDOWS).map(([key, w]) => (
                  <button
                    key={key}
                    className="admin-seg-btn"
                    data-active={window === key}
                    onClick={() => setWindow(key)}
                  >
                    {w.short}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Kpi
              label="Active Players"
              value={playerRows.length}
              loading={players.isLoading}
              icon={<Users className="h-4 w-4" />}
              footnote={`Cloud save in ${WINDOWS[window].label.toLowerCase()}`}
            />
            <Kpi
              label="Rejected Payloads"
              value={rejectedRows.length}
              loading={rejected.isLoading}
              icon={<ShieldAlert className="h-4 w-4" />}
              footnote={rejectedRows.length ? 'Validation errors' : 'No validation errors'}
              tone={rejectedRows.length ? 'warn' : 'neutral'}
            />
            <Kpi
              label="Failed Alerts"
              value={alertRows.length}
              loading={alerts.isLoading}
              icon={<Bell className="h-4 w-4" />}
              footnote={alertRows.length ? 'Requires attention' : 'All alerts delivered'}
              tone={alertRows.length ? 'alert' : 'neutral'}
            />
            <Kpi
              label="Cats In Play"
              value={catsInPlay}
              loading={players.isLoading}
              icon={<Cat className="h-4 w-4" />}
              footnote="Across active players"
            />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Players table */}
            <div className="lg:col-span-2 admin-panel admin-fade-in overflow-hidden flex flex-col">
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid hsl(var(--admin-line))' }}
              >
                <h2 className="admin-display font-bold">Active Players &amp; Last Save</h2>
                <Link
                  to="/catking/users"
                  className="admin-accent text-xs font-bold hover:underline"
                >
                  View all
                </Link>
              </div>

              {players.isLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : playerRows.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="admin-label">No saves in this window</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        style={{
                          backgroundColor: 'hsl(var(--admin-surface))',
                          borderBottom: '1px solid hsl(var(--admin-line))',
                        }}
                      >
                        <th className="px-6 py-3 admin-label">Player</th>
                        <th className="px-6 py-3 admin-label">Last Save</th>
                        <th className="px-6 py-3 admin-label text-right">Day</th>
                        <th className="px-6 py-3 admin-label text-right">Cats</th>
                        <th className="px-6 py-3 admin-label text-right">Money</th>
                      </tr>
                    </thead>
                    <tbody className="admin-divide">
                      {playerRows.map((p) => (
                        <tr key={p.user_id} className="admin-row transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold admin-inset"
                                title={p.email ?? undefined}
                              >
                                {p.avatar_emoji ?? initials(p.display_name)}
                              </div>
                              <span className="text-sm font-bold">
                                {p.display_name ?? 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm admin-muted">
                            <span title={fmtTime(p.last_played_at)}>
                              {fmtRelative(p.last_played_at)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right tabular-nums">{p.day}</td>
                          <td className="px-6 py-4 text-sm text-right tabular-nums">{p.cats}</td>
                          <td className="px-6 py-4 text-sm font-medium text-right tabular-nums">
                            ${p.money.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Side panels */}
            <div className="space-y-8">
              {/* Rejected payloads */}
              <div className="admin-panel admin-fade-in">
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid hsl(var(--admin-line))' }}
                >
                  <h2 className="admin-display font-bold">Rejected Payloads</h2>
                  <Link
                    to="/catking/telemetry"
                    className="admin-accent text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    Telemetry <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="p-4 space-y-3">
                  {rejected.isLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : rejectedRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 admin-muted">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                        style={{ border: '1px dashed hsl(var(--admin-line))' }}
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <p className="admin-label">No rejections</p>
                    </div>
                  ) : (
                    <>
                      {rejectedRows.slice(0, 4).map((r) => {
                        const m = r.metadata ?? {};
                        return (
                          <div key={r.id} className="admin-inset p-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-bold admin-accent uppercase tracking-wide">
                                {String(m.telemetry_rpc ?? 'unknown')}
                              </span>
                              <span className="text-[10px] font-medium admin-muted whitespace-nowrap">
                                {fmtClock(r.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs mt-1">
                              {String(m.raw_server_message ?? m.category_label ?? r.message)}
                            </p>
                          </div>
                        );
                      })}
                      <div className="pt-1 space-y-1">
                        <p className="admin-label">By RPC</p>
                        {byRpc.map(([rpc, count]) => (
                          <div
                            key={rpc}
                            className="flex items-center justify-between text-xs admin-muted"
                          >
                            <span className="truncate mr-2">{rpc}</span>
                            <span className="font-bold tabular-nums">{count}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-1 space-y-1">
                        <p className="admin-label">Top reasons</p>
                        {byCategory.slice(0, 4).map(([cat, count]) => (
                          <div
                            key={cat}
                            className="flex items-center justify-between text-xs admin-muted"
                          >
                            <span className="truncate mr-2" title={cat}>
                              {cat}
                            </span>
                            <span className="font-bold tabular-nums">{count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Failed admin alerts */}
              <div className="admin-panel admin-fade-in">
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{ borderBottom: '1px solid hsl(var(--admin-line))' }}
                >
                  <h2 className="admin-display font-bold">Admin Alerts</h2>
                  <Link
                    to="/catking/telemetry"
                    className="admin-accent text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    Telemetry <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="p-4 space-y-3">
                  {alerts.isLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : alertRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 admin-muted">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
                        style={{ border: '1px dashed hsl(var(--admin-line))' }}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                      <p className="admin-label">No failed alerts</p>
                    </div>
                  ) : (
                    <>
                      {alertRows.slice(0, 4).map((r) => {
                        const m = r.metadata ?? {};
                        return (
                          <div
                            key={r.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50"
                          >
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-rose-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-rose-900 dark:text-rose-200 truncate">
                                {m.is_test === true ? 'Test alert failed' : 'Job alert failed'}
                              </p>
                              <p className="text-[10px] text-rose-700 dark:text-rose-300 mt-0.5 break-words">
                                {String(m.raw_server_message ?? r.message)}
                              </p>
                              <p className="text-[10px] admin-muted mt-1">
                                {fmtTime(r.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-1 space-y-1">
                        <p className="admin-label">By type</p>
                        {byAlertKind.map(([kind, count]) => (
                          <div
                            key={kind}
                            className="flex items-center justify-between text-xs admin-muted"
                          >
                            <span>{kind}</span>
                            <span className="font-bold tabular-nums">{count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
