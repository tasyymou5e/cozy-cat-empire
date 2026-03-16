/**
 * @fileoverview Tests for the real logger implementation
 *
 * Uses vi.importActual to bypass the global mock in setup.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock logger for this test file so we test the real implementation
vi.unmock('@/lib/logger');

describe('createLogger', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('creates a logger with all methods', async () => {
    const { createLogger } = await vi.importActual<typeof import('@/lib/logger')>('@/lib/logger');
    const log = createLogger('Test');
    expect(log).toHaveProperty('debug');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('error');
  });

  it('warn always outputs with namespace prefix', async () => {
    const { createLogger } = await vi.importActual<typeof import('@/lib/logger')>('@/lib/logger');
    const log = createLogger('MyModule');
    log.warn('something happened');
    expect(warnSpy).toHaveBeenCalledWith('[MyModule]', 'something happened');
  });

  it('error always outputs with namespace prefix', async () => {
    const { createLogger } = await vi.importActual<typeof import('@/lib/logger')>('@/lib/logger');
    const log = createLogger('MyModule');
    log.error('bad thing', { code: 500 });
    expect(errorSpy).toHaveBeenCalledWith('[MyModule]', 'bad thing', { code: 500 });
  });
});
