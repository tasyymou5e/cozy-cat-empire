import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import { useOrphanDetection, createRecoveryCat } from '../useOrphanDetection';

describe('useOrphanDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with no orphans', () => {
    const { result } = renderHook(() => useOrphanDetection(undefined, []));
    expect(result.current.orphanedCats).toEqual([]);
    expect(result.current.hasOrphans).toBe(false);
    expect(result.current.isChecking).toBe(false);
  });

  it('should not check without userId', async () => {
    const { result } = renderHook(() => useOrphanDetection(undefined, []));
    await act(async () => {
      await result.current.checkForOrphans();
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should detect orphaned cats', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'gallery_photos') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ cat_id: 'orphan-1', cat_name: 'Lost Kitty' }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'ai_usage_log') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    const { result } = renderHook(() =>
      useOrphanDetection('user-1', ['existing-cat-1'])
    );

    await act(async () => {
      await result.current.checkForOrphans();
    });

    expect(result.current.orphanedCats.length).toBe(1);
    expect(result.current.orphanedCats[0].catName).toBe('Lost Kitty');
    expect(result.current.hasOrphans).toBe(true);
  });

  it('should dismiss orphans', () => {
    const { result } = renderHook(() => useOrphanDetection(undefined, []));
    act(() => {
      result.current.dismissOrphans();
    });
    expect(result.current.orphanedCats).toEqual([]);
  });
});

describe('createRecoveryCat', () => {
  it('should create a cat from orphan data', () => {
    const orphan = {
      catId: 'cat-1',
      catName: 'Whiskers',
      breed: 'persian' as const,
      portraitUrl: 'https://example.com/portrait.jpg',
      galleryPhotoCount: 3,
      lastSeen: '2024-01-01',
    };

    const cat = createRecoveryCat(orphan);
    expect(cat.id).toBe('cat-1');
    expect(cat.name).toBe('Whiskers');
    expect(cat.breed).toBe('persian');
    expect(cat.portraitUrl).toBe('https://example.com/portrait.jpg');
    expect(cat.health).toBe(100);
    expect(cat.happiness).toBe(100);
  });
});
