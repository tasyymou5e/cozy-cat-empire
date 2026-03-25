import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/lib/routePrefetch', () => ({
  prefetchRoute: vi.fn(),
  prefetchCriticalRoutes: vi.fn(),
  prefetchAdminRoutes: vi.fn(),
}));

describe('usePrefetch', () => {
  it('should provide prefetchOnInteraction function', async () => {
    const { usePrefetch } = await import('../usePrefetch');
    const { result } = renderHook(() => usePrefetch());
    expect(typeof result.current.prefetchOnInteraction).toBe('function');
  });

  it('should call prefetchRoute on interaction', async () => {
    const { prefetchRoute } = await import('@/lib/routePrefetch');
    const { usePrefetch } = await import('../usePrefetch');
    const { result } = renderHook(() => usePrefetch());
    act(() => result.current.prefetchOnInteraction('/collection'));
    expect(prefetchRoute).toHaveBeenCalledWith('/collection');
  });
});
