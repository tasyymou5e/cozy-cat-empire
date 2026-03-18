import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProfileEditor } from '@/components/admin/ProfileEditor';
import { useAdminActivityLog } from '@/hooks/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { Wrench, AlertTriangle, UserCog, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { createLogger } from '@/lib/logger';

const logger = createLogger('AdminProfileRepair');

interface UserNeedingRepair {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
  username: string | null;
  created_at: string | null;
  generatedName?: string;
}

export default function AdminProfileRepair() {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<UserNeedingRepair | null>(null);
  const [generatedNames, setGeneratedNames] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [confirmApplyOpen, setConfirmApplyOpen] = useState(false);

  const { logActivity } = useAdminActivityLog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-profile-stats'],
    queryFn: async () => {
      const [nullNames, nullUsernames, defaultAvatars] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .or('display_name.is.null,display_name.eq.'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).is('username', null),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('avatar_emoji', '😺'),
      ]);

      return {
        nullNames: nullNames.count || 0,
        nullUsernames: nullUsernames.count || 0,
        defaultAvatars: defaultAvatars.count || 0,
      };
    },
  });

  // Fetch users needing repair
  const { data: usersNeedingRepair, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-needing-repair'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_emoji, username, created_at')
        .or('display_name.is.null,display_name.eq.')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as UserNeedingRepair[];
    },
  });

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
    if (!usersNeedingRepair) return;
    if (selectedUsers.size === usersNeedingRepair.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(usersNeedingRepair.map((u) => u.id)));
    }
  };

  const generateNameFromEmail = (email: string | null): string => {
    if (!email) {
      const catNames = [
        'Whiskers',
        'Mittens',
        'Shadow',
        'Luna',
        'Simba',
        'Nala',
        'Felix',
        'Garfield',
      ];
      return `${catNames[Math.floor(Math.random() * catNames.length)]}${Math.floor(Math.random() * 999)}`;
    }

    const localPart = email.split('@')[0];
    // Clean the local part
    let clean = localPart.replace(/[^a-zA-Z0-9]/g, '');

    // Ensure minimum length
    if (clean.length < 3) {
      clean = `Cat${clean}`;
    }

    // Truncate if too long
    if (clean.length > 25) {
      clean = clean.substring(0, 25);
    }

    return `${clean}${Math.floor(Math.random() * 99)}`;
  };

  const handleAutoGenerate = async () => {
    if (!usersNeedingRepair) return;

    setIsGenerating(true);
    const newGeneratedNames: Record<string, string> = {};
    const usersToGenerate =
      selectedUsers.size > 0
        ? usersNeedingRepair.filter((u) => selectedUsers.has(u.id))
        : usersNeedingRepair;

    // Check for conflicts
    const allExistingNames = new Set<string>();

    for (const user of usersToGenerate) {
      let name = generateNameFromEmail(user.email);
      let attempts = 0;

      // Ensure uniqueness within this batch
      while (allExistingNames.has(name.toLowerCase()) && attempts < 10) {
        name = generateNameFromEmail(user.email);
        attempts++;
      }

      allExistingNames.add(name.toLowerCase());
      newGeneratedNames[user.id] = name;
    }

    setGeneratedNames(newGeneratedNames);
    setIsGenerating(false);

    toast({
      title: 'Names Generated',
      description: `Generated ${Object.keys(newGeneratedNames).length} display names`,
    });
  };

  const handleApplyAll = async () => {
    setIsApplying(true);
    let successCount = 0;
    const namesToApply = Object.entries(generatedNames);

    for (const [userId, displayName] of namesToApply) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', userId);

        if (!error) {
          successCount++;
        }
      } catch (err) {
        logger.error(`Failed to update user ${userId}:`, err);
      }
    }

    await logActivity({
      actionType: 'bulk_profile_repair',
      actionDescription: `Auto-generated display names for ${successCount} users`,
      metadata: {
        successCount,
        totalAttempted: namesToApply.length,
        generatedNames,
      },
    });

    toast({
      title: 'Profiles Updated',
      description: `Successfully updated ${successCount} of ${namesToApply.length} profiles`,
    });

    setGeneratedNames({});
    setSelectedUsers(new Set());
    setConfirmApplyOpen(false);
    setIsApplying(false);

    queryClient.invalidateQueries({ queryKey: ['admin-users-needing-repair'] });
    queryClient.invalidateQueries({ queryKey: ['admin-profile-stats'] });
  };

  const truncateEmail = (email: string | null): string => {
    if (!email) return 'No email';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    if (localPart.length <= 5) return email;
    return `${localPart.slice(0, 5)}...@${domain}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Profile Repair Tool
          </h1>
          <p className="text-muted-foreground">Repair user profiles with missing or invalid data</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NULL Display Names</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.nullNames ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <UserCog className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No Username</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.nullUsernames ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <span className="text-xl">😺</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Avatar</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.defaultAvatars ?? 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Needing Repair */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Users with Missing Display Names</CardTitle>
                <CardDescription>
                  {usersNeedingRepair?.length ?? 0} users need attention
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleAutoGenerate}
                  disabled={isGenerating || !usersNeedingRepair?.length}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Auto-Generate Names
                </Button>
                {Object.keys(generatedNames).length > 0 && (
                  <Button onClick={() => setConfirmApplyOpen(true)}>
                    Apply All ({Object.keys(generatedNames).length})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !usersNeedingRepair?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All profiles are complete! 🎉</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedUsers.size === usersNeedingRepair.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-12">Avatar</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Generated Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersNeedingRepair.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-xl">{user.avatar_emoji || '😺'}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {truncateEmail(user.email)}
                        </TableCell>
                        <TableCell>
                          {generatedNames[user.id] ? (
                            <Badge variant="secondary" className="font-mono">
                              {generatedNames[user.id]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.created_at ? format(new Date(user.created_at), 'PP') : 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEditingUser(user)}>
                            <UserCog className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <ProfileEditor
              userId={editingUser.id}
              currentDisplayName={editingUser.display_name}
              currentAvatarEmoji={editingUser.avatar_emoji}
              currentUsername={editingUser.username}
              onSave={() => {
                setEditingUser(null);
                queryClient.invalidateQueries({ queryKey: ['admin-users-needing-repair'] });
                queryClient.invalidateQueries({ queryKey: ['admin-profile-stats'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Apply Dialog */}
      <AlertDialog open={confirmApplyOpen} onOpenChange={setConfirmApplyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Generated Names?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update {Object.keys(generatedNames).length} user profiles with
              auto-generated display names. This action will be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplying}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyAll} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
