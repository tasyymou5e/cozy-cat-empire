import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CHALLENGE_TEMPLATES } from '@/types/challenges';

const challengeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  emoji: z.string().min(1, 'Emoji is required'),
  challenge_type: z.string().min(1, 'Type is required'),
  target_value: z.coerce.number().min(1, 'Target must be at least 1'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']),
  reward_coins: z.coerce.number().min(0, 'Reward must be positive'),
  reward_badge: z.string().optional(),
  starts_at: z.date(),
  ends_at: z.date(),
  is_active: z.boolean(),
}).refine((data) => data.ends_at > data.starts_at, {
  message: 'End date must be after start date',
  path: ['ends_at'],
});

type ChallengeFormValues = z.infer<typeof challengeSchema>;

interface ChallengeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ChallengeFormValues) => Promise<void>;
  initialData?: Partial<ChallengeFormValues>;
  isEditing?: boolean;
}

const CHALLENGE_TYPES = [
  { value: 'show_wins', label: 'Show Wins' },
  { value: 'breed_kittens', label: 'Breed Kittens' },
  { value: 'train_tricks', label: 'Train Tricks' },
  { value: 'earn_money', label: 'Earn Money' },
  { value: 'complete_chores', label: 'Complete Chores' },
  { value: 'socialize_cats', label: 'Socialize Cats' },
  { value: 'feed_cats', label: 'Feed Cats' },
  { value: 'groom_cats', label: 'Groom Cats' },
];

const EMOJIS = ['🏆', '🎯', '💰', '🐱', '❤️', '⭐', '🎪', '🧹', '🍖', '✨', '🎉', '🌟'];

export function ChallengeForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: ChallengeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      emoji: initialData?.emoji || '🏆',
      challenge_type: initialData?.challenge_type || '',
      target_value: initialData?.target_value || 1,
      difficulty: initialData?.difficulty || 'medium',
      reward_coins: initialData?.reward_coins || 100,
      reward_badge: initialData?.reward_badge || '',
      starts_at: initialData?.starts_at || new Date(),
      ends_at: initialData?.ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      is_active: initialData?.is_active ?? true,
    },
  });

  const handleSubmit = async (data: ChallengeFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = (template: typeof CHALLENGE_TEMPLATES[number]) => {
    form.setValue('name', template.name);
    form.setValue('description', template.description);
    form.setValue('emoji', template.emoji);
    form.setValue('challenge_type', template.challenge_type);
    form.setValue('target_value', template.target_value);
    form.setValue('difficulty', template.difficulty);
    form.setValue('reward_coins', template.reward_coins);
    form.setValue('reward_badge', template.reward_badge || '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Challenge' : 'Create Challenge'}</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Select onValueChange={(idx) => applyTemplate(CHALLENGE_TEMPLATES[parseInt(idx)])}>
            <SelectTrigger>
              <SelectValue placeholder="Apply template..." />
            </SelectTrigger>
            <SelectContent>
              {CHALLENGE_TEMPLATES.map((template, idx) => (
                <SelectItem key={idx} value={idx.toString()}>
                  {template.emoji} {template.name} ({template.difficulty})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoji</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue>{field.value}</SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMOJIS.map((emoji) => (
                          <SelectItem key={emoji} value={emoji}>
                            {emoji}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Challenge name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the challenge..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="challenge_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CHALLENGE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reward_coins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Coins</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reward_badge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward Badge (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Badge name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="starts_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ends_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Challenge will be visible to players
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
