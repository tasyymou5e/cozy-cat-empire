import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, Megaphone, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

const TYPE_STYLES: Record<string, { bg: string; icon: React.ElementType; iconColor: string }> = {
  info: { bg: 'bg-blue-500/10 border-blue-500/30', icon: Info, iconColor: 'text-blue-500' },
  warning: {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
  success: {
    bg: 'bg-green-500/10 border-green-500/30',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  event: {
    bg: 'bg-purple-500/10 border-purple-500/30',
    icon: Megaphone,
    iconColor: 'text-purple-500',
  },
};

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed-announcements');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as Announcement[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    localStorage.setItem('dismissed-announcements', JSON.stringify(dismissed));
  }, [dismissed]);

  const visibleAnnouncements = announcements?.filter((a) => !dismissed.includes(a.id)) || [];

  if (visibleAnnouncements.length === 0) return null;

  const dismiss = (id: string) => {
    setDismissed((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-2 mb-4">
      {visibleAnnouncements.map((announcement) => {
        const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.info;
        const Icon = style.icon;

        return (
          <div
            key={announcement.id}
            className={cn('relative flex items-start gap-3 p-3 rounded-lg border', style.bg)}
          >
            <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', style.iconColor)} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{announcement.title}</p>
              <p className="text-sm text-muted-foreground">{announcement.message}</p>
            </div>
            <button
              onClick={() => dismiss(announcement.id)}
              className="p-1 hover:bg-background/50 rounded transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
