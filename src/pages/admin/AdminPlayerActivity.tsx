/**
 * @fileoverview Admin "Player Activity" dashboard.
 *
 * Three sections over a shared time window:
 *  1. Active players — who played recently and when their last cloud save was
 *  2. Rejected payloads — summary of secure telemetry RPC rejections
 *     (application_logs, label `TelemetryRPC`)
 *  3. Failed admin alerts — summary of failed send-admin-alert calls
 *     (application_logs, label `AdminAlert`)
 *
 * Route: /catking/activity
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Save,
  ShieldAlert,
  Bell,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { TELEMETRY_RPC_LOG_LABEL } from '@/lib/telemetryRpcAudit';
import { ADMIN_ALERT_LOG_LABEL } from '@/lib/adminAlertAudit';

const WINDOWS: Record<string, { label: string; hours: number }> = {
  '24h': { label: 'Last 24 hours', hours: 24 },
  '7d': { label: 'Last 7 days', hours: 24 * 7 },
  '30d': { label: 'Last 30 days', hours: 24 * 30 },
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

function countBy(rows: AuditRow[], key: (m: Record<string, unknown>) => string) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r.metadata ?? {});
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export default function AdminPlayerActivity() {
  const [window, setWindow] = useState<string>('24h');
  const hours = WINDOWS[window].hours;

  const players = useActivePlayers(hours);
  const rejected = useAuditRows(TELEMETRY_RPC_LOG_LABEL, hours);
  const alerts = useAuditRows(ADMIN_ALERT_LOG_LABEL, hours);

  const rejectedRows = rejected.data ?? [];
  const alertRows = alerts.data ?? [];

  const byRpc = countBy(rejectedRows, (m) => String(m.telemetry_rpc ?? 'unknown'));
  const byCategory = countBy(rejectedRows, (m) =>
    String(m.category_label ?? m.category ?? m.raw_server_message ?? 'Unknown'),
  );
  const byAlertKind = countBy(alertRows, (m) => (m.is_test === true ? 'Test alert' : 'Job alert'));

  const loading = players.isLoading || rejected.isLoading || alerts.isLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-7 w-7" /> Player Activity
            </h1>
            <p className="text-muted-foreground">
              Who's playing, plus rejected payload and failed alert health
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Window</Label>
            <Select value={window} onValueChange={setWindow}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WINDOWS).map(([key, w]) => (
                  <SelectItem key={key} value={key}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Players
              </CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              {players.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{players.data?.length ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Cloud save inside {WINDOWS[window].label.toLowerCase()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected Payloads
              </CardTitle>
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              {rejected.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{rejectedRows.length}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Secure telemetry RPC rejections
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Admin Alerts
              </CardTitle>
              <Bell className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              {alerts.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{alertRows.length}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                send-admin-alert failures
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active players */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Save className="h-5 w-5" /> Active Players &amp; Last Save
            </CardTitle>
          </CardHeader>
          <CardContent>
            {players.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (players.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No players saved within this window.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Last Save</TableHead>
                    <TableHead className="text-right">Day</TableHead>
                    <TableHead className="text-right">Cats</TableHead>
                    <TableHead className="text-right">Money</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.data!.map((p) => (
                    <TableRow key={p.user_id}>
                      <TableCell>
                        <span className="mr-2">{p.avatar_emoji ?? '😺'}</span>
                        <span className="font-medium">
                          {p.display_name ?? 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {fmtTime(p.last_played_at)}
                      </TableCell>
                      <TableCell className="text-right">{p.day}</TableCell>
                      <TableCell className="text-right">{p.cats}</TableCell>
                      <TableCell className="text-right">
                        ${p.money.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Rejected payloads + failed alerts summaries */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" /> Rejected Payloads
              </CardTitle>
              <Link
                to="/catking/telemetry"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                Open Telemetry <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {rejected.isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : rejectedRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rejected payloads in this window. 🎉
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">By RPC</p>
                    <div className="flex flex-wrap gap-2">
                      {byRpc.map(([rpc, count]) => (
                        <Badge key={rpc} variant="secondary">
                          {rpc}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Top rejection reasons
                    </p>
                    <div className="space-y-1">
                      {byCategory.slice(0, 6).map(([cat, count]) => (
                        <div key={cat} className="flex items-center justify-between text-sm">
                          <span className="truncate mr-2" title={cat}>
                            {cat}
                          </span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Most recent: {fmtTime(rejectedRows[0]?.timestamp ?? null)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-500" /> Failed Admin Alerts
              </CardTitle>
              <Link
                to="/catking/telemetry"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                Open Telemetry <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : alertRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No failed admin alerts in this window. 🎉
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">By type</p>
                    <div className="flex flex-wrap gap-2">
                      {byAlertKind.map(([kind, count]) => (
                        <Badge key={kind} variant="secondary">
                          {kind}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Recent failures
                    </p>
                    <div className="space-y-1">
                      {alertRows.slice(0, 5).map((r) => {
                        const m = r.metadata ?? {};
                        return (
                          <div key={r.id} className="flex items-center justify-between text-sm gap-2">
                            <span className="truncate" title={String(m.raw_server_message ?? r.message)}>
                              {String(m.raw_server_message ?? r.message)}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {fmtTime(r.timestamp)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {loading && (
          <p className="text-xs text-muted-foreground">Refreshing…</p>
        )}
      </div>
    </AdminLayout>
  );
}
