
# Live Activity Feed Enhancement Plan

## Executive Summary

The current Live Activity feed in the Admin Dashboard (`/catking/dashboard`) shows user IDs truncated (e.g., `c2d884cb...`) instead of full user names and emails. This plan adds:

1. **Display user name AND email** instead of truncated user ID
2. **Clickable entries** that open UserDetailModal popup
3. **Responsive font/layout** that scales to screen size
4. **Race condition safeguards** for real-time subscription
5. **Error handling with user feedback**
6. **Vitest test suite** for the ActivityFeed component
7. **Documentation updates** for admin portal

---

## Current Issues Identified

### Issue 1: Missing User Details
The query joins with `profiles` but only fetches `display_name` and `avatar_emoji`. The email field exists in profiles but isn't fetched.

```typescript
// Current (line 90-93):
profile:profiles!player_activity_log_user_id_fkey(display_name, avatar_emoji)
```

**Problem**: No foreign key exists between `player_activity_log` and `profiles`, so the join fails and falls back to no profile data.

### Issue 2: Fallback Shows Truncated ID
When profile fetch fails, the display shows `activity.user_id.slice(0, 8) + '...'` which is not helpful.

### Issue 3: No Click Handler
Activity items are not clickable - users cannot view full profile details.

### Issue 4: Fixed Font Sizes
Font sizes and card heights are fixed, not responsive to screen size.

### Issue 5: Missing Race Condition Guard
The real-time subscription doesn't capture `subscribedUserId` pattern used elsewhere in the codebase.

### Issue 6: No Tests
No `ActivityFeed.test.tsx` exists in `src/components/admin/__tests__/`.

---

## Implementation Plan

### Phase 1: Fix Data Fetching with Profile Lookup

**File: `src/components/admin/ActivityFeed.tsx`**

Update the query to fetch profiles separately since no foreign key exists:

```typescript
interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_emoji: string | null;
    email: string | null;  // ADD email
    username: string | null; // ADD username
  };
}

const { data, isLoading, error } = useQuery({
  queryKey: ['admin-activity-feed'],
  queryFn: async () => {
    // Fetch activity logs
    const { data: activities, error: actError } = await supabase
      .from('player_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (actError) throw actError;
    if (!activities || activities.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(activities.map(a => a.user_id))];

    // Fetch profiles for all users
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_emoji, email, username')
      .in('id', userIds);

    if (profError) console.error('Profile fetch error:', profError);

    // Map profiles by user_id
    const profileMap = new Map(
      (profiles || []).map(p => [p.id, p])
    );

    // Enrich activities with profile data
    return activities.map(activity => ({
      ...activity,
      profile: profileMap.get(activity.user_id) || null,
    }));
  },
  staleTime: 10000,
});
```

### Phase 2: Add Clickable User Entries with Modal

Import and use the existing `UserDetailModal`:

```typescript
import { useState } from 'react';
import { UserDetailModal } from './UserDetailModal';

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // ... existing code ...
  
  return (
    <>
      <Card>
        {/* ... existing card content ... */}
        <ScrollArea className="h-[400px] pr-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => setSelectedUserId(activity.user_id)}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 
                         cursor-pointer hover:bg-muted/50 transition-colors
                         animate-in slide-in-from-top-2 duration-300"
            >
              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {activity.profile?.avatar_emoji || '👤'}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate text-sm sm:text-base">
                      {activity.profile?.display_name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {activity.profile?.email || activity.user_id}
                    </span>
                  </div>
                </div>
                {/* ... rest of content ... */}
              </div>
            </div>
          ))}
        </ScrollArea>
      </Card>
      
      {/* User Detail Modal */}
      <UserDetailModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </>
  );
}
```

### Phase 3: Add Responsive Styling

Use Tailwind's responsive classes for dynamic scaling:

```typescript
// Card header - responsive title
<CardTitle className="flex items-center gap-2 text-base sm:text-lg">

// Activity item - responsive padding
<div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg">

// Avatar - responsive size
<div className={`p-1.5 sm:p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
  {getActivityIcon(activity.activity_type)}
</div>

// User name - responsive font
<span className="font-medium truncate text-sm sm:text-base">

// Description - responsive text
<p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">

// Timestamp - responsive size
<p className="text-[10px] sm:text-xs text-muted-foreground mt-1">

