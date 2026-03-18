import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  }),
}));

import { getCachedAvatar, setCachedAvatar, clearAvatarCache, generateAppearanceHash } from '../avatarCache';

describe('avatarCache', () => {
  it('should return null for uncached key', () => {
    const result = getCachedAvatar('nonexistent-hash');
    expect(result).toBeNull();
  });

  it('should store and retrieve cached avatars', () => {
    setCachedAvatar('test-hash', '<svg>test</svg>');
    const result = getCachedAvatar('test-hash');
    expect(result).toBe('<svg>test</svg>');
  });

  it('should clear cache', () => {
    setCachedAvatar('test-hash-2', '<svg>test2</svg>');
    clearAvatarCache();
    expect(getCachedAvatar('test-hash-2')).toBeNull();
  });

  it('generateAppearanceHash should return a string', () => {
    const cat = {
      id: 'c1', breed: 'tabby',
      appearance: { furColor: 'orange', pattern: 'tabby', eyeColor: 'green', hairLength: 'short', facialFeatures: [] },
    } as any;
    const hash = generateAppearanceHash(cat);
    expect(typeof hash).toBe('string');
  });
});
