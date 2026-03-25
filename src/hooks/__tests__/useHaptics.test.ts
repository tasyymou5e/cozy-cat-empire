import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('./use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('useHaptics', () => {
  it('should provide vibration functions', async () => {
    const { useHaptics } = await import('../useHaptics');
    const { result } = renderHook(() => useHaptics());
    expect(typeof result.current.vibrate).toBe('function');
    expect(result.current.isSupported).toBe(false);
  });
});
