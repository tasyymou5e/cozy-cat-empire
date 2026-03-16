import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger } from '../logger';

describe('createLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates a logger with all methods', () => {
    const log = createLogger('Test');
    expect(log).toHaveProperty('debug');
    expect(log).toHaveProperty('info');
    expect(log).toHaveProperty('warn');
    expect(log).toHaveProperty('error');
  });

  it('warn always outputs with namespace prefix', () => {
    const log = createLogger('MyModule');
    log.warn('something happened');
    expect(console.warn).toHaveBeenCalledWith('[MyModule]', 'something happened');
  });

  it('error always outputs with namespace prefix', () => {
    const log = createLogger('MyModule');
    log.error('bad thing', { code: 500 });
    expect(console.error).toHaveBeenCalledWith('[MyModule]', 'bad thing', { code: 500 });
  });
});
