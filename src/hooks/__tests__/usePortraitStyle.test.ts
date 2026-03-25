import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/config/portraitSettings', () => ({
  getGlobalPortraitStyle: () => 'realistic',
  setGlobalPortraitStyle: vi.fn(),
  getEffectivePortraitStyle: (catStyle: string | undefined, global: string) => catStyle || global,
}));

describe('usePortraitStyle', () => {
  it('should return global default style', async () => {
    const { usePortraitStyle } = await import('../usePortraitStyle');
    const { result } = renderHook(() => usePortraitStyle());
    expect(result.current.globalDefault).toBe('realistic');
  });

  it('should get style for cat', async () => {
    const { usePortraitStyle } = await import('../usePortraitStyle');
    const { result } = renderHook(() => usePortraitStyle());
    const style = result.current.getStyleForCat({ portraitStyle: 'kawaii' } as any);
    expect(style).toBe('kawaii');
  });
});
