import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

import { usePhotoGallery } from '../usePhotoGallery';

describe('usePhotoGallery', () => {
  it('should initialize with empty photos', () => {
    const { result } = renderHook(() => usePhotoGallery(undefined));
    expect(result.current.photos).toEqual([]);
  });

  it('should expose addPhoto and deletePhoto', () => {
    const { result } = renderHook(() => usePhotoGallery('u1'));
    expect(typeof result.current.addPhoto).toBe('function');
    expect(typeof result.current.deletePhoto).toBe('function');
  });

  it('should expose toggleFavorite', () => {
    const { result } = renderHook(() => usePhotoGallery('u1'));
    expect(typeof result.current.toggleFavorite).toBe('function');
  });
});
