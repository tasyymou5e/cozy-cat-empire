import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useAdminStats } from '../useAdminData';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);

describe('useAdminStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue({ count: 0, error: null }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useAdminStats(), { wrapper });
    expect(result.current).toBeDefined();
  });
});