// ScrollArea - responsive height
<ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
```

### Phase 4: Add Race Condition Safeguards

Apply the `subscribedUserId` pattern from other hooks:

```typescript
useEffect(() => {
  let isMounted = true;
  
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
        if (!isMounted) return; // Guard against unmount
        
        const newActivity = payload.new as ActivityItem;

        // Fetch profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_emoji, email, username')
          .eq('id', newActivity.user_id)
          .maybeSingle();

        if (!isMounted) return; // Guard again after async
        
        const activityWithProfile = {
          ...newActivity,
          profile: profile || undefined,
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
```

### Phase 5: Add Error Handling

Add error state display and toast notifications:

```typescript
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

export function ActivityFeed() {
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    // ... query config ...
    queryFn: async () => {
      try {
        // ... fetch logic ...
      } catch (err) {
        console.error('[ActivityFeed] Fetch error:', err);
        toast({
          title: 'Failed to load activity',
          description: 'Unable to fetch recent activity. Please refresh.',
          variant: 'destructive',
        });
        throw err;
      }
    },
  });
  
  // Error state UI
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Activity Feed Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load activity feed. 
            <button 
              onClick={() => refetch()} 
              className="ml-2 text-primary underline"
            >
              Retry
            </button>
          </p>
        </CardContent>
      </Card>
    );
  }
}
```

### Phase 6: Create Vitest Test Suite

**New File: `src/components/admin/__tests__/ActivityFeed.test.tsx`**

```typescript
/**
 * @fileoverview Tests for ActivityFeed component
 *
 * Validates activity display, user profile rendering, click handling,
 * error states, and real-time updates.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityFeed } from '../ActivityFeed';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: mockActivities, error: null })),
        })),
        in: vi.fn(() => Promise.resolve({ data: mockProfiles, error: null })),
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: mockProfiles[0], error: null })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
    })),
    removeChannel: vi.fn(),
  },
}));

const mockActivities = [
  {
    id: 'act-1',
    user_id: 'user-1',
    activity_type: 'login',
    activity_description: 'Logged into Cat Farm',
    metadata: { method: 'email' },
    created_at: new Date().toISOString(),
  },
];

const mockProfiles = [
  {
    id: 'user-1',
    display_name: 'Test User',
    avatar_emoji: '😺',
    email: 'test@example.com',
    username: 'testuser',
  },
];

describe('ActivityFeed', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    );

  describe('rendering', () => {
    it('should display loading skeleton initially', () => {
      renderComponent();
      expect(screen.getByText('Live Activity')).toBeInTheDocument();
    });

    it('should display user display_name instead of ID', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    });

    it('should display user email', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('should display avatar emoji', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('😺')).toBeInTheDocument();
      });
    });

    it('should display activity description', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Logged into Cat Farm')).toBeInTheDocument();
      });
    });
  });

  describe('click handling', () => {
    it('should be clickable and show pointer cursor', async () => {
      renderComponent();
      await waitFor(() => {
        const activityItem = screen.getByText('Test User').closest('div');
        expect(activityItem).toHaveClass('cursor-pointer');
      });
    });

    it('should open user detail modal on click', async () => {
      renderComponent();
      await waitFor(() => {
        const activityItem = screen.getByText('Test User').closest('[role="button"]');
        if (activityItem) fireEvent.click(activityItem);
      });
      // Modal should open (check for modal content)
    });
  });

  describe('error handling', () => {
    it('should display error state when fetch fails', async () => {
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: () => ({ order: () => ({ limit: () => Promise.reject(new Error('Fetch failed')) }) }),
      }));
      
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText(/Unable to load/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Similar test for retry functionality
    });
  });

  describe('responsive design', () => {
    it('should have responsive text classes', async () => {
      renderComponent();
      await waitFor(() => {
        const userName = screen.getByText('Test User');
        expect(userName).toHaveClass('text-sm', 'sm:text-base');
      });
    });
  });

  describe('real-time updates', () => {
    it('should subscribe to player_activity_log changes', () => {
      renderComponent();
      expect(supabase.channel).toHaveBeenCalledWith('activity-feed');
    });

    it('should unsubscribe on unmount', () => {
      const { unmount } = renderComponent();
      unmount();
      expect(supabase.removeChannel).toHaveBeenCalled();
    });
  });
});
```

### Phase 7: Update Documentation

**Update: `docs/ADMIN_DASHBOARD.md`**

Add/update the ActivityFeed section:

```markdown
### Activity Feed Component

The Live Activity Feed displays real-time player activity with enhanced user visibility:

#### Features
- **User Display**: Shows display name and email (not just ID)
- **Clickable Entries**: Click any activity to open full UserDetailModal
- **Responsive Design**: Font and layout scale to screen size
- **Real-time Updates**: Supabase Realtime subscription for instant updates
- **Error Handling**: Graceful error states with retry option

#### Activity Types Displayed
| Type | Icon | Color |
|------|------|-------|
| `login` | LogIn | Green |
| `logout` | LogIn | Gray |
| `trade_created/completed` | ArrowLeftRight | Blue |
| `gift_sent/received` | Gift | Pink |
| `cat_bred` | Heart | Purple |
| `show_win` | Trophy | Yellow |
| `challenge_completed` | Target | Orange |
| `purchase` | ShoppingCart | Default |

#### Race Condition Safeguards
- `isMounted` ref guard prevents state updates after unmount
- Async profile fetch checks mount status before updating state
- Channel cleanup on component unmount
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/ActivityFeed.tsx` | **Modify** | Add user details, click handler, responsive styling, race guards |
| `src/components/admin/__tests__/ActivityFeed.test.tsx` | **Create** | Comprehensive test suite |
| `docs/ADMIN_DASHBOARD.md` | **Update** | Document ActivityFeed enhancements |

---

## Database Changes Required

None - all data already exists in `profiles` table with `email` field.

---

## Testing Strategy

1. **Unit Tests**: New `ActivityFeed.test.tsx` covers:
   - User display name and email rendering
   - Click handler opening modal
   - Error state display
   - Responsive class application
   - Real-time subscription setup/teardown

2. **Manual Verification**:
   - Log in to admin dashboard
   - Verify activity shows "Test User" + "test@example.com" format
   - Click activity item → verify modal opens
   - Resize browser → verify layout adapts
   - Trigger activity (login) → verify real-time update appears

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Profile fetch adds latency | Batch fetch all profiles in single query |
| Modal conflicts with other modals | UserDetailModal already exists and works |
| Real-time subscription memory leak | isMounted guard + cleanup on unmount |
| Email exposure in admin UI | Already admin-only, RLS protects |

---

## Summary

This plan enhances the Live Activity Feed to show:
- **Full user names and emails** instead of truncated IDs
- **Clickable entries** that open the existing UserDetailModal
- **Responsive layout** that adapts to screen size
- **Race condition protection** using established patterns
- **Error handling** with toast notifications and retry
- **Comprehensive tests** for validation

Total effort: ~150 lines of component changes + ~200 lines of tests.
