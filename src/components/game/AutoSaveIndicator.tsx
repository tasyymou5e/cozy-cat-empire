/**
 * @fileoverview Auto-save status indicator component
 *
 * Displays the current sync status with visual feedback for:
 * - Syncing in progress
 * - Last save time
 * - Error state with retry indicator
 *
 * @module components/game/AutoSaveIndicator
 */

import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface AutoSaveStatus {
  /** Whether a save is currently in progress */
  isSyncing: boolean;
  /** Whether the system is retrying a failed save */
  isRetrying: boolean;
  /** ISO timestamp of last successful save */
  lastSaveTime: string | null;
  /** Last error message if save failed */
  lastError: string | null;
  /** Total successful saves this session */
  saveCount: number;
  /** Total errors this session */
  errorCount: number;
}

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  /** Whether the user is logged in */
  isLoggedIn: boolean;
  /** Whether cloud data has been loaded */
  hasLoadedCloud: boolean;
  /** Optional click handler for manual save */
  onManualSave?: () => void;
  /** Compact mode for mobile */
  compact?: boolean;
}

/**
 * Format a timestamp into a relative or absolute time string
 */
function formatSaveTime(isoString: string | null): string {
  if (!isoString) return 'Never';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;

  // Show time if same day
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Show date for older saves
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function AutoSaveIndicator({
  status,
  isLoggedIn,
  hasLoadedCloud,
  onManualSave,
  compact = false,
}: AutoSaveIndicatorProps) {
  // Not logged in - show login prompt
  if (!isLoggedIn) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-xs cursor-default">
              <CloudOff className="h-3.5 w-3.5" />
              {!compact && <span>Not synced</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Log in to enable cloud saves</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Loading cloud data
  if (!hasLoadedCloud) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-xs">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        {!compact && <span>Loading...</span>}
      </div>
    );
  }

  // Determine state
  const isSyncing = status.isSyncing || status.isRetrying;
  const hasError = status.lastError && status.errorCount > 0;
  const hasRecentSave = status.lastSaveTime !== null;

  // Icon and color based on state
  let Icon = Cloud;
  let colorClass = 'text-[hsl(var(--success))]';
  let bgClass = 'bg-[hsl(var(--success))]/10';
  let statusText = formatSaveTime(status.lastSaveTime);

  if (isSyncing) {
    Icon = RefreshCw;
    colorClass = 'text-primary';
    bgClass = 'bg-primary/10';
    statusText = status.isRetrying ? 'Retrying...' : 'Saving...';
  } else if (hasError && !hasRecentSave) {
    Icon = AlertCircle;
    colorClass = 'text-destructive';
    bgClass = 'bg-destructive/10';
    statusText = 'Save failed';
  } else if (hasRecentSave) {
    Icon = Check;
    colorClass = 'text-[hsl(var(--success))]';
    bgClass = 'bg-[hsl(var(--success))]/10';
  }

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <p className="font-medium">
        {isSyncing
          ? status.isRetrying
            ? 'Retrying save...'
            : 'Saving to cloud...'
          : hasError
            ? 'Last save failed'
            : 'Auto-save active'}
      </p>
      {status.lastSaveTime && (
        <p className="text-muted-foreground">
          Last saved: {new Date(status.lastSaveTime).toLocaleTimeString()}
        </p>
      )}
      {status.saveCount > 0 && (
        <p className="text-muted-foreground">
          {status.saveCount} save{status.saveCount !== 1 ? 's' : ''} this session
        </p>
      )}
      {hasError && <p className="text-destructive">{status.lastError}</p>}
      {onManualSave && <p className="text-muted-foreground italic">Click to save now</p>}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onManualSave}
            disabled={isSyncing || !onManualSave}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
              bgClass,
              colorClass,
              onManualSave && !isSyncing && 'hover:opacity-80 cursor-pointer',
              isSyncing && 'cursor-wait',
              !onManualSave && 'cursor-default'
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5',
                isSyncing && 'animate-spin'
              )}
            />
            {!compact && <span className="font-medium">{statusText}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
