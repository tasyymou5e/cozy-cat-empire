import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import { avatarCache } from '../avatarCache';

describe('avatarCache', () => {
  it('should be defined', () => {
    expect(avatarCache).toBeDefined();
  });

  it('should expose get and set methods', () => {
    expect(typeof avatarCache.get).toBe('function');
    expect(typeof avatarCache.set).toBe('function');
  });

  it('should return undefined for uncached key', () => {
    const result = avatarCache.get('nonexistent');
    expect(result).toBeUndefined();
  });
});
