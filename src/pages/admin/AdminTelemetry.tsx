import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { mapTelemetryError } from '@/lib/telemetryErrorMessages';

type Row = {
  id: string;
  email: string;
  attempt_type: string;
  success: boolean;
  user_id: string | null;
  error_message: string | null;
  created_at: string;
  metadata: any;
};

const ATTEMPT_TYPES = [
  'admin_login', 'admin_login_failed', 'access_denied',
  'login', 'signup', 'password_reset', 'logout',
];

const PAGE_SIZE = 25;

export default function AdminTelemetry() {
  const [attemptType, setAttemptType] = useState<string>('');
  const [successFilter, setSuccessFilter] = useState<string>('');
  const [emailQuery, setEmailQuery] = useState('');
  const [emailDebounced, setEmailDebounced] = useState('');
  const [days, setDays] = useState<number>(7);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState<Array<{ date: string; success: number; failure: number }>>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEmailDebounced(emailQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [emailQuery]);

  useEffect(() => {
    setPage(1);
  }, [attemptType, successFilter, emailDebounced, days]);

  const sinceISO = useMemo(
    () => subDays(new Date(), days).toISOString(),
    [days]
  );

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('auth_attempts_log')
      .select('*', { count: 'exact' })
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (attemptType) q = q.eq('attempt_type', attemptType);
    if (successFilter === 'true') q = q.eq('success', true);
    if (successFilter === 'false') q = q.eq('success', false);
    if (emailDebounced) q = q.ilike('email', `%${emailDebounced}%`);

    const { data, count: c, error } = await q;
    if (!error) {
      setRows((data as Row[]) || []);
      setCount(c || 0);
    }
    setLoading(false);
  };

  const loadTrend = async () => {
    setTrendLoading(true);
    const { data, error } = await supabase
      .from('auth_attempts_log')
      .select('created_at, success')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: true })
      .limit(5000);
    if (!error && data) {
      const buckets = new Map<string, { success: number; failure: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const k = format(subDays(new Date(), i), 'yyyy-MM-dd');
        buckets.set(k, { success: 0, failure: 0 });
      }
      data.forEach((r: any) => {
        const k = format(new Date(r.created_at), 'yyyy-MM-dd');
        const b = buckets.get(k);
        if (b) (r.success ? b.success++ : b.failure++);
      });
      setTrend(Array.from(buckets, ([date, v]) => ({ date: date.slice(5), ...v })));
    }
    setTrendLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, attemptType, successFilter, emailDebounced, days]);
  useEffect(() => { loadTrend(); /* eslint-disable-next-line */ }, [days]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const typeBadge = (t: string) => {
    if (t.includes('failed') || t === 'access_denied')
      return <Badge variant="destructive">{t}</Badge>;
    if (t === 'admin_login') return <Badge className="bg-amber-600">{t}</Badge>;
    return <Badge variant="secondary">{t}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Auth Telemetry</h1>
            <p className="text-muted-foreground">
              Inspect submitted authentication and access telemetry records.
            </p>
          </div>
          <Button variant="outline" onClick={() => { load(); loadTrend(); }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ingestion Trend ({days}d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : trend.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="ok" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="ko" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="success" stroke="hsl(var(--primary))" fill="url(#ok)" stackId="1" />
                  <Area type="monotone" dataKey="failure" stroke="hsl(var(--destructive))" fill="url(#ko)" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No telemetry in the selected window.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Records ({count})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <Label>Email contains</Label>
                <Input
                  value={emailQuery}
                  onChange={(e) => setEmailQuery(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-1">
                <Label>Attempt type</Label>
                <Select value={attemptType || 'all'} onValueChange={(v) => setAttemptType(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {ATTEMPT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Outcome</Label>
                <Select value={successFilter || 'all'} onValueChange={(v) => setSuccessFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Success</SelectItem>
                    <SelectItem value="false">Failure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Window</Label>
                <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24h</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No records match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>{typeBadge(r.attempt_type)}</TableCell>
                        <TableCell>
                          {r.success
                            ? <Badge className="bg-green-600">success</Badge>
                            : <Badge variant="destructive">failure</Badge>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.email}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.user_id ? r.user_id.slice(0, 8) + '…' : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs">
                          {r.error_message ? (
                            (() => {
                              const mapped = mapTelemetryError(r.error_message);
                              return mapped.known ? (
                                <span
                                  className="block truncate"
                                  title={`Server: ${mapped.raw}`}
                                >
                                  {mapped.friendly}
                                </span>
                              ) : (
                                <span className="block truncate" title={r.error_message}>
                                  {r.error_message}
                                </span>
                              );
                            })()
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button
                  size="sm" variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
