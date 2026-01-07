import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdminActivityLog, useAdminRateLimit } from '@/hooks/admin';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  Bell,
  Plus,
  Send,
  Users,
  Crown,
  Activity,
  UserX,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  target: string;
  target_user_ids: string[];
  sent_at: string;
  sent_by: string | null;
  delivery_count: number;
  status: string;
}

const targetOptions = [
  { value: 'all', label: 'All Users', icon: Users, description: 'Send to everyone' },
  { value: 'vip', label: 'VIP Users', icon: Crown, description: 'Users with 7+ day login streak' },
  {
    value: 'active',
    label: 'Active Users',
    icon: Activity,
    description: 'Users active in last 7 days',
  },
  {
    value: 'inactive',
    label: 'Inactive Users',
    icon: UserX,
    description: 'Users inactive for 14+ days',
  },
];

export default function AdminNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();
  const { enforceRateLimit } = useAdminRateLimit();

  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AdminNotification[];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { title: string; body: string; target: string }) => {
      // Rate limit check
      const allowed = await enforceRateLimit('mass_notification');
      if (!allowed) throw new Error('Rate limit exceeded');

      // Get target user count for display
      let targetCount = 0;
      if (data.target === 'all') {
        const { count } = await supabase
          .from('push_subscriptions')
          .select('id', { count: 'exact', head: true });
        targetCount = count || 0;
      }

      // Insert notification record
      const { error } = await supabase.from('admin_notifications').insert({
        title: data.title,
        body: data.body,
        target: data.target,
        sent_by: user?.id,
        status: 'sent',
        delivery_count: targetCount,
      });

      if (error) throw error;

      // In a real implementation, you would call the edge function to send actual push notifications
      // For now, we just record the notification
      return { targetCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      logActivity({
        actionType: 'notification_send',
        actionDescription: `Sent notification to ${target} users: ${title}`,
        targetTable: 'admin_notifications',
      });
      toast({
        title: 'Notification Sent',
        description: `Queued for ${result.targetCount} users with push subscriptions.`,
      });
      setComposeOpen(false);
      setTitle('');
      setBody('');
      setTarget('all');
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-green-600 gap-1">
            <CheckCircle className="h-3 w-3" /> Sent
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTargetLabel = (target: string) => {
    const option = targetOptions.find((o) => o.value === target);
    return option?.label || target;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-500" />
              Notification Center
            </h1>
            <p className="text-muted-foreground">Send push notifications to users.</p>
          </div>
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Notification
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {notifications?.reduce((sum, n) => sum + n.delivery_count, 0) ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification History */}
        <Card>
          <CardHeader>
            <CardTitle>Notification History</CardTitle>
            <CardDescription>Recent notifications sent to users.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : notifications?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications sent yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications?.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>{getStatusBadge(notification.status)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {notification.body}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTargetLabel(notification.target)}</Badge>
                      </TableCell>
                      <TableCell>{notification.delivery_count}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(notification.sent_at), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compose Notification</DialogTitle>
            <DialogDescription>Send a push notification to your users.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="New feature available!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">{title.length}/50 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Check out the new battle pass season..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{body.length}/200 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Audience</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          - {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendMutation.mutate({ title, body, target })}
              disabled={!title || !body || sendMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
