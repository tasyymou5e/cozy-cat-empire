
# Plan: Error Correction, Race Condition Validation, and Live Stats Feed Integration

## Executive Summary

After a comprehensive audit of the codebase, I've identified that the existing race condition safeguards are **working correctly** and the sync health monitoring system is **fully operational**. The plan focuses on:

1. Creating an error-checking test suite (Vitest)
2. Adding the sync-health-check job to the AdminScheduledJobs UI
3. Enhancing frontend error handling with better user feedback
4. Updating all admin portal documentation

---

## Current System State

### Race Condition Safeguards (Verified Working)

| Pattern | Locations | Status |
|---------|-----------|--------|
| `isMounted` ref guards | CatCollection, Empire, CatRelationships, CatCustomization | Active |
| `subscribedUserId` capture | usePlayerProfile, useFriends, useCatGifts, useTrading | Active |
| `isLoadedRef` cloud save gate | useCloudSave | Active |
| `updateQueueRef` serialization | useWeeklyChallenges | Active |

### Cron Jobs (All Active)

| Job Name | Schedule | Last Run | Status |
|----------|----------|----------|--------|
| `sync-health-check-10min` | Every 10 min | 2026-01-28 02:50 | 2 saves checked, 0 issues |
| `generate-weekly-challenges` | Sundays midnight | Active | Working |
| `process-leaderboard-rewards` | Daily 1 AM | Active | Working |
| `cleanup-error-logs-daily` | Daily 3 AM | Active | Working |

### Errors (Last 24h)

No errors found in `error_logs` table for the past 24 hours.

---

## Implementation Plan

### Phase 1: Create Error Checking Test Suite

Create comprehensive Vitest tests for error handling validation.

**New File: `src/hooks/__tests__/useErrorLogger.test.ts`**

```typescript
/**
 * @fileoverview Tests for error logging system
 * 
 * Validates error capture, rate limiting, and database logging.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useErrorLogger', () => {
  describe('rate limiting', () => {
    it('should allow logging up to 10 errors per minute');
    it('should block logging after rate limit exceeded');
    it('should reset rate limit after window expires');
  });

  describe('error capture', () => {
    it('should capture uncaught errors with correct metadata');
    it('should capture unhandled promise rejections');
    it('should capture component errors from ErrorBoundary');
    it('should handle SVGAnimatedString in click targets');
  });

  describe('logErrorToDatabase standalone function', () => {
    it('should log errors without React hooks context');
    it('should respect rate limiting');
    it('should truncate long messages and stacks');
  });
});
```

**New File: `src/components/__tests__/ErrorBoundary.test.tsx`**

```typescript
/**
 * @fileoverview Tests for ErrorBoundary component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should render children when no error');
  it('should render fallback UI when error thrown');
  it('should log error to database via logErrorToDatabase');
  it('should allow retry after error');
  it('should show Go Home button');
  it('should show error details in development mode');
});
```

### Phase 2: Add sync-health-check to AdminScheduledJobs

**Modify: `src/pages/admin/AdminScheduledJobs.tsx`**

Add sync-health-check to the display maps:

```typescript
// Line 69-73: Update JOB_FUNCTION_MAP
const JOB_FUNCTION_MAP: Record<string, string> = {
  'generate-weekly-challenges': 'generate-weekly-challenges',
  'process-leaderboard-rewards': 'process-leaderboard-rewards',
  'cleanup-error-logs-daily': 'cleanup-error-logs',
  'sync-health-check-10min': 'sync-health-check', // NEW
};

// Line 76-89: Update JOB_INFO
const JOB_INFO: Record<string, { icon: string; description: string }> = {
  'generate-weekly-challenges': {
    icon: '📋',
    description: 'Generates new weekly challenge quests for all players',
  },
  'process-leaderboard-rewards': {
    icon: '🏆',
    description: 'Awards daily, weekly, and monthly leaderboard rewards',
  },
  'cleanup-error-logs-daily': {
    icon: '🗑️',
    description: 'Removes error logs older than 30 days',
  },
  'sync-health-check-10min': {  // NEW
    icon: '🩺',
    description: 'Validates data integrity across active game saves every 10 minutes',
  },
};

// Line 92-96: Update JOB_COLORS
const JOB_COLORS: Record<string, string> = {
  'process-leaderboard-rewards': '#3b82f6',
  'generate-weekly-challenges': '#10b981',
  'cleanup-error-logs-daily': '#f59e0b',
  'sync-health-check-10min': '#ec4899', // NEW - pink color
};
```

### Phase 3: Enhance Frontend Error User Feedback

**Modify: `src/components/ErrorBoundary.tsx`**

Add better user feedback and refresh tracking:

```typescript
// Add retry count tracking
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;  // NEW
}

// In constructor:
this.state = {
  hasError: false,
  error: null,
  errorInfo: null,
  retryCount: 0,  // NEW
};

// Enhanced handleRetry:
handleRetry = () => {
  if (this.state.retryCount >= 3) {
    // After 3 retries, suggest a full page reload
    window.location.reload();
  }
  this.setState((prev) => ({
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: prev.retryCount + 1,
  }));
};
```

