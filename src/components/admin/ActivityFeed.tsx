/**
 * ActivityFeed - Real-time player activity monitor
 *
 * Displays recent player activities with user details (name, email),
 * clickable entries for user detail modal, and responsive design.
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { UserDetailModal } from './UserDetailModal';
import {
  LogIn,
  ArrowLeftRight,
  Gift,
  Heart,
  Trophy,
  Target,
  ShoppingCart,
  Activity,
  AlertCircle,
  RefreshCw,
  UserMinus,
  UserPlus,
} from 'lucide-react';

import { createLogger } from '@/lib/logger';

const logger = createLogger('ActivityFeed');

interface ActivityProfile {
  display_name: string | null;
  avatar_emoji: string | null;
  email: string | null;
  username: string | null;
}

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  profile?: ActivityProfile | null;
}

const getActivityIcon = (type: string) => {
  const iconClass = 'h-3 w-3 sm:h-4 sm:w-4';
  switch (type) {
    case 'login':
    case 'logout':
      return <LogIn className={iconClass} />;
    case 'trade_created':
    case 'trade_completed':
      return <ArrowLeftRight className={iconClass} />;
    case 'gift_sent':
    case 'gift_received':
      return <Gift className={iconClass} />;
    case 'cat_bred':
      return <Heart className={iconClass} />;
    case 'show_win':
      return <Trophy className={iconClass} />;
    case 'challenge_completed':
      return <Target className={iconClass} />;
    case 'purchase':
      return <ShoppingCart className={iconClass} />;
    case 'friend_request_sent':
      return <UserPlus className={iconClass} />;
    case 'friend_request_accepted':
      return <UserPlus className={iconClass} />;
    case 'friend_removed':
      return <UserMinus className={iconClass} />;
    default:
      return <Activity className={iconClass} />;
  }
};

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'login':
      return 'bg-green-500/10 text-green-500';
    case 'logout':
      return 'bg-muted text-muted-foreground';
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
    case 'friend_request_sent':
    case 'friend_request_accepted':
      return 'bg-cyan-500/10 text-cyan-500';
    case 'friend_removed':
      return 'bg-red-500/10 text-red-500';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function ActivityFeed() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: async () => {
      // Fetch activity logs
      const { data: activityData, error: actError } = await supabase
        .from('player_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (actError) {
        logger.error('[ActivityFeed] Activity fetch error:', actError);
        throw actError;
      }

      if (!activityData || activityData.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(activityData.map((a) => a.user_id))];

      // Fetch profiles for all users in batch
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, email, username')
        .in('id', userIds);

      if (profError) {
        logger.error('[ActivityFeed] Profile fetch error:', profError);
        // Continue without profiles rather than failing
      }

      // Map profiles by user_id for quick lookup
      const profileMap = new Map<string, ActivityProfile>(
        (profiles || []).map((p) => [
          p.id,
          {
            display_name: p.display_name,
            avatar_emoji: p.avatar_emoji,
            email: p.email,
            username: p.username,
          },
        ])
      );

      // Enrich activities with profile data
      return activityData.map((activity) => ({
        ...activity,
        profile: profileMap.get(activity.user_id) || null,
      })) as ActivityItem[];
    },
    staleTime: 10000,
  });

  useEffect(() => {
    if (data) {
      setActivities(data);
    }
  }, [data]);

  // Set up realtime subscription with race condition guards
  useEffect(() => {
    let isMounted = true;

    const channel = supabase
      .channel('activity-feed-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_activity_log',
        },
        async (payload) => {
          if (!isMounted) return;

          const newActivity = payload.new as {
            id: string;
            user_id: string;
            activity_type: string;
            activity_description: string;
            metadata: Record<string, unknown>;
            created_at: string;
          };

          // Fetch profile info for the new activity
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_emoji, email, username')
            .eq('id', newActivity.user_id)
            .maybeSingle();

          // Guard against unmount after async operation
          if (!isMounted) return;

          const activityWithProfile: ActivityItem = {
            ...newActivity,
            profile: profile || null,
          };

          setActivities((prev) => [activityWithProfile, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            Activity Feed Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Unable to load activity feed.
            <Button
              variant="link"
              size="sm"
              onClick={() => refetch()}
              className="ml-1 p-0 h-auto"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 sm:h-4 w-3/4" />
                  <Skeleton className="h-2 sm:h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
            Live Activity
            <Badge variant="outline" className="ml-auto text-[10px] sm:text-xs">
              {activities.length} recent
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedUserId(activity.user_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedUserId(activity.user_id);
                      }
                    }}
                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30 
                               cursor-pointer hover:bg-muted/50 transition-colors
                               animate-in slide-in-from-top-2 duration-300
                               focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <div
                      className={`p-1.5 sm:p-2 rounded-full shrink-0 ${getActivityColor(activity.activity_type)}`}
                    >
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-base sm:text-lg shrink-0">
                          {activity.profile?.avatar_emoji || '👤'}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate text-xs sm:text-sm">
                            {activity.profile?.display_name || 'Unknown User'}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {activity.profile?.email || activity.user_id}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {activity.activity_description}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5 sm:mt-1">
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

      {/* User Detail Modal */}
      <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </>
  );
}
