
Goal: fix 3 user-reported issues in one pass:
1) Matchmaking card content clipping/not scaling
2) Action-response popups not fading and stacking
3) Service worker `Response.clone()` runtime error on matchmaking page

Root-cause findings from current code:
- `src/components/game/MatchmakingPanel.tsx` uses rigid single-row flex blocks (`items-center justify-between`) with no `min-w-0`, no truncation/wrap strategy, and fixed small typography in a narrow sidebar (`.action-sidebar` is `lg:w-80`), so long names/reasons get clipped.
- Action messages are driven by `useGameMessages`; queue can build quickly and errors are configured as manual-dismiss (`autoDismiss: 0`), which matches “does not fade away / keeps stacking”.
- `public/sw.js` line ~160 (`staleWhileRevalidate`) clones the response inside a fire-and-forget async branch (`caches.open(...).then(...)`). If the app consumes body first (e.g., JSON/Lottie fetch), clone can throw “body already used” and becomes an unhandled promise rejection.

Implementation plan:

1) Matchmaking layout hardening (responsive + no clipping)
- File: `src/components/game/MatchmakingPanel.tsx`
- Convert each suggestion row to responsive structure:
  - Top row becomes `flex-col sm:flex-row` with badge wrapping under on small widths.
  - Cat pair sub-row uses `min-w-0`, `flex-wrap`, and truncation (`truncate`, `max-w-*`) on names.
  - Reason text uses `break-words`/`leading-relaxed` and optional line clamp.
  - Bottom action row becomes `flex-col sm:flex-row` with proper spacing.
- Keep scroll area but make height responsive (`h-[18rem] sm:h-64`) so content scales better.

2) Fix message popup stacking/fade behavior
- File: `src/hooks/useGameMessages.ts`
- Change default error timeout from manual-only to finite auto-dismiss (e.g., 6–8s) so action responses clear without manual close.
- Strengthen dedupe:
  - Skip enqueue if same text+type is current or already in queue within dedupe window.
  - Increase dedupe window and add queue cap (drop oldest/lowest-priority when full).
- Preserve priority behavior (critical can still interrupt).

- File: `src/components/game/MessageBar.tsx` (small stabilization)
  - Ensure transition state handles rapid message swaps cleanly (no stuck “in/out” class state).
  - Keep queue counter accurate while transitions occur.

3) Service worker clone error fix
- File: `public/sw.js`
- Refactor `staleWhileRevalidate` to clone immediately (synchronously in the response handler) before any async cache operations.
- Wrap cache write in guarded `try/catch` (or returned promise chain) so cache failures never produce unhandled rejections.
- Add safe caching guards (`response.ok`, skip problematic cases like body already used / range responses).
- Optionally bump `CACHE_VERSION` (e.g., `v3`) so clients rotate to the fixed worker/cache set cleanly.

4) Regression/verification checklist
- Matchmaking panel:
  - Test narrow/mobile and desktop widths with long cat names.
  - Confirm no clipped text and buttons remain accessible.
- Message popups:
  - Trigger repeated action responses quickly; verify they auto-fade and queue does not grow unbounded.
- SW error:
  - Reload app, open matchmaking flow, monitor console for `Response body is already used` (should be gone).
  - Confirm no offline/cache regressions for normal navigation and static assets.

Files to update:
- `src/components/game/MatchmakingPanel.tsx`
- `src/hooks/useGameMessages.ts`
- `src/components/game/MessageBar.tsx`
- `public/sw.js`