**Modify: `src/hooks/useErrorLogger.ts`**

Add user-friendly toast notifications for critical errors:

```typescript
// Add optional toast notification for user awareness
export function useErrorLogger() {
  // ... existing code ...
  
  // Add useToast import and use it for critical errors
  const logCriticalError = useCallback(
    (error: Error, context: string) => {
      logError({
        error_type: 'critical_error',
        error_message: error.message,
        error_stack: error.stack,
        metadata: { context }
      });
      
      // Show user-friendly toast
      toast({
        title: 'An error occurred',
        description: 'Our team has been notified. Please try again.',
        variant: 'destructive',
      });
    },
    [logError]
  );
  
  return {
    logError,
    logInteractionError,
    logNetworkError,
    logComponentError,
    logCriticalError, // NEW
  };
}
```

### Phase 4: Create Comprehensive Frontend Error Tests

**New File: `src/test/errorHandling.test.ts`**

Integration tests for the full error handling flow:

```typescript
/**
 * @fileoverview Integration tests for error handling flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Error Handling Integration', () => {
  describe('Rate limiting', () => {
    it('should not exceed 10 errors per minute to database');
    it('should log warning when rate limited');
  });

  describe('Error correlation', () => {
    it('should track last click for error context');
    it('should include viewport dimensions');
    it('should include current route');
  });

  describe('Error types', () => {
    it('should categorize uncaught_error correctly');
    it('should categorize unhandled_promise_rejection correctly');
    it('should categorize react_error_boundary correctly');
    it('should categorize network_error correctly');
    it('should categorize interaction_error correctly');
  });
});
```

### Phase 5: Update Admin Portal Documentation

**Update: `docs/ADMIN_DASHBOARD.md`**

Add sections for:
1. Sync Health monitoring integration with Dashboard
2. AdminScheduledJobs page updated job list
3. AdminSaveRecovery page documentation

```markdown
### 17. Scheduled Jobs (`/catking/scheduled-jobs`)

Manage and monitor cron jobs:
- **Active Jobs List**: View all scheduled cron jobs with status
- **Job Details**: Schedule, description, last run time, success rate
- **Manual Trigger**: Execute any job on-demand with confirmation
- **Job Trends Chart**: Visualize job run history over 14 days
- **Run History Table**: Detailed view of recent job executions
- **Alert Configuration**: Enable/disable job failure notifications

**Available Jobs:**
| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-health-check-10min` | Every 10 min | Validates game save data integrity |
| `generate-weekly-challenges` | Sundays midnight | Creates weekly player challenges |
| `process-leaderboard-rewards` | Daily 1 AM | Awards leaderboard prizes |
| `cleanup-error-logs-daily` | Daily 3 AM | Prunes old error logs |

### 18. Save Recovery (`/catking/save-recovery`)

Data integrity monitoring and recovery:
- **Sync Health Summary**: Overview of recent integrity checks
- **Issues Table**: List of saves with detected problems
- **Recovery Actions**: Tools to restore lost data
- **Snapshot History**: View save history for comparison
```

**Update: `docs/ERROR_LOGGING.md`**

Add testing and rate limiting documentation:

```markdown
## Testing

### Unit Tests
Located in `src/hooks/__tests__/useErrorLogger.test.ts`:
- Rate limiting validation
- Error type categorization
- Metadata capture verification

### Integration Tests
Located in `src/test/errorHandling.test.ts`:
- Full error flow validation
- Database logging verification
- User notification testing

### Running Tests
```bash
npm run test -- useErrorLogger
npm run test -- errorHandling
```

## Rate Limiting

To prevent abuse and database flooding:
- **Window**: 60 seconds (1 minute)
- **Max Errors**: 10 per window
- **Behavior**: Errors beyond limit are logged to console but not stored
- **Warning**: Console warning when rate limit exceeded

This prevents malicious users from overwhelming the error_logs table.
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/__tests__/useErrorLogger.test.ts` | **Create** | Unit tests for error logger hook |
| `src/components/__tests__/ErrorBoundary.test.tsx` | **Create** | Component tests for ErrorBoundary |
| `src/test/errorHandling.test.ts` | **Create** | Integration tests for error flow |
| `src/pages/admin/AdminScheduledJobs.tsx` | **Modify** | Add sync-health-check to UI |
| `src/components/ErrorBoundary.tsx` | **Modify** | Add retry count and better UX |
| `docs/ADMIN_DASHBOARD.md` | **Update** | Add new admin page documentation |
| `docs/ERROR_LOGGING.md` | **Update** | Add testing section |
| `docs/CRON_JOBS.md` | **Update** | Already current, verify accuracy |

---

## Summary

The system is in **good health**:
- All 4 cron jobs are running (including sync-health-check every 10 minutes)
- Race condition guards are properly implemented across all real-time hooks
- No errors logged in the last 24 hours
- Data integrity checks show 0 issues

This plan adds:
1. **Comprehensive test coverage** for error handling (unit + integration)
2. **UI visibility** for the sync-health-check job in AdminScheduledJobs
3. **Enhanced user feedback** for critical errors
4. **Updated documentation** for admin portal

No breaking changes to existing functionality.
