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

function getButton() {
  return screen.getByRole('button');
}

describe('AutoSaveIndicator status transitions', () => {
  it('shows Saving… when an initial save is in progress', () => {
    renderIndicator({ isSyncing: true });
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(getButton()).toHaveAttribute('data-status', 'saving');
  });

  it('shows distinct Retrying… state when a retry is in flight', () => {
    renderIndicator({
      isSyncing: true,
      isRetrying: true,
      lastError: 'network',
      errorCount: 1,
    });
    expect(screen.getByText('Retrying…')).toBeInTheDocument();
    const btn = getButton();
    expect(btn).toHaveAttribute('data-status', 'retrying');
    // Retrying must be visually distinct from initial saving state
    expect(btn.className).not.toContain('text-primary');
  });

  it('shows Saved after a successful save completes', () => {
    renderIndicator({
      isSyncing: false,
      isRetrying: false,
      lastSaveTime: new Date().toISOString(),
      saveCount: 1,
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(getButton()).toHaveAttribute('data-status', 'saved');
  });

  it('shows Save failed when the last attempt errored with no prior save', () => {
    renderIndicator({
      lastError: 'boom',
      errorCount: 1,
    });
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(getButton()).toHaveAttribute('data-status', 'error');
  });
});
