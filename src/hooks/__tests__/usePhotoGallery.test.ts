import { describe, it, expect, vi } from 'vitest';
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

  it('should expose savePhoto and deletePhoto', () => {
    const { result } = renderHook(() => usePhotoGallery('u1'));
    expect(typeof result.current.savePhoto).toBe('function');
    expect(typeof result.current.deletePhoto).toBe('function');
  });

  it('should expose toggleFavorite', () => {
    const { result } = renderHook(() => usePhotoGallery('u1'));
    expect(typeof result.current.toggleFavorite).toBe('function');
  });
});
