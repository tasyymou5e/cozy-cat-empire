import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

describe('useAuthSounds', () => {
  it('should provide play function', async () => {
    const { useAuthSounds } = await import('../useAuthSounds');
    const { result } = renderHook(() => useAuthSounds());
    expect(typeof result.current.playCatSound).toBe('function');
  });
});
