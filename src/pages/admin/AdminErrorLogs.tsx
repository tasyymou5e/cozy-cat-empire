import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminErrors } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminErrorLogs() {
  const [errorType, setErrorType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch, isFetching } = useAdminErrors({
    errorType: errorType || undefined,
    page,
    pageSize: 20,
  });

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Error Logs</h1>
            <p className="text-muted-foreground">
              Monitor and debug application errors
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

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Errors ({data?.totalCount ?? 0})</CardTitle>
              <Select
                value={errorType}
                onValueChange={(v) => {
                  setErrorType(v === 'all' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
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
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Component</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : data?.errors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No errors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.errors.map((error) => (
                      <Collapsible key={error.id} asChild>
                        <>
                          <TableRow>
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
                            <TableCell>{getErrorTypeBadge(error.error_type)}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {error.error_message}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {error.component_name || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {error.route || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {error.created_at
                                ? format(new Date(error.created_at), 'MMM d, HH:mm')
                                : '-'}
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={6}>
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
    </AdminLayout>
  );
}
