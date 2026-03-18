import { describe, it, expect } from 'vitest';

describe('useSaveLoad', () => {
  it('should be importable', async () => {
    const mod = await import('../useSaveLoad');
    expect(typeof mod.useSaveLoad).toBe('function');
  });
});
