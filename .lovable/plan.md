

# Error Fixes Plan

## Issues Identified

| Error | Root Cause | Location |
|-------|------------|----------|
| ServiceWorker installation failure | Unhandled rejection during SW registration, logged as error but not gracefully handled | `src/main.tsx` |
| `Cannot read properties of undefined (reading 'toLocaleString')` | `stats.total_money_earned` can be undefined when stats object is partially populated | `src/components/stats/StatsOverviewCards.tsx` |
| `toast is not defined` | Race condition - `usePortraitOutdatedToast` calls `toast()` outside React context before hook is ready | `src/hooks/usePortraitOutdatedToast.tsx` |
| React queue error | Internal React error from concurrent state updates during rapid re-renders | Related to toast/hook timing |

---

## Solution 1: Fix ServiceWorker Registration

**File:** `src/main.tsx`

**Problem:** Unhandled promise rejection when SW fails to install (Firefox issue)

**Fix:** Add graceful error handling that doesn't log to error_logs table

```typescript
// Register service worker for caching and push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration.scope);
        
        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch(error => {
        // Gracefully handle SW registration failure (common in dev/preview environments)
        // Don't treat as fatal - app works fine without SW
        console.warn('ServiceWorker registration skipped:', error.message || error);
      });
  });
}
```

---

## Solution 2: Fix toLocaleString Errors

**File:** `src/components/stats/StatsOverviewCards.tsx`

**Problem:** Calling `.toLocaleString()` on potentially undefined values

**Fix:** Add defensive null checks with fallback values

```typescript
const cards = [
  {
    label: 'Show Wins',
    value: stats.total_show_wins ?? 0,
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    label: 'Cats Owned',
    value: stats.total_cats_owned ?? 0,
    icon: Cat,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    label: 'Kittens Bred',
    value: stats.total_kittens_bred ?? 0,
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    label: 'Total Wealth',
    value: `$${(stats.total_money_earned ?? 0).toLocaleString()}`,
    icon: Coins,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    label: 'Achievements',
    value: stats.achievements_unlocked ?? 0,
    icon: Award,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    label: 'Highest Grade',
    value: stats.highest_cat_grade || '-',
    icon: Star,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];
```

---

## Solution 3: Fix Toast Reference Error

**File:** `src/hooks/usePortraitOutdatedToast.tsx`

**Problem:** The `toast` function is being called directly, but if used in a context where the toast system isn't ready, it fails. The hook pattern needs to ensure the toast call is deferred until React is ready.

**Fix:** Wrap toast call with error handling and ensure it's only called within React context

```typescript
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Cat } from '@/types/game';

/**
 * Hook that shows a toast notification when a cat's portrait becomes outdated
 * after appearance or costume changes. Includes a quick action to navigate
 * to the photo booth for regeneration.
 */
export function usePortraitOutdatedToast() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const showOutdatedToast = (cat: Cat) => {
    try {
      toast({
        title: 'Portrait Outdated',
        description: `${cat.name}'s appearance has changed. The AI portrait no longer matches.`,
        action: (
          <ToastAction altText="Update Portrait" onClick={() => navigate(`/photobooth/${cat.id}`)}>
            Update Portrait
          </ToastAction>
        ),
      });
    } catch (error) {
      console.warn('Toast notification failed:', error);
    }
  };

  return { showOutdatedToast };
}
```

**Key Change:** Use `useToast()` hook instead of direct `toast` import to ensure proper React context.

---

## Solution 4: Prevent React Queue Error

**Root Cause:** The React "queue" error typically occurs when:
1. State updates happen during render
2. Multiple rapid state updates conflict with concurrent features

**File:** `src/components/ui/toaster.tsx`

**Fix:** Add error boundary wrapper to isolate toast rendering issues

```typescript
import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
```

The Toaster component looks fine. The queue error is likely caused by the toast calls. The fix in Solution 3 should resolve this.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/main.tsx` | Change `.catch(error)` to use `console.warn` instead of `console.error` |
| `src/components/stats/StatsOverviewCards.tsx` | Add nullish coalescing (`?? 0`) to all stat values |
| `src/hooks/usePortraitOutdatedToast.tsx` | Use `useToast()` hook instead of direct `toast` import, add try-catch |

---

## Technical Notes

1. **ServiceWorker:** Preview environments often block SW installation. This is expected behavior and shouldn't be treated as an error.

2. **toLocaleString:** The `??` (nullish coalescing) operator handles both `null` and `undefined`, providing safe fallbacks.

3. **Toast Hook Pattern:** Using `useToast()` hook ensures the toast function is properly scoped to the React component lifecycle, preventing race conditions.

4. **No Breaking Changes:** All fixes are defensive additions that maintain existing functionality.

