# Cat Farm - Performance Optimizations

## Overview
Cat Farm implements comprehensive performance optimizations to ensure fast load times, smooth interactions, and efficient resource usage.

---

## Bundle Splitting

### Route-Level Code Splitting
All pages are lazy-loaded using React.lazy():

| Route | Component | Notes |
|-------|-----------|-------|
| / | Index | Main game |
| /collection | CatCollection | Trading cards |
| /gallery | CatGallery | Photo gallery |
| /photobooth/:catId | CatPhotoBooth | Photo booth |
| /customize/:catId | CatCustomization | Cat customization |
| /relationships | CatRelationships | Relationship network |
| /stats | Stats | Player statistics |
| /leaderboard | Leaderboard | Global rankings |
| /auth | Auth | Login/signup |
| /catking/* | Admin* | 14 admin pages |

### Manual Chunk Configuration (vite.config.ts)

| Chunk | Contents | Purpose |
|-------|----------|---------|
| vendor-react | react, react-dom, react-router-dom | Core framework (~140KB) |
| vendor-query | @tanstack/react-query | Data fetching (~40KB) |
| vendor-supabase | @supabase/supabase-js | Backend client (~50KB) |
| ui-radix | 23 @radix-ui/* components | UI primitives (~80KB) |
| charts | recharts | Data visualization (~200KB) |
| paper-avatar | paper, catVectorGenerator | Vector avatars (~150KB) |
| virtualization | react-virtuoso | List virtualization (~25KB) |
| date-utils | date-fns, react-day-picker | Date handling (~30KB) |
| forms | react-hook-form, zod | Form management (~35KB) |
| effects | canvas-confetti, html-to-image | Visual effects (~20KB) |
| icons | lucide-react | Icon library (~15KB) |

---

## Caching Strategy

### Service Worker (public/sw.js)

| Asset Type | Strategy | Rationale |
|------------|----------|-----------|
| JS/CSS | Cache-first | Versioned, immutable |
| Images | Cache-first | Rarely change |
| HTML | Network-first | Need fresh content |
| Supabase API | Network-only | Real-time data |

### Cache Versioning
- `CACHE_VERSION` constant controls cache invalidation
- Old caches automatically cleaned on service worker activation
- Precached assets: `/`, `/index.html`, `/favicon.ico`, `/og-image.png`

### PWA Support
- Web app manifest for installability (`public/manifest.json`)
- Offline access to cached pages
- "Add to Home Screen" capability

---

## React Optimizations

### Memoization
Components using React.memo with optimized comparison:

| Component | Custom Comparison | Notes |
|-----------|-------------------|-------|
| UnifiedCatCard | arePropsEqual | Shallow + reaction/array length checks |
| VirtualizedCatGrid | Default | Memoized wrapper |
| CatCardItem | Default | Internal to VirtualizedCatGrid |
| LeaderboardPanel | Default | List rendering |
| AchievementsPanel | Default | Grid rendering |
| RelationshipDirectory | Default | Filtered list |

### Virtual Scrolling
`VirtualizedCatGrid` component (`src/components/game/VirtualizedCatGrid.tsx`):
- Uses `react-virtuoso` VirtuosoGrid for 20+ items
- Falls back to regular CSS grid for smaller lists
- Configurable threshold via `virtualizationThreshold` prop
- 200px overscan for smooth scrolling
- Uses window scroll for better mobile experience

### Debounced Inputs
`useDebouncedSearch` hook (`src/hooks/useDebouncedSearch.ts`):
- 300ms default delay (configurable)
- Prevents expensive re-renders on keystroke
- Used in: CatCollection, AdminUsers, RelationshipDirectory

---

## Prefetching

### Route Prefetching System
Files: `src/lib/routePrefetch.ts`, `src/hooks/usePrefetch.ts`

**Critical Routes** (prefetched on app load):
- `/` (main game)
- `/collection` (trading cards)

**Hover Prefetching** (`src/components/PrefetchLink.tsx`):
- Triggers on mouse hover or keyboard focus
- Uses `requestIdleCallback` for non-blocking prefetch
- Falls back to `setTimeout` if not supported

**Admin Prefetching** (when admin section accessed):
- `/catking/users`
- `/catking/stats`
- `/catking/errors`
- `/catking/moderation`
- `/catking/settings`

---

## Lazy Loading

### Paper.js Avatar
`PaperCatAvatar` dynamically imports Paper.js:
```typescript
const paperModule = await import('paper');
```
- Module loaded only when component renders
- Loading skeleton shown during import
- Falls back to CatAvatar on error
- Isolated in `paper-avatar` chunk

### Route Components
All pages use React.lazy with Suspense:
```typescript
const CatCollection = lazy(() => import('./pages/CatCollection'));
```
- PageLoader fallback component with animated cat emoji
- Error boundary for graceful failures

---

## Performance Metrics

### Expected Results
| Metric | Before | After |
|--------|--------|-------|
| Initial bundle | ~800KB | ~300KB (main chunk) |
| Time to Interactive | ~3s | ~1.5s |
| Repeat visit load | Full fetch | Instant from cache |
| Large list (50+ cats) | Laggy scroll | Smooth 60fps |
| Search input | Jank on type | Smooth debounced |

### Verification Steps

1. **Bundle Analysis**: Run `npm run build` and check `dist/assets/`
2. **Network Tab**: Verify lazy loading on route navigation
3. **Service Worker**: Check DevTools → Application → Service Workers
4. **Cache Storage**: Verify assets in Application → Cache Storage
5. **Offline Mode**: Test cached pages work offline
6. **React DevTools**: Check component memoization effectiveness

---

## Files Reference

| File | Purpose |
|------|---------|
| `vite.config.ts` | Manual chunk configuration |
| `src/App.tsx` | Route-level code splitting |
| `src/main.tsx` | Service worker registration |
| `public/sw.js` | Caching strategies |
| `public/manifest.json` | PWA manifest |
| `src/lib/routePrefetch.ts` | Prefetch utilities |
| `src/hooks/usePrefetch.ts` | Prefetch hook |
| `src/components/PrefetchLink.tsx` | Hover prefetch link |
| `src/hooks/useDebouncedSearch.ts` | Debounce hook |
| `src/components/game/VirtualizedCatGrid.tsx` | Virtual scrolling |
| `src/components/game/UnifiedCatCard.tsx` | Memoized cat card |
