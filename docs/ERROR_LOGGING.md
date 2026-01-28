# Cat Farm - Error Logging & Monitoring

## Overview
Cat Farm implements comprehensive error logging to track issues, debug problems, and improve reliability. All errors are logged to both console and a Supabase database table.

---

## Error Types Captured

### 1. Uncaught Errors
JavaScript exceptions not caught by try-catch blocks.

**Trigger:** `window.addEventListener('error', handler)`

**Captured Data:**
```typescript
{
  error_type: 'uncaught_error',
  error_message: event.message,
  error_stack: event.error?.stack,
  metadata: {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  }
}
```

**Example:** ReferenceError, TypeError, SyntaxError

---

### 2. Unhandled Promise Rejections
Async operations that fail without .catch().

**Trigger:** `window.addEventListener('unhandledrejection', handler)`

**Captured Data:**
```typescript
{
  error_type: 'unhandled_promise_rejection',
  error_message: error?.message || String(error),
  error_stack: error?.stack,
  metadata: {
    errorName: error?.name
  }
}
```

**Example:** Failed API calls, rejected promises

---

### 3. Component Errors
React component rendering failures.

**Trigger:** ErrorBoundary.componentDidCatch()

**Captured Data:**
```typescript
{
  error_type: 'component_error',
  error_message: error.message,
  error_stack: error.stack,
  component_name: componentName,
  metadata: {
    errorName: error.name,
    componentStack: errorInfo?.componentStack
  }
}
```

**Example:** Rendering errors, hook errors, prop type errors

---

### 4. Network Errors
Failed HTTP requests to APIs.

**Trigger:** Manual call in fetch error handlers

**Captured Data:**
```typescript
{
  error_type: 'network_error',
  error_message: `${method} ${url} failed with ${status} ${statusText}`,
  metadata: {
    url,
    status,
    statusText,
    method
  }
}
```

**Example:** Failed Supabase queries, 404/500 errors

---

### 5. Interaction Errors
Errors during user interactions.

**Trigger:** Manual call in event handlers

**Captured Data:**
```typescript
{
  error_type: 'interaction_error',
  error_message: error.message,
  error_stack: error.stack,
  metadata: {
    eventType,
    target,
    errorName: error.name
  }
}
```

**Example:** Click handler errors, form submission errors

---

## Error Log Schema

### Database Table: error_logs

```sql
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                    -- Nullable (unauthenticated errors)
  error_type TEXT NOT NULL,        -- uncaught_error, component_error, etc.
  error_message TEXT NOT NULL,     -- Truncated to 5000 chars
  error_stack TEXT,                -- Truncated to 10000 chars
  component_name TEXT,             -- React component name (if applicable)
  route TEXT,                      -- Current URL path
  user_agent TEXT,                 -- Browser info
  metadata JSONB DEFAULT '{}',     -- Additional context
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Metadata Structure
```typescript
{
  timestamp: string,        // ISO timestamp
  url: string,              // Full URL
  viewport: {
    width: number,
    height: number
  },
  // Error-specific fields...
  filename?: string,
  lineno?: number,
  colno?: number,
  componentStack?: string,
  // etc.
}
```

---

## Implementation

### useErrorLogger Hook

**Location:** `src/hooks/useErrorLogger.ts`

```typescript
export function useErrorLogger() {
  const { user } = useAuth();

  // Main logging function
  const logError = useCallback(async (data: ErrorLogData) => {
    const logEntry = {
      user_id: user?.id || null,
      error_type: data.error_type,
      error_message: data.error_message.slice(0, 5000),
      error_stack: data.error_stack?.slice(0, 10000) || null,
      component_name: data.component_name || null,
      route: data.route || window.location.pathname,
      user_agent: navigator.userAgent,
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      }
    };

    console.error('[ErrorLogger]', logEntry);
    await supabase.from('error_logs').insert([logEntry]);
  }, [user?.id]);

  // Specialized loggers
  const logInteractionError = (eventType, target, error) => {...};
  const logNetworkError = (url, status, statusText, method) => {...};
  const logComponentError = (componentName, error, errorInfo) => {...};

  // Set up global handlers on mount
  useEffect(() => {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('click', handleClickError, true);
    return () => { /* cleanup */ };
  }, [logError]);

  return { logError, logInteractionError, logNetworkError, logComponentError };
}
```

### Singleton Pattern
Prevents duplicate initialization:
```typescript
let isInitialized = false;

