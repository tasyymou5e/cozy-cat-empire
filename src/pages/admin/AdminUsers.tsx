import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminUsers } from '@/hooks/useAdminData';
import { useAdminActivityLog } from '@/hooks/useAdminActivityLog';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, ChevronLeft, ChevronRight, Shield, User as UserIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  
  const { data, isLoading } = useAdminUsers({ search, page, pageSize: 10 });
  const { logActivity } = useAdminActivityLog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    try {
      if (newRole === 'user') {
        // Remove role entry (default is user)
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id);
      } else {
        // Delete existing role first, then insert new one
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id);
        
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
      console.error('Failed to update role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const openRoleDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setRoleDialogOpen(true);
  };

  const openDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
      console.error('Failed to delete user:', error);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            View and manage all registered users
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Users ({data?.totalCount ?? 0})</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
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
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Joined</TableHead>
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
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-6 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : data?.users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{user.avatar_emoji || '😺'}</span>
                            <span className="font-medium">
                              {getDisplayName(user)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.username || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.created_at
                            ? format(new Date(user.created_at), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>{user.stats?.total_cats_owned ?? 0}</TableCell>
                        <TableCell>{user.stats?.total_show_wins ?? 0}</TableCell>
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
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                            >
                              <UserIcon className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openDeleteDialog(user)}
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
              <br /><br />
              This action cannot be undone. All user data, including their profile, 
              game saves, and statistics will be permanently removed.
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
    </AdminLayout>
  );
}
