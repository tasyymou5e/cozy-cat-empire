import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Shield, Ban, CheckCircle, Trash2, Bell } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  selectedUserIds: string[];
  onClear: () => void;
  onBulkRoleChange: (role: string) => Promise<void>;
  onBulkSuspend: (reason: string) => Promise<void>;
  onBulkUnsuspend: () => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkNotify: (title: string, body: string) => Promise<void>;
}

export function BulkActionsBar({
  selectedCount,
  selectedUserIds,
  onClear,
  onBulkRoleChange,
  onBulkSuspend,
  onBulkUnsuspend,
  onBulkDelete,
  onBulkNotify,
}: BulkActionsBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const [suspendReason, setSuspendReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');

  const handleRoleChange = async () => {
    setIsProcessing(true);
    try {
      await onBulkRoleChange(selectedRole);
      setRoleDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = async () => {
    setIsProcessing(true);
    try {
      await onBulkSuspend(suspendReason);
      setSuspendDialogOpen(false);
      setSuspendReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsuspend = async () => {
    setIsProcessing(true);
    try {
      await onBulkUnsuspend();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete();
      setDeleteDialogOpen(false);
      setConfirmText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotify = async () => {
    setIsProcessing(true);
    try {
      await onBulkNotify(notifyTitle, notifyBody);
      setNotifyDialogOpen(false);
      setNotifyTitle('');
      setNotifyBody('');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRoleDialogOpen(true)}
            disabled={isProcessing}
          >
            <Shield className="h-4 w-4 mr-1" />
            Change Role
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSuspendDialogOpen(true)}
            disabled={isProcessing}
            className="text-orange-600 border-orange-600 hover:bg-orange-50"
          >
            <Ban className="h-4 w-4 mr-1" />
            Suspend
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleUnsuspend}
            disabled={isProcessing}
            className="text-green-600 border-green-600 hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Unsuspend
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotifyDialogOpen(true)}
            disabled={isProcessing}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <Bell className="h-4 w-4 mr-1" />
            Notify
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Role Change Dialog */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Role for {selectedCount} Users</AlertDialogTitle>
            <AlertDialogDescription>
              Select the new role for all selected users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>New Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Change Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {selectedCount} Users</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for suspending these users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Suspension Reason</Label>
            <Textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter suspension reason..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? 'Processing...' : 'Suspend Users'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete {selectedCount} Users Permanently
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All user data will be permanently deleted.
              <br />
              <br />
              Type <strong>DELETE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing || confirmText !== 'DELETE'}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete Users'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notify Dialog */}
      <AlertDialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Send Notification to {selectedCount} Users
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send a push notification to all selected users who have notifications enabled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
                placeholder="Notification title..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={notifyBody}
                onChange={(e) => setNotifyBody(e.target.value)}
                placeholder="Enter notification message..."
                className="mt-2"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNotify}
              disabled={isProcessing || !notifyTitle.trim() || !notifyBody.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Sending...' : 'Send Notification'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
