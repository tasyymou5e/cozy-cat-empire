import { useState, useEffect } from 'react';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminUsers, useAdminActivityLog } from '@/hooks/admin';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { supabase } from '@/integrations/supabase/client';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { ExportButton } from '@/components/admin/ExportButton';
import { AdminUserProfile } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  User as UserIcon,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminUsers');

const truncateEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  if (localPart.length <= 3) {
    return `${localPart}@${domain}`;
  }
  return `${localPart.slice(0, 3)}...@${domain}`;
};

const getDisplayName = (user: { display_name?: string | null; email?: string | null }): string => {
  if (user.display_name) return user.display_name;
  if (user.email) return truncateEmail(user.email);
  return 'No Name';
};

export default function AdminUsers() {
  const [searchInput, setSearchInput, debouncedSearch] = useDebouncedSearch('', 300);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUserProfile | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<AdminUserProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const { data, isLoading } = useAdminUsers({ search: debouncedSearch, page, pageSize: 10 });

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  const { logActivity } = useAdminActivityLog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === (data?.users.length || 0)) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(data?.users.map((u) => u.id) || []));
    }
  };

  const handleBulkRoleChange = async (role: string) => {
    const userIds = Array.from(selectedUsers);

    try {
      // Delete existing roles
      await supabase.from('user_roles').delete().in('user_id', userIds);

      // Insert new roles if not 'user'
      if (role !== 'user') {
        const { error } = await supabase
          .from('user_roles')
          .insert(
            userIds.map((userId) => ({
              user_id: userId,
              role: role as 'admin' | 'moderator' | 'user',
            }))
          );
        if (error) throw error;
      }

      await logActivity({
        actionType: 'bulk_role_change',
        actionDescription: `Changed role to ${role} for ${userIds.length} users`,
        metadata: { userIds, newRole: role },
      });

      toast({
        title: 'Roles Updated',
        description: `${userIds.length} user(s) updated to ${role}`,
      });
      setSelectedUsers(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleBulkSuspend = async (reason: string) => {
    const userIds = Array.from(selectedUsers);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          suspended_at: new Date().toISOString(),
          suspension_reason: reason || 'No reason provided',
        })
        .in('id', userIds);

      if (error) throw error;

      await logActivity({
        actionType: 'bulk_suspend',
        actionDescription: `Suspended ${userIds.length} users`,
        metadata: { userIds, reason },
      });

      toast({ title: 'Users Suspended', description: `${userIds.length} user(s) suspended` });
      setSelectedUsers(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleBulkUnsuspend = async () => {
    const userIds = Array.from(selectedUsers);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          suspended_at: null,
          suspension_reason: null,
        })
        .in('id', userIds);

      if (error) throw error;

      await logActivity({
        actionType: 'bulk_unsuspend',
        actionDescription: `Unsuspended ${userIds.length} users`,
        metadata: { userIds },
      });

      toast({ title: 'Users Unsuspended', description: `${userIds.length} user(s) unsuspended` });
      setSelectedUsers(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    const userIds = Array.from(selectedUsers);
    let successCount = 0;

    for (const userId of userIds) {
      try {
        const response = await supabase.functions.invoke('admin-delete-user', {
          body: { userId },
        });
        if (!response.error) successCount++;
      } catch (error) {
        logger.error(`Failed to delete user ${userId}:`, error);
      }
    }

    await logActivity({
      actionType: 'bulk_delete',
      actionDescription: `Deleted ${successCount} of ${userIds.length} users`,
      metadata: { userIds, successCount },
    });

    toast({
      title: 'Users Deleted',
      description: `${successCount} of ${userIds.length} user(s) deleted`,
    });
    setSelectedUsers(new Set());
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleBulkNotify = async (title: string, body: string) => {
    const userIds = Array.from(selectedUsers);

    try {
      // Insert notification record
      const { error: notifError } = await supabase.from('admin_notifications').insert({
        title,
        body,
        target: 'specific',
        target_user_ids: userIds,
        status: 'sent',
      });

      if (notifError) throw notifError;

      await logActivity({
        actionType: 'bulk_notification',
        actionDescription: `Sent notification to ${userIds.length} users: ${title}`,
        metadata: { userIds, title, body },
      });

      toast({
        title: 'Notification Sent',
        description: `Notification sent to ${userIds.length} user(s)`,
      });
      setSelectedUsers(new Set());
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      if (newRole === 'user') {
        await supabase.from('user_roles').delete().eq('user_id', selectedUser.id);
      } else {
        await supabase.from('user_roles').delete().eq('user_id', selectedUser.id);

        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: selectedUser.id, role: newRole as 'admin' | 'moderator' | 'user' }]);

        if (error) throw error;
      }

      await logActivity({
        actionType: 'role_change',
        actionDescription: `Changed user role to ${newRole}`,
        targetUserId: selectedUser.id,
        targetTable: 'user_roles',
        metadata: { oldRole: selectedUser.role, newRole },
      });

      toast({
        title: 'Role Updated',
        description: `User role changed to ${newRole}`,
      });

      setRoleDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error) {
      logger.error('Failed to update role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const openRoleDialog = (user: AdminUserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setRoleDialogOpen(true);
  };

  const openDeleteDialog = (user: AdminUserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: userToDelete.id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete user');
      }

      await logActivity({
        actionType: 'user_delete',
        actionDescription: `Deleted user: ${getDisplayName(userToDelete)}`,
        targetUserId: userToDelete.id,
        targetTable: 'profiles',
        metadata: {
          deleted_user_email: userToDelete.email,
          deleted_user_display_name: userToDelete.display_name,
        },
      });

      toast({
        title: 'User Deleted',
        description: `${getDisplayName(userToDelete)} has been permanently deleted.`,
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      logger.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const openSuspendDialog = (user: AdminUserProfile) => {
    setUserToSuspend(user);
    setSuspensionReason('');
    setSuspendDialogOpen(true);
  };

  const handleSuspendUser = async () => {
    if (!userToSuspend) return;

    setIsSuspending(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          suspended_at: new Date().toISOString(),
          suspension_reason: suspensionReason || 'No reason provided',
        })
        .eq('id', userToSuspend.id);

      if (error) throw error;

      await logActivity({
        actionType: 'user_suspend',
        actionDescription: `Suspended user: ${getDisplayName(userToSuspend)}`,
        targetUserId: userToSuspend.id,
        targetTable: 'profiles',
        metadata: { reason: suspensionReason },
      });

      toast({
        title: 'User Suspended',
        description: `${getDisplayName(userToSuspend)} has been suspended.`,
      });

      setSuspendDialogOpen(false);
      setUserToSuspend(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      logger.error('Failed to suspend user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend user',
        variant: 'destructive',
      });
    } finally {
      setIsSuspending(false);
    }
  };

  const handleUnsuspendUser = async (user: AdminUserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          suspended_at: null,
          suspension_reason: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await logActivity({
        actionType: 'user_unsuspend',
        actionDescription: `Unsuspended user: ${getDisplayName(user)}`,
        targetUserId: user.id,
        targetTable: 'profiles',
      });

      toast({
        title: 'User Unsuspended',
        description: `${getDisplayName(user)} has been unsuspended.`,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      logger.error('Failed to unsuspend user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unsuspend user',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View and manage all registered users</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Users ({data?.totalCount ?? 0})</CardTitle>
                {data?.users && <ExportButton data={data.users} filename="users" />}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
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
                          data?.users.length ? selectedUsers.size === data.users.length : false
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Played</TableHead>
                    <TableHead>Cats</TableHead>
                    <TableHead>Wins</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 10 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : data?.users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{user.avatar_emoji || '😺'}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{getDisplayName(user)}</span>
                              {!user.display_name && (
                                <Badge
                                  variant="destructive"
                                  className="h-5 px-1.5 text-[10px]"
                                  title="Missing display name"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.username || '-'}
                        </TableCell>
                        <TableCell>
                          {user.suspended_at ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          {user.save ? (
                            <span className="text-muted-foreground text-xs">
                              {user.save.last_played_at
                                ? format(new Date(user.save.last_played_at), 'MMM d, yyyy')
                                : '—'}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-xs">No Save</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.save ? (
                            user.save.cats_count
                          ) : user.stats ? (
                            <span className="text-muted-foreground">{user.stats.total_cats_owned}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.stats ? (
                            user.stats.total_show_wins
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingUserId(user.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openRoleDialog(user)}
                              title="Manage Role"
                            >
                              <UserIcon className="h-4 w-4" />
                            </Button>
                            {user.suspended_at ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnsuspendUser(user)}
                                title="Unsuspend User"
                                className="text-green-600 hover:text-green-700 hover:bg-green-100"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openSuspendDialog(user)}
                                title="Suspend User"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openDeleteDialog(user)}
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
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

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedUsers.size}
        selectedUserIds={Array.from(selectedUsers)}
        onClear={() => setSelectedUsers(new Set())}
        onBulkRoleChange={handleBulkRoleChange}
        onBulkSuspend={handleBulkSuspend}
        onBulkUnsuspend={handleBulkUnsuspend}
        onBulkDelete={handleBulkDelete}
        onBulkNotify={handleBulkNotify}
      />

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              User: <strong>{selectedUser ? getDisplayName(selectedUser) : ''}</strong>
            </p>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong>{userToDelete ? getDisplayName(userToDelete) : ''}</strong>?
              <br />
              <br />
              This action cannot be undone. All user data, including their profile, game saves, and
              statistics will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Suspending <strong>{userToSuspend ? getDisplayName(userToSuspend) : ''}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Reason for suspension</Label>
              <Textarea
                id="suspension-reason"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={isSuspending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspendUser} disabled={isSuspending}>
              {isSuspending ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Modal */}
      <UserDetailModal userId={viewingUserId} onClose={() => setViewingUserId(null)} />
    </AdminLayout>
  );
}
