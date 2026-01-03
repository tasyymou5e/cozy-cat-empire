import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminErrors } from '@/hooks/useAdminData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminErrorLogs() {
  const [errorType, setErrorType] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data, isLoading, refetch, isFetching } = useAdminErrors({
    errorType: errorType || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedErrors.size === (data?.errors.length || 0)) {
      setSelectedErrors(new Set());
    } else {
      setSelectedErrors(new Set(data?.errors.map((e) => e.id) || []));
    }
  };

  const getErrorTypeBadge = (type: string) => {
    switch (type) {
      case 'react_error_boundary':
        return <Badge variant="destructive">React Error</Badge>;
      case 'uncaught_error':
        return <Badge variant="destructive">Uncaught</Badge>;
      case 'network_error':
        return <Badge variant="outline">Network</Badge>;
      case 'interaction_error':
        return <Badge variant="secondary">Interaction</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      case 'resolved':
        return <Badge className="bg-green-600">Resolved</Badge>;
      case 'ignored':
        return <Badge variant="secondary">Ignored</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleResolve = async (status: 'resolved' | 'ignored') => {
    if (selectedErrors.size === 0) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          status,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || null,
        })
        .in('id', Array.from(selectedErrors));

      if (error) throw error;

      toast({
        title: 'Errors Updated',
        description: `${selectedErrors.size} error(s) marked as ${status}`,
      });

      setSelectedErrors(new Set());
      setResolveDialogOpen(false);
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-errors'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update errors',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReopen = async (id: string) => {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          status: 'open',
          resolved_at: null,
          resolution_notes: null,
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Error Reopened' });
      queryClient.invalidateQueries({ queryKey: ['admin-errors'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (selectedErrors.size === 0) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .in('id', Array.from(selectedErrors));

      if (error) throw error;

      toast({
        title: 'Errors Deleted',
        description: `${selectedErrors.size} error(s) deleted`,
      });

      setSelectedErrors(new Set());
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-errors'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete errors',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Group errors by message for summary
  const groupedErrors = useMemo(() => {
    if (!data?.errors) return [];
    const groups = new Map<string, { count: number; latestId: string; latestTime: string }>();
    
    data.errors.forEach((error) => {
      const key = error.error_message.slice(0, 100);
      const existing = groups.get(key);
      if (existing) {
        existing.count++;
      } else {
        groups.set(key, { count: 1, latestId: error.id, latestTime: error.created_at });
      }
    });

    return Array.from(groups.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [data?.errors]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Error Logs</h1>
            <p className="text-muted-foreground">
              Monitor and manage application errors
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Summary */}
        {groupedErrors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Recurring Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupedErrors.map(([message, info]) => (
                  <div
                    key={info.latestId}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm truncate flex-1 mr-4">{message}</span>
                    <Badge variant="destructive">{info.count}x</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Actions */}
        {selectedErrors.size > 0 && (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Badge variant="secondary">{selectedErrors.size} selected</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setResolveDialogOpen(true)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Resolved
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolve('ignored')}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Ignore
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedErrors(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Errors ({data?.totalCount ?? 0})</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v === 'all' ? '' : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={errorType}
                  onValueChange={(v) => {
                    setErrorType(v === 'all' ? '' : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="react_error_boundary">React Error</SelectItem>
                    <SelectItem value="uncaught_error">Uncaught Error</SelectItem>
                    <SelectItem value="network_error">Network Error</SelectItem>
                    <SelectItem value="interaction_error">Interaction Error</SelectItem>
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
                        checked={
                          data?.errors.length
                            ? selectedErrors.size === data.errors.length
                            : false
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : data?.errors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No errors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.errors.map((error) => (
                      <Collapsible key={error.id} asChild>
                        <>
                          <TableRow>
                            <TableCell>
                              <Checkbox
                                checked={selectedErrors.has(error.id)}
                                onCheckedChange={() => toggleSelect(error.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRow(error.id)}
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      expandedRows.has(error.id) ? 'rotate-180' : ''
                                    }`}
                                  />
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell>{getStatusBadge(error.status || 'open')}</TableCell>
                            <TableCell>{getErrorTypeBadge(error.error_type)}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {error.error_message}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {error.component_name || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {error.created_at
                                ? format(new Date(error.created_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {(error.status === 'resolved' || error.status === 'ignored') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReopen(error.id)}
                                  title="Reopen"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={8}>
                                <div className="p-4 space-y-3">
                                  <div>
                                    <span className="font-medium">Full Message:</span>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {error.error_message}
                                    </p>
                                  </div>
                                  {error.error_stack && (
                                    <div>
                                      <span className="font-medium">Stack Trace:</span>
                                      <pre className="text-xs bg-muted p-3 rounded-md mt-1 overflow-x-auto whitespace-pre-wrap">
                                        {error.error_stack}
                                      </pre>
                                    </div>
                                  )}
                                  {error.resolution_notes && (
                                    <div>
                                      <span className="font-medium">Resolution Notes:</span>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {error.resolution_notes}
                                      </p>
                                    </div>
                                  )}
                                  {error.user_agent && (
                                    <div>
                                      <span className="font-medium">User Agent:</span>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {error.user_agent}
                                      </p>
                                    </div>
                                  )}
                                  {error.metadata && Object.keys(error.metadata).length > 0 && (
                                    <div>
                                      <span className="font-medium">Metadata:</span>
                                      <pre className="text-xs bg-muted p-3 rounded-md mt-1 overflow-x-auto">
                                        {JSON.stringify(error.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
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
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {selectedErrors.size} Error(s) as Resolved</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Resolution Notes (Optional)</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how the error was fixed..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleResolve('resolved')} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Mark Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedErrors.size} Error(s)</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected error logs will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