useEffect(() => {
  if (isInitialized) return;
  isInitialized = true;
  // ... setup handlers
  return () => { isInitialized = false; };
}, []);
```

---

### ErrorBoundary Component

**Location:** `src/components/ErrorBoundary.tsx`

```typescript
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logErrorToDatabase({
      error_type: 'component_error',
      error_message: error.message,
      error_stack: error.stack,
      component_name: 'ErrorBoundary',
      metadata: { componentStack: errorInfo?.componentStack }
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackUI onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
```

---

### ErrorLoggerProvider Component

**Location:** `src/components/ErrorLoggerProvider.tsx`

Wraps the app to initialize global error handlers:
```typescript
export function ErrorLoggerProvider({ children }) {
  useErrorLogger(); // Initializes handlers
  return <>{children}</>;
}
```

---

## Click Tracking

User clicks are tracked for error correlation:

```typescript
const handleClickError = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const targetInfo = target.tagName 
    + (target.id ? `#${target.id}` : '') 
    + (target.className ? `.${target.className.split(' ')[0]}` : '');
  
  window.__lastClick = {
    target: targetInfo,
    timestamp: Date.now(),
    x: event.clientX,
    y: event.clientY
  };
};
```

---

## Standalone Logging

For use outside React components:

```typescript
import { logErrorToDatabase } from '@/hooks/useErrorLogger';

// In edge function or utility
await logErrorToDatabase({
  error_type: 'edge_function_error',
  error_message: 'Failed to process rewards',
  metadata: { functionName: 'process-leaderboard-rewards' }
});
```

---

## Querying Error Logs

### Recent Errors
```sql
SELECT 
  error_type,
  error_message,
  route,
  created_at
FROM error_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Error Distribution
```sql
SELECT 
  error_type,
  COUNT(*) as count
FROM error_logs
WHERE created_at > now() - interval '7 days'
GROUP BY error_type
ORDER BY count DESC;
```

### User-Specific Errors
```sql
SELECT *
FROM error_logs
WHERE user_id = 'uuid-here'
ORDER BY created_at DESC;
```

### Component Errors
```sql
SELECT 
  component_name,
  error_message,
  metadata->>'componentStack' as stack,
  created_at
FROM error_logs
WHERE error_type = 'component_error'
ORDER BY created_at DESC;
```

### Network Errors
```sql
SELECT 
  metadata->>'url' as url,
  metadata->>'status' as status,
  metadata->>'method' as method,
  created_at
FROM error_logs
WHERE error_type = 'network_error'
ORDER BY created_at DESC;
```

---

## Rate Limiting

Prevents spam attacks by limiting error logs per time window.

### Configuration
```typescript
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_ERRORS_PER_WINDOW = 10;   // Max 10 errors per minute
```

### Behavior
| Scenario | Result |
|----------|--------|
| Normal usage (few errors) | All errors logged |
| Spam attack (100+ errors/sec) | Only first 10 per minute logged |
| Error storm clears | Logging resumes after 1 minute |

### Implementation
```typescript
function isRateLimited(): boolean {
  const now = Date.now();
  // Remove timestamps outside the window
  while (errorTimestamps.length > 0 && errorTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    errorTimestamps.shift();
  }
  // Check if we've exceeded the limit
  if (errorTimestamps.length >= MAX_ERRORS_PER_WINDOW) {
    console.warn('[ErrorLogger] Rate limit exceeded, skipping log');
    return true;
  }
  errorTimestamps.push(now);
  return false;
}
```

---

## Automatic Cleanup

Old error logs are automatically deleted to manage storage.

### Configuration
- **Retention Period**: 30 days
- **Schedule**: Daily at 3:00 AM UTC
- **Method**: Edge function called via pg_cron

### Edge Function: cleanup-error-logs
**Location:** `supabase/functions/cleanup-error-logs/index.ts`

```typescript
// Delete error logs older than 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const { data, error } = await supabase
  .from('error_logs')
  .delete()
  .lt('created_at', thirtyDaysAgo.toISOString())
  .select('id');
```

**Returns:**
```json
{
  "success": true,
  "deleted_count": 42,
  "cutoff_date": "2025-12-06T00:00:00.000Z",
  "timestamp": "2026-01-05T03:00:00.000Z"
}
```

### Database Setup (pg_cron)
```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Daily cleanup at 3 AM UTC
SELECT cron.schedule(
  'cleanup-error-logs-daily',
  '0 3 * * *',
  $$ SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/cleanup-error-logs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id; $$
);
```

---

## RLS Policies

```sql
-- Anyone authenticated can insert errors
CREATE POLICY "Authenticated users can insert errors"
ON public.error_logs FOR INSERT
WITH CHECK (true);

-- Users can only view their own errors
CREATE POLICY "Users can view their own errors"
ON public.error_logs FOR SELECT
USING (auth.uid() = user_id);

-- No UPDATE or DELETE allowed (cleanup via edge function with service role)
```

---

## Best Practices

### Do's
1. ✅ Log all unexpected errors
2. ✅ Include context (route, component, viewport)
3. ✅ Truncate long strings
4. ✅ Use try-catch for critical paths
5. ✅ Test error handling in development

### Don'ts
1. ❌ Log sensitive data (passwords, tokens)
2. ❌ Create infinite error loops
3. ❌ Log expected/handled errors
4. ❌ Block UI on logging failures

---

## Testing

### Unit Tests
Located in `src/hooks/__tests__/useErrorLogger.test.ts`:
- Rate limiting validation (10 errors per minute)
- Error type categorization (uncaught, promise, component, network, interaction)
- Metadata capture verification (viewport, route, timestamp)
- SVGAnimatedString handling for click targets

### Component Tests
Located in `src/components/__tests__/ErrorBoundary.test.tsx`:
- Children rendering when no error
- Fallback UI display on error
- Error logging to database
- Retry functionality with count tracking
- Automatic page reload after 3 retries

### Integration Tests
Located in `src/test/errorHandling.test.ts`:
- Full error flow validation
- Database logging verification
- Rate limiting integration
- Error correlation (click tracking, viewport, route)
- Graceful failure handling

### Running Tests
```bash
# Run all error tests
npm run test -- useErrorLogger
npm run test -- ErrorBoundary
npm run test -- errorHandling

# Run with coverage
npm run test -- --coverage useErrorLogger
```

---

## Error Handling Patterns

### API Call Error Handling
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  return data;
} catch (err) {
  logNetworkError('/table', 500, err.message, 'GET');
  throw err;
}
```

### Component Error Handling
```typescript
function MyComponent() {
  const { logComponentError } = useErrorLogger();
  
  const handleClick = () => {
    try {
      riskyOperation();
    } catch (error) {
      logComponentError('MyComponent', error);
      // Show user-friendly message
    }
  };
}
```

---

## Monitoring Dashboard Ideas

### Key Metrics
- Errors per day/hour
- Error rate by type
- Most affected routes
- Most affected components
- Error resolution time

### Alerting Triggers
- Error spike (>10x normal rate)
- New error types
- Critical component failures
- Network error patterns
