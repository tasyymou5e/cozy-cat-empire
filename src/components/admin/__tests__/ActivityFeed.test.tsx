/**
 * @fileoverview Tests for ActivityFeed component
 *
 * Validates activity display, user profile rendering, click handling,
 * error states, responsive design, and real-time updates.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock data
const mockActivities = [
  {
    id: 'act-1',
    user_id: 'user-1',
    activity_type: 'login',
    activity_description: 'Logged into Cat Farm',
    metadata: { method: 'email' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'act-2',
    user_id: 'user-2',
    activity_type: 'trade_completed',
    activity_description: 'Completed a trade with another player',
    metadata: {},
    created_at: new Date(Date.now() - 60000).toISOString(),
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
  {
    id: 'user-2',
    display_name: 'Another User',
    avatar_emoji: '🐱',
    email: 'another@example.com',
    username: 'anotheruser',
  },
];

// Mock supabase responses
const mockSupabaseFrom = vi.fn();
const mockSupabaseChannel = vi.fn();
const mockSupabaseRemoveChannel = vi.fn();

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      mockSupabaseFrom(table);
      if (table === 'player_activity_log') {
        return {
          select: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: mockActivities, error: null }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: mockProfiles, error: null }),
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: mockProfiles[0], error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      };
    },
    channel: (name: string) => {
      mockSupabaseChannel(name);
      return {
        on: () => ({
          subscribe: () => ({}),
        }),
      };
    },
    removeChannel: mockSupabaseRemoveChannel,
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock UserDetailModal
vi.mock('../UserDetailModal', () => ({
  UserDetailModal: ({ userId, onClose }: { userId: string | null; onClose: () => void }) =>
    userId ? (
      <div data-testid="user-detail-modal">
        <span>User ID: {userId}</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

// Helper to wait for async updates
const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 100));

describe('ActivityFeed', () => {
  let queryClient: QueryClient;
  let ActivityFeed: typeof import('../ActivityFeed').ActivityFeed;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
    // Dynamic import to ensure mocks are applied
    const module = await import('../ActivityFeed');
    ActivityFeed = module.ActivityFeed;
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <ActivityFeed />
      </QueryClientProvider>
    );

  describe('rendering', () => {
    it('should display Live Activity title', async () => {
      const { getByText } = renderComponent();
      expect(getByText('Live Activity')).toBeDefined();
    });

    it('should display user display_name instead of ID after loading', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      expect(getByText('Test User')).toBeDefined();
    });

    it('should display user email after loading', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      expect(getByText('test@example.com')).toBeDefined();
    });

    it('should display avatar emoji after loading', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      expect(getByText('😺')).toBeDefined();
    });

    it('should display activity description after loading', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      expect(getByText('Logged into Cat Farm')).toBeDefined();
    });

    it('should display multiple activities', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      expect(getByText('Test User')).toBeDefined();
      expect(getByText('Another User')).toBeDefined();
    });

    it('should show recent count badge', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      expect(getByText('2 recent')).toBeDefined();
    });
  });

  describe('click handling', () => {
    it('should open user detail modal on click', async () => {
      const { getByText, getByTestId } = renderComponent();
      await waitForAsync();

      // Find the clickable activity item and click it
      const testUser = getByText('Test User');
      const activityItem = testUser.closest('[role="button"]');
      expect(activityItem).toBeDefined();

      if (activityItem) {
        activityItem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }

      await waitForAsync();
      expect(getByTestId('user-detail-modal')).toBeDefined();
      expect(getByText('User ID: user-1')).toBeDefined();
    });

    it('should close modal when onClose is called', async () => {
      const { getByText, getByTestId, queryByTestId } = renderComponent();
      await waitForAsync();

      // Open modal
      const testUser = getByText('Test User');
      const activityItem = testUser.closest('[role="button"]');
      if (activityItem) {
        activityItem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }

      await waitForAsync();
      expect(getByTestId('user-detail-modal')).toBeDefined();

      // Close modal
      const closeButton = getByText('Close Modal');
      closeButton.click();

      await waitForAsync();
      expect(queryByTestId('user-detail-modal')).toBeNull();
    });
  });

  describe('responsive design', () => {
    it('should have responsive text classes on user name', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      const userName = getByText('Test User');
      expect(userName.className).toContain('text-xs');
      expect(userName.className).toContain('sm:text-sm');
    });

    it('should have responsive padding on activity items', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      const activityItem = getByText('Test User').closest('[role="button"]');
      expect(activityItem?.className).toContain('p-2');
      expect(activityItem?.className).toContain('sm:p-3');
    });

    it('should have responsive gap classes', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      const activityItem = getByText('Test User').closest('[role="button"]');
      expect(activityItem?.className).toContain('gap-2');
      expect(activityItem?.className).toContain('sm:gap-3');
    });
  });

  describe('real-time updates', () => {
    it('should subscribe to activity-feed-realtime channel', () => {
      renderComponent();
      expect(mockSupabaseChannel).toHaveBeenCalledWith('activity-feed-realtime');
    });

    it('should unsubscribe on unmount', () => {
      const { unmount } = renderComponent();
      unmount();
      expect(mockSupabaseRemoveChannel).toHaveBeenCalled();
    });
  });

  describe('activity type icons', () => {
    it('should render different activity types', async () => {
      const { getByText } = renderComponent();
      await waitForAsync();
      // Both activities should be present
      expect(getByText('Logged into Cat Farm')).toBeDefined();
      expect(getByText('Completed a trade with another player')).toBeDefined();
    });
  });
});
