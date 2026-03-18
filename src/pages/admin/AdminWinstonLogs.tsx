import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  useWinstonLogs,
  useWinstonLogStats,
  useWinstonLogTrends,
  useDeleteWinstonLogs,
  useClearWinstonLogs,
  useRealtimeWinstonLogs,
} from '@/hooks/admin/useWinstonLogs';
import {
  LOG_LEVELS,
  LOG_LEVEL_COLORS,
  LOG_LEVEL_EMOJI,
  type WinstonLogLevel,
} from '@/lib/winston-logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  Search,
  Radio,
  Pause,
  Play,
  Copy,
  Terminal,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const LEVEL_ORDER: WinstonLogLevel[] = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

export default function AdminWinstonLogs() {
  const [levelFilter, setLevelFilter] = useState<WinstonLogLevel | ''>('');
  const [labelFilter, setLabelFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  const { toast } = useToast();

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    clearTimeout((window as any).__winstonSearchTimer);
    (window as any).__winstonSearchTimer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const { data, isLoading, refetch, isFetching } = useWinstonLogs({
    level: levelFilter || undefined,
    label: labelFilter || undefined,
    source: sourceFilter || undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize: 50,
  });

  const { data: stats, isLoading: statsLoading } = useWinstonLogStats();
  const { data: trends } = useWinstonLogTrends();
  const deleteMutation = useDeleteWinstonLogs();
  const clearMutation = useClearWinstonLogs();
  const { realtimeLogs, clearRealtime } = useRealtimeWinstonLogs();

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedLogs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const logs = liveMode ? realtimeLogs : data?.logs || [];
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map((l) => l.id)));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(Array.from(selectedLogs));
      toast({ title: 'Logs Deleted', description: `${selectedLogs.size} log(s) deleted` });
      setSelectedLogs(new Set());
      setDeleteDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearMutation.mutateAsync({});
      toast({ title: 'All Logs Cleared' });
      setClearDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const copyLogToClipboard = (log: any) => {
    const text = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  // Pie chart data for level distribution
  const pieData = useMemo(() => {
    if (!stats?.levelCounts) return [];
    return LEVEL_ORDER
      .filter((lvl) => (stats.levelCounts[lvl] || 0) > 0)
      .map((lvl) => ({
        name: lvl,
        value: stats.levelCounts[lvl] || 0,
        color: LOG_LEVEL_COLORS[lvl],
      }));
  }, [stats]);

  const sourcePieData = useMemo(() => {
    if (!stats?.sourceCounts) return [];
    const colors: Record<string, string> = {
      client: '#3b82f6',
      edge_function: '#8b5cf6',
      cron: '#f59e0b',
      system: '#ef4444',
    };
    return Object.entries(stats.sourceCounts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: k, value: v, color: colors[k] || '#6b7280' }));
  }, [stats]);

  const displayLogs = liveMode ? realtimeLogs : data?.logs || [];
  const totalPages = Math.ceil((data?.totalCount || 0) / 50);

  const getLevelBadge = (level: string) => {
    const lvl = level as WinstonLogLevel;
    const emoji = LOG_LEVEL_EMOJI[lvl] || '⚪';
    const colorMap: Record<string, string> = {
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      warn: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      http: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      verbose: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      debug: 'bg-green-500/20 text-green-400 border-green-500/30',
      silly: 'bg-gray-500/20 text-muted-foreground border-gray-500/30',
    };
    return (
      <Badge variant="outline" className={colorMap[level] || ''}>
        {emoji} {level}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Terminal className="h-8 w-8" />
              Winston Logger
            </h1>
            <p className="text-muted-foreground">
              Structured application logging inspired by{' '}
              <a
                href="https://github.com/winstonjs/winston"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                winstonjs/winston
              </a>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={liveMode ? 'default' : 'outline'}
              onClick={() => setLiveMode(!liveMode)}
              className={liveMode ? 'animate-pulse' : ''}
            >
              {liveMode ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {liveMode ? 'Live' : 'Live Mode'}
              {liveMode && <Radio className="h-3 w-3 ml-1 text-red-400" />}
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setClearDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {LEVEL_ORDER.map((lvl) => (
            <Card
              key={lvl}
              className={`cursor-pointer transition-all hover:scale-105 ${levelFilter === lvl ? 'ring-2 ring-primary' : ''}`}
              onClick={() => {
                setLevelFilter(levelFilter === lvl ? '' : lvl);
                setPage(1);
              }}
            >
              <CardContent className="p-3 text-center">
                <div className="text-2xl">{LOG_LEVEL_EMOJI[lvl]}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {lvl}
                </div>
                <div className="text-xl font-bold">
                  {statsLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : stats?.levelCounts[lvl] || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalCount || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.last24h || 0} in last 24h</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Labels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {stats?.uniqueLabels.length ? (
                  stats.uniqueLabels.slice(0, 10).map((label) => (
                    <Badge
                      key={label}
                      variant="outline"
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        setLabelFilter(labelFilter === label ? '' : label);
                        setPage(1);
                      }}
                    >
                      {label}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No labels yet</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {['client', 'edge_function', 'cron', 'system'].map((src) => (
                  <Badge
                    key={src}
                    variant={sourceFilter === src ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      setSourceFilter(sourceFilter === src ? '' : src);
                      setPage(1);
                    }}
                  >
                    {src} ({stats?.sourceCounts[src] || 0})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hourly Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Log Volume (Last 24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="wErrorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="wWarnGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="wInfoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="error" stroke="#ef4444" fill="url(#wErrorGrad)" stackId="1" />
                    <Area type="monotone" dataKey="warn" stroke="#f59e0b" fill="url(#wWarnGrad)" stackId="1" />
                    <Area type="monotone" dataKey="info" stroke="#3b82f6" fill="url(#wInfoGrad)" stackId="1" />
                    <Area type="monotone" dataKey="other" stroke="#6b7280" fill="#6b728020" stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Level Distribution Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend fontSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No logs yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedLogs.size > 0 && (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Badge variant="secondary">{selectedLogs.size} selected</Badge>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedLogs(new Set())}>
              Clear Selection
            </Button>
          </div>
        )}

        {/* Live Mode Banner */}
        {liveMode && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                <span className="font-medium text-green-500">Live Mode Active</span>
                <span className="text-muted-foreground text-sm">
                  — {realtimeLogs.length} logs received
                </span>
              </div>
              <Button size="sm" variant="outline" onClick={clearRealtime}>
                Clear Live Buffer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Log Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>
                {liveMode ? 'Live Logs' : `Logs (${data?.totalCount ?? 0})`}
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Select
                  value={levelFilter}
                  onValueChange={(v) => {
                    setLevelFilter((v === 'all' ? '' : v) as WinstonLogLevel | '');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {LEVEL_ORDER.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {LOG_LEVEL_EMOJI[lvl]} {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={displayLogs.length > 0 && selectedLogs.size === displayLogs.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-8" />
                    <TableHead className="w-24">Level</TableHead>
                    <TableHead className="w-28">Label</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-24">Source</TableHead>
                    <TableHead className="w-36">Time</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !liveMode ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-16" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : displayLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        {liveMode ? 'Waiting for new logs...' : 'No logs found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayLogs.map((log) => (
                      <Collapsible key={log.id} asChild open={expandedRows.has(log.id)}>
                        <>
                          <TableRow
                            className={`cursor-pointer hover:bg-muted/50 ${expandedRows.has(log.id) ? 'bg-muted/30' : ''}`}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedLogs.has(log.id)}
                                onCheckedChange={() => toggleSelect(log.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <button onClick={() => toggleRow(log.id)} className="p-1">
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${expandedRows.has(log.id) ? 'rotate-180' : ''}`}
                                  />
                                </button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell>{getLevelBadge(log.level)}</TableCell>
                            <TableCell>
                              {log.label && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  {log.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md truncate font-mono text-xs">
                              {log.message}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {log.source || 'client'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                              <br />
                              <span className="text-[10px]">
                                {format(new Date(log.timestamp), 'MMM d')}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyLogToClipboard(log);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/20">
                              <TableCell colSpan={8}>
                                <div className="p-4 space-y-3">
                                  {/* Full Message */}
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                      Full Message
                                    </p>
                                    <pre className="text-xs bg-background rounded p-3 overflow-x-auto whitespace-pre-wrap font-mono border">
                                      {log.message}
                                    </pre>
                                  </div>

                                  {/* Metadata */}
                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Metadata
                                      </p>
                                      <pre className="text-xs bg-background rounded p-3 overflow-x-auto font-mono border">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {/* Stack Trace */}
                                  {log.stack_trace && (
                                    <div>
                                      <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Stack Trace
                                      </p>
                                      <pre className="text-xs bg-red-500/5 rounded p-3 overflow-x-auto font-mono text-red-400 border border-red-500/20">
                                        {log.stack_trace}
                                      </pre>
                                    </div>
                                  )}

                                  {/* Details Grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    {log.function_name && (
                                      <div>
                                        <span className="text-muted-foreground">Function:</span>{' '}
                                        <span className="font-mono">{log.function_name}</span>
                                      </div>
                                    )}
                                    {log.duration_ms != null && (
                                      <div>
                                        <span className="text-muted-foreground">Duration:</span>{' '}
                                        <span className="font-mono">{log.duration_ms}ms</span>
                                      </div>
                                    )}
                                    {log.request_id && (
                                      <div>
                                        <span className="text-muted-foreground">Request ID:</span>{' '}
                                        <span className="font-mono">{log.request_id}</span>
                                      </div>
                                    )}
                                    {log.user_id && (
                                      <div>
                                        <span className="text-muted-foreground">User:</span>{' '}
                                        <span className="font-mono">{log.user_id.slice(0, 8)}...</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!liveMode && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Selected Logs</AlertDialogTitle>
              <AlertDialogDescription>
                Delete {selectedLogs.size} selected log(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear All Dialog */}
        <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Logs</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all application logs. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                disabled={clearMutation.isPending}
                className="bg-destructive text-destructive-foreground"
              >
                Clear All Logs
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
