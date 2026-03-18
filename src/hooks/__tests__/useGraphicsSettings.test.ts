import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useGraphicsSettings } from '../useGraphicsSettings';

describe('useGraphicsSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useGraphicsSettings());
    expect(result.current.settings).toBeDefined();
    expect(result.current.settings.quality).toBeDefined();
  });

  it('should expose updateSettings', () => {
    const { result } = renderHook(() => useGraphicsSettings());
    expect(typeof result.current.updateSettings).toBe('function');
  });
});
