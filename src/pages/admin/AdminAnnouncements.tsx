import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminActivityLog } from '@/hooks/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Megaphone, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  created_by: string | null;
}

const ANNOUNCEMENT_TYPES = [
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-500' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'text-green-500' },
  { value: 'event', label: 'Event', icon: Megaphone, color: 'text-purple-500' },
];

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    is_active: true,
    expires_at: '',
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from('announcements')
        .insert({
          title: data.title,
          message: data.message,
          type: data.type,
          is_active: data.is_active,
          expires_at: data.expires_at || null,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      logActivity({ actionType: 'create_announcement', actionDescription: `Created announcement: ${result.title}` });
      toast.success('Announcement created');
      closeDialog();
    },
    onError: (error) => {
      toast.error('Failed to create announcement: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: data.title,
          message: data.message,
          type: data.type,
          is_active: data.is_active,
          expires_at: data.expires_at || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      logActivity({ actionType: 'update_announcement', actionDescription: `Updated announcement: ${formData.title}` });
      toast.success('Announcement updated');
      closeDialog();
    },
    onError: (error) => {
      toast.error('Failed to update announcement: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      logActivity({ actionType: 'delete_announcement', actionDescription: 'Deleted announcement' });
      toast.success('Announcement deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete announcement: ' + error.message);
    },
  });

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      is_active: true,
      expires_at: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      is_active: announcement.is_active,
      expires_at: announcement.expires_at
        ? format(new Date(announcement.expires_at), "yyyy-MM-dd'T'HH:mm")
        : '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAnnouncement(null);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = ANNOUNCEMENT_TYPES.find((t) => t.value === type);
    if (!typeConfig) return <Badge variant="secondary">{type}</Badge>;

    const Icon = typeConfig.icon;
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className={`h-3 w-3 ${typeConfig.color}`} />
        {typeConfig.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">
              Create and manage announcements for all players
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : announcements?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No announcements yet. Create one to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements?.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">
                        {announcement.title}
                      </TableCell>
                      <TableCell>{getTypeBadge(announcement.type)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={announcement.is_active ? 'default' : 'secondary'}
                        >
                          {announcement.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {announcement.expires_at
                          ? format(new Date(announcement.expires_at), 'MMM d, yyyy')
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Announcement message"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires">Expires At (optional)</Label>
                  <Input
                    id="expires"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingAnnouncement ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
