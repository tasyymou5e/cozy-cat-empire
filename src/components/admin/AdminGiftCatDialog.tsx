import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminActivityLog } from '@/hooks/admin/useAdminActivityLog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Gift, Loader2, Sparkles } from 'lucide-react';
import { CatBreed } from '@/types/game';
import {
  generateAdminGiftCat,
  calculateCatValue,
  BREED_OPTIONS,
  getBreedEmoji,
} from '@/lib/adminGiftUtils';

interface AdminGiftCatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
  onGiftSent?: () => void;
}

export function AdminGiftCatDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
  onGiftSent,
}: AdminGiftCatDialogProps) {
  const { user } = useAuth();
  const { logActivity } = useAdminActivityLog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [breed, setBreed] = useState<CatBreed>('tabby');
  const [grade, setGrade] = useState(10);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const catValue = calculateCatValue(breed, grade);
  const breedEmoji = getBreedEmoji(breed);

  const handleSend = async () => {
    if (!user?.id || !name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a cat name',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // Generate the cat object
      const cat = generateAdminGiftCat({
        breed,
        grade,
        name: name.trim(),
      });

      // Insert the gift into cat_gifts table
      const { error } = await supabase.from('cat_gifts').insert([
        {
          sender_id: user.id,
          recipient_id: recipientId,
          cat_data: cat as unknown as Json,
          message: message.trim() || 'Gift from Admin 🎁',
          status: 'pending',
        },
      ]);

      if (error) throw error;

      // Log admin activity
      await logActivity({
        actionType: 'admin_gift_sent',
        actionDescription: `Gifted ${cat.name} (${breed}, Grade ${grade}) to ${recipientName}`,
        targetUserId: recipientId,
        metadata: {
          cat_id: cat.id,
          cat_name: cat.name,
          cat_breed: cat.breed,
          cat_grade: cat.grade,
          cat_value: cat.value,
        },
      });

      toast({
        title: 'Gift Sent! 🎁',
        description: `${cat.name} has been gifted to ${recipientName}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin-gifts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-gifts', recipientId] });

      // Reset form and close
      setName('');
      setMessage('');
      setBreed('tabby');
      setGrade(10);
      onOpenChange(false);
      onGiftSent?.();
    } catch (error) {
      console.error('Failed to send gift:', error);
      toast({
        title: 'Failed to send gift',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent-foreground" />
            Gift Cat to {recipientName}
          </DialogTitle>
          <DialogDescription>
            Create and send a cat as a gift. The recipient will receive a notification.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Cat Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Cat Name *</Label>
            <Input
              id="name"
              placeholder="Enter cat name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* Breed Selection */}
          <div className="grid gap-2">
            <Label>Breed</Label>
            <Select value={breed} onValueChange={(v) => setBreed(v as CatBreed)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BREED_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade Slider */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Grade</Label>
              <Badge variant="secondary" className="font-mono">
                {grade}
              </Badge>
            </div>
            <Slider
              value={[grade]}
              onValueChange={([v]) => setGrade(v)}
              min={1}
              max={20}
              step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Common (1)</span>
              <span>Legendary (20)</span>
            </div>
          </div>

          {/* Gift Message */}
          <div className="grid gap-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={2}
            />
          </div>

          {/* Cat Preview */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{breedEmoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{name || 'Unnamed Cat'}</span>
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {BREED_OPTIONS.find((b) => b.value === breed)?.label} · Grade {grade}
                  </div>
                  <div className="text-sm font-medium text-primary">
                    Value: ${catValue.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending || !name.trim()}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Send Gift
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
