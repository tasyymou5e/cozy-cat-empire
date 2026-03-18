import { describe, it, expect, vi } from 'vitest';

describe('useGameCore', () => {
  it('should be importable', async () => {
    const mod = await import('../useGameCore');
    expect(typeof mod.useGameCore).toBe('function');
  });
});
