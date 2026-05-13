import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AutoSaveIndicator, type AutoSaveStatus } from '../AutoSaveIndicator';

const baseStatus: AutoSaveStatus = {
  isSyncing: false,
  isRetrying: false,
  lastSaveTime: null,
  lastError: null,
  saveCount: 0,
  errorCount: 0,
};

function renderIndicator(status: Partial<AutoSaveStatus>) {
  return render(
    <AutoSaveIndicator
      status={{ ...baseStatus, ...status }}
      isLoggedIn
      hasLoadedCloud
      onManualSave={() => {}}
    />
  );
}

const getButton = () => screen.getByRole('button');

describe('AutoSaveIndicator status transitions', () => {
  it('shows Saving… when an initial save is in progress', () => {
    renderIndicator({ isSyncing: true });
    expect(screen.queryByText('Saving…')).not.toBeNull();
    expect(getButton().getAttribute('data-status')).toBe('saving');
  });

  it('shows distinct Retrying… state when a retry is in flight', () => {
    renderIndicator({
      isSyncing: true,
      isRetrying: true,
      lastError: 'network',
      errorCount: 1,
    });
    expect(screen.queryByText('Retrying…')).not.toBeNull();
    expect(screen.queryByText('Saving…')).toBeNull();
    const btn = getButton();
    expect(btn.getAttribute('data-status')).toBe('retrying');
    // Retrying must look distinct from the initial saving state
    expect(btn.className.includes('text-primary')).toBe(false);
  });

  it('shows Saved after a successful save completes', () => {
    renderIndicator({
      lastSaveTime: new Date().toISOString(),
      saveCount: 1,
    });
    expect(screen.queryByText('Saved')).not.toBeNull();
    expect(getButton().getAttribute('data-status')).toBe('saved');
  });

  it('shows Save failed when the last attempt errored with no prior save', () => {
    renderIndicator({
      lastError: 'boom',
      errorCount: 1,
    });
    expect(screen.queryByText('Save failed')).not.toBeNull();
    expect(getButton().getAttribute('data-status')).toBe('error');
  });
});
