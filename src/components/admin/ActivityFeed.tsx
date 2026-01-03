import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  LogIn,
  ArrowLeftRight,
  Gift,
  Heart,
  Trophy,
  Target,
  ShoppingCart,
  Activity,
  User,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string;
  metadata: Record<string, any>;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_emoji: string | null;
  };
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'login':
    case 'logout':
      return <LogIn className="h-4 w-4" />;
    case 'trade_created':
    case 'trade_completed':
      return <ArrowLeftRight className="h-4 w-4" />;
    case 'gift_sent':
    case 'gift_received':
      return <Gift className="h-4 w-4" />;
    case 'cat_bred':
      return <Heart className="h-4 w-4" />;
    case 'show_win':
      return <Trophy className="h-4 w-4" />;
    case 'challenge_completed':
      return <Target className="h-4 w-4" />;
    case 'purchase':
      return <ShoppingCart className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'login':
      return 'bg-green-500/10 text-green-500';
    case 'logout':
      return 'bg-gray-500/10 text-gray-500';
    case 'trade_created':
    case 'trade_completed':
      return 'bg-blue-500/10 text-blue-500';
    case 'gift_sent':
    case 'gift_received':
      return 'bg-pink-500/10 text-pink-500';
    case 'cat_bred':
      return 'bg-purple-500/10 text-purple-500';
    case 'show_win':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'challenge_completed':
      return 'bg-orange-500/10 text-orange-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_activity_log')
        .select(`
          *,
          profile:profiles!player_activity_log_user_id_fkey(display_name, avatar_emoji)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Fallback without profile join if foreign key doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('player_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (fallbackError) throw fallbackError;
        return fallbackData || [];
      }

      return data || [];
    },
    staleTime: 10000,
  });

  useEffect(() => {
    if (data) {
      setActivities(data as ActivityItem[]);
    }
  }, [data]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_activity_log',
        },
        async (payload) => {
          const newActivity = payload.new as ActivityItem;
          
          // Fetch profile info
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_emoji')
            .eq('id', newActivity.user_id)
            .single();

          const activityWithProfile = {
            ...newActivity,
            profile: profile || undefined,
          };

          setActivities((prev) => [activityWithProfile, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity
          <Badge variant="outline" className="ml-auto">
            {activities.length} recent
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-300"
                >
                  <div
                    className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}
                  >
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {activity.profile?.avatar_emoji || '👤'}
                      </span>
                      <span className="font-medium truncate">
                        {activity.profile?.display_name ||
                          activity.user_id.slice(0, 8) + '...'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.activity_description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
