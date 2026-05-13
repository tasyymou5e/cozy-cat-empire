import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { globalSupabaseMock } from '@/test/supabaseMock';

import { usePhotoGallery } from '../usePhotoGallery';

describe('usePhotoGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalSupabaseMock.reset();
  });

  it('should initialize with empty photos', () => {
    const { result } = renderHook(() => usePhotoGallery(undefined));
    expect(Array.isArray(result.current.photos)).toBe(true);
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
