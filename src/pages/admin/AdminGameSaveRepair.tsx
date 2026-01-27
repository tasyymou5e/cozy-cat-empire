/**
 * @fileoverview AdminGameSaveRepair - Admin page for detecting and repairing corrupted game saves
 *
 * Features:
 * - Statistics dashboard showing corruption types
 * - Table of affected users with issues
 * - Individual and bulk repair functionality
 * - Preview changes before applying
 *
 * @module pages/admin/AdminGameSaveRepair
 */

import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminCorruptedSaves,
  useRepairGameSave,
  useBulkRepairGameSaves,
  CorruptedSave,
  CorruptionType,
  detectCorruption,
  repairGameState,
} from '@/hooks/admin/useAdminCorruptedSaves';
import {
  Database,
  RefreshCw,
  Wrench,
  AlertTriangle,
  DollarSign,
  Cat,
  Package,
  Home,
  FileQuestion,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

type FilterTab = 'all' | CorruptionType;

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-muted text-muted-foreground',
};

const ISSUE_TYPE_ICONS: Record<CorruptionType, React.ReactNode> = {
  negative_earnings: <DollarSign className="h-4 w-4" />,
  negative_money: <DollarSign className="h-4 w-4" />,
  invalid_money: <AlertTriangle className="h-4 w-4" />,
  bad_cat_data: <Cat className="h-4 w-4" />,
  bad_resources: <Package className="h-4 w-4" />,
  invalid_house: <Home className="h-4 w-4" />,
  missing_fields: <FileQuestion className="h-4 w-4" />,
};

const ISSUE_TYPE_LABELS: Record<CorruptionType, string> = {
  negative_earnings: 'Negative Earnings',
  negative_money: 'Negative Money',
  invalid_money: 'Invalid Money',
  bad_cat_data: 'Bad Cat Data',
  bad_resources: 'Bad Resources',
  invalid_house: 'Invalid House',
  missing_fields: 'Missing Fields',
};

export default function AdminGameSaveRepair() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useAdminCorruptedSaves();
  const repairMutation = useRepairGameSave();
  const bulkRepairMutation = useBulkRepairGameSaves();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [previewUser, setPreviewUser] = useState<CorruptedSave | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Filter saves by tab
  const filteredSaves = useMemo(() => {
    if (!data?.saves) return [];
    if (activeTab === 'all') return data.saves;
    return data.saves.filter((save) => save.issues.some((issue) => issue.type === activeTab));
  }, [data?.saves, activeTab]);

  // Preview repair changes
  const previewChanges = useMemo(() => {
    if (!previewUser) return null;
    return repairGameState(previewUser.gameState);
  }, [previewUser]);

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredSaves.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredSaves.map((s) => s.userId)));
    }
  };

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleRepairSingle = async (userId: string) => {
    const result = await repairMutation.mutateAsync({ userId });
    if (result.success) {
      toast({
        title: 'Save Repaired',
        description: `Fixed ${result.changesApplied.length} issues`,
      });
      setPreviewUser(null);
    } else {
      toast({
        title: 'Repair Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleBulkRepair = async () => {
    const userIds = Array.from(selectedUsers);
    const { results, totalFixed } = await bulkRepairMutation.mutateAsync(userIds);

    const failed = results.filter((r) => !r.success).length;

    toast({
      title: 'Bulk Repair Complete',
      description: `Fixed ${totalFixed}/${userIds.length} saves${failed > 0 ? ` (${failed} failed)` : ''}`,
      variant: failed > 0 ? 'destructive' : 'default',
    });

    setSelectedUsers(new Set());
    setShowBulkConfirm(false);
  };

  const truncateEmail = (email: string | null) => {
    if (!email) return 'Unknown';
    const [local, domain] = email.split('@');
    if (local.length <= 3) return email;
    return `${local.slice(0, 3)}...@${domain}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" />
              Game Save Repair Tool
            </h1>
            <p className="text-muted-foreground">Detect and fix corrupted game saves</p>
          </div>
          <Button onClick={() => refetch()} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Saves</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{data?.stats.totalSaves || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className={data?.stats.corruptedSaves ? 'border-destructive' : ''}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Corrupted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-destructive">
                  {data?.stats.corruptedSaves || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Neg. Earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{data?.stats.negativeEarnings || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Neg. Money
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{data?.stats.negativeMoney || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Cat className="h-3 w-3" />
                Bad Cat Data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{data?.stats.badCatData || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                Bad Resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">{data?.stats.badResources || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Invalid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold">
                  {(data?.stats.invalidMoney || 0) + (data?.stats.invalidHouse || 0)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Affected Saves</CardTitle>
              {selectedUsers.size > 0 && (
                <Button
                  variant="default"
                  onClick={() => setShowBulkConfirm(true)}
                  disabled={bulkRepairMutation.isPending}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Repair Selected ({selectedUsers.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Issues</TabsTrigger>
                <TabsTrigger value="negative_earnings">Earnings</TabsTrigger>
                <TabsTrigger value="negative_money">Money</TabsTrigger>
                <TabsTrigger value="bad_cat_data">Cats</TabsTrigger>
                <TabsTrigger value="bad_resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredSaves.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>No corrupted saves found!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.size === filteredSaves.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead>Last Played</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSaves.map((save) => (
                        <TableRow key={save.userId}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(save.userId)}
                              onCheckedChange={() => handleToggleUser(save.userId)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {save.displayName || truncateEmail(save.email)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {truncateEmail(save.email)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {save.issues.slice(0, 3).map((issue, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={SEVERITY_COLORS[issue.severity]}
                                >
                                  {ISSUE_TYPE_ICONS[issue.type]}
                                  <span className="ml-1">{issue.field}</span>
                                </Badge>
                              ))}
                              {save.issues.length > 3 && (
                                <Badge variant="secondary">+{save.issues.length - 3} more</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {save.lastPlayedAt
                              ? format(new Date(save.lastPlayedAt), 'MMM d, yyyy')
                              : 'Unknown'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewUser(save)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRepairSingle(save.userId)}
                                disabled={repairMutation.isPending}
                              >
                                <Wrench className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!previewUser} onOpenChange={() => setPreviewUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Preview Repair</DialogTitle>
              <DialogDescription>
                Review the changes that will be applied to this save
              </DialogDescription>
            </DialogHeader>

            {previewUser && previewChanges && (
              <ScrollArea className="max-h-96">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">User</h4>
                    <p className="text-sm text-muted-foreground">
                      {previewUser.displayName || previewUser.email || previewUser.userId}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Issues Found ({previewUser.issues.length})
                    </h4>
                    <ul className="text-sm space-y-1">
                      {previewUser.issues.map((issue, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Badge className={SEVERITY_COLORS[issue.severity]} variant="outline">
                            {issue.severity}
                          </Badge>
                          <span>
                            {issue.field}: <code>{String(issue.currentValue)}</code>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Changes to Apply ({previewChanges.changes.length})
                    </h4>
                    <ul className="text-sm space-y-1 font-mono bg-muted p-2 rounded">
                      {previewChanges.changes.map((change, idx) => (
                        <li key={idx} className="text-green-600">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewUser(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => previewUser && handleRepairSingle(previewUser.userId)}
                disabled={repairMutation.isPending}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Apply Repair
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Confirm Dialog */}
        <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Bulk Repair</AlertDialogTitle>
              <AlertDialogDescription>
                This will repair {selectedUsers.size} game saves. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkRepair} disabled={bulkRepairMutation.isPending}>
                {bulkRepairMutation.isPending ? 'Repairing...' : 'Repair All'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
