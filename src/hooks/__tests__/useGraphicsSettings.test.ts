import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useGraphicsSettings } from '../useGraphicsSettings';

describe('useGraphicsSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useGraphicsSettings());
    expect(result.current.settings).toBeDefined();
  });

  it('should expose updateSetting', () => {
    const { result } = renderHook(() => useGraphicsSettings());
    expect(typeof result.current.updateSetting).toBe('function');
  });

  it('should expose resetToDefaults', () => {
    const { result } = renderHook(() => useGraphicsSettings());
    expect(typeof result.current.resetToDefaults).toBe('function');
  });
});
