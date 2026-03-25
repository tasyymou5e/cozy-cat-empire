import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('./use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('useHaptics', () => {
  it('should provide vibration functions', async () => {
    const mod = await import('../useHaptics');
    const useHaptics = mod.default || mod.useHaptics;
    const { result } = renderHook(() => useHaptics());
    expect(typeof result.current.vibrate).toBe('function');
    expect(result.current.isSupported).toBe(false); // jsdom has no vibration API
  });
});
