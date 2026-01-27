
# Navigation Consistency Implementation Plan

## Current State Analysis

### ✅ Pages WITH Left Sidebar
| Page | Route | Implementation |
|------|-------|----------------|
| Main Game (CatFarm) | `/` | Uses `SidebarProvider` + `GameSidebar` |

### ❌ Pages WITHOUT Left Sidebar (Gaps)
| Page | Route | Current Navigation |
|------|-------|-------------------|
| Empire | `/empire` | Header with Breadcrumbs only |
| Cat Collection | `/collection` | Header with Breadcrumbs only |
| Cat Relationships | `/relationships` | Header with Breadcrumbs only |
| Cat Customization | `/customize/:catId?` | Header with Back button only |
| Cat Photo Booth | `/photobooth/:catId?` | Header with Breadcrumbs only |
| Cat Gallery | `/gallery` | Header with Breadcrumbs only |
| Stats | `/stats` | Header with Breadcrumbs only |
| Leaderboard | `/leaderboard` | Header with Breadcrumbs only |

---

## Recommended Solution: Shared Game Layout Component

Create a reusable `GameLayout` wrapper component that provides consistent sidebar navigation across all game pages. This approach:
- Centralizes navigation logic
- Ensures consistency automatically
- Makes future changes easier
- Reduces code duplication

---

## Implementation Plan

### Phase 1: Create Shared Layout Component
**File:** `src/components/layouts/GameLayout.tsx`

```text
Structure:
┌────────────────────────────────────────────────────┐
│                    GameLayout                       │
│  ┌─────────────┬──────────────────────────────────┐│
│  │             │                                  ││
│  │  GameSidebar│    SidebarInset                  ││
│  │             │    ┌────────────────────────────┐││
│  │  - Categories│    │ Page Header (Breadcrumbs) │││
│  │  - External │    ├────────────────────────────┤││
│  │    Links    │    │                            │││
│  │             │    │    {children}              │││
│  │             │    │                            │││
│  │             │    └────────────────────────────┘││
│  └─────────────┴──────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

**Features:**
- Wraps content in `SidebarProvider`
- Renders `GameSidebar` on the left
- Accepts `children` for page content
- Supports optional `activeTab` highlighting for external pages
- Passes through necessary game state (day, money) for sidebar display

**Estimated Lines:** ~80

---

### Phase 2: Create Simplified Sidebar for External Pages
**File:** `src/components/game/ExternalPageSidebar.tsx`

The current `GameSidebar` is designed for the main game's tab system. For external pages, we need a simplified version that:
- Shows the same category structure and external links
- Highlights the current external page (not a tab)
- Doesn't require `onTabChange` callback
- Links back to main game on category click

**Estimated Lines:** ~120

---

### Phase 3: Update Feature Pages (8 files)

Each page will be wrapped with `GameLayout`:

**Files to Update:**
1. `src/pages/Empire.tsx`
2. `src/pages/CatCollection.tsx`
3. `src/pages/CatRelationships.tsx`
4. `src/pages/CatCustomization.tsx`
5. `src/pages/CatPhotoBooth.tsx`
6. `src/pages/CatGallery.tsx`
7. `src/pages/Stats.tsx`
8. `src/pages/Leaderboard.tsx`

**Pattern for each page:**
```tsx
// Before
return (
  <div className="min-h-screen bg-background">
    <header>...</header>
    <main>...</main>
  </div>
);

// After
return (
  <GameLayout currentPage="/empire">
    <header>...</header>
    <main>...</main>
  </GameLayout>
);
```

**Changes per file:** ~5-15 lines

---

### Phase 4: Update Documentation (4 files)

1. **`docs/NAVIGATION_IMPROVEMENTS.md`** - Add Phase 9: Consistent Sidebar Navigation
2. **`docs/COMPONENTS.md`** - Document GameLayout and ExternalPageSidebar
3. **`docs/PAGES_AND_COMPONENTS.md`** - Update page structure descriptions
4. **`GAME_KNOWLEDGE.md`** - Update navigation architecture section

---

## Technical Details

### GameLayout Component API

```tsx
interface GameLayoutProps {
  children: React.ReactNode;
  currentPage?: string;  // e.g., '/empire', '/collection'
  showStats?: boolean;   // Show day/money in sidebar header
}
```

### ExternalPageSidebar Component API

```tsx
interface ExternalPageSidebarProps {
  currentPage?: string;  // Highlights active external link
  day?: number;
  money?: number;
}
```

### Sidebar Behavior on External Pages
- Category groups link to main game with that tab selected
- External links navigate to their respective pages
- Current page is highlighted with `bg-primary text-primary-foreground`
- Collapse/expand works identically to main game

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Layout shift during navigation | Low | Test transitions thoroughly |
| State management conflicts | Low | GameLayout is stateless wrapper |
| Mobile layout issues | Medium | Test on multiple screen sizes |
| Performance impact | Low | Sidebar is lightweight |

---

## Implementation Order

| Step | Description | Files | Est. Lines |
|------|-------------|-------|------------|
| 1 | Create layouts directory | - | - |
| 2 | Create GameLayout component | 1 new | ~80 |
| 3 | Create ExternalPageSidebar | 1 new | ~120 |
| 4 | Update Empire.tsx | 1 | ~15 |
| 5 | Update CatCollection.tsx | 1 | ~15 |
| 6 | Update CatRelationships.tsx | 1 | ~15 |
| 7 | Update CatCustomization.tsx | 1 | ~15 |
| 8 | Update CatPhotoBooth.tsx | 1 | ~15 |
| 9 | Update CatGallery.tsx | 1 | ~15 |
| 10 | Update Stats.tsx | 1 | ~15 |
| 11 | Update Leaderboard.tsx | 1 | ~15 |
| 12 | Update documentation | 4 | ~100 |
| **Total** | | **12 files** | **~420 lines** |

---

## Validation Checklist

After implementation, verify:

- [ ] Sidebar visible on Empire page
- [ ] Sidebar visible on Collection page
- [ ] Sidebar visible on Relationships page
- [ ] Sidebar visible on Customization page
- [ ] Sidebar visible on Photo Booth page
- [ ] Sidebar visible on Gallery page
- [ ] Sidebar visible on Stats page
- [ ] Sidebar visible on Leaderboard page
- [ ] Current page highlighted in sidebar
- [ ] Sidebar collapse/expand works on all pages
- [ ] Mobile layout works correctly (drawer instead of sidebar)
- [ ] Navigation between pages preserves sidebar state
- [ ] No console errors or warnings
- [ ] Documentation updated and accurate

---

## Gap Analysis Summary

### Before Implementation
| Area | Status |
|------|--------|
| Main Game sidebar | ✅ Implemented |
| Empire sidebar | ❌ Missing |
| Collection sidebar | ❌ Missing |
| Relationships sidebar | ❌ Missing |
| Customization sidebar | ❌ Missing |
| Photo Booth sidebar | ❌ Missing |
| Gallery sidebar | ❌ Missing |
| Stats sidebar | ❌ Missing |
| Leaderboard sidebar | ❌ Missing |
| Shared layout component | ❌ Not created |
| Documentation | ⚠️ Incomplete |

### After Implementation
| Area | Status |
|------|--------|
| All pages | ✅ Consistent sidebar |
| Mobile support | ✅ Drawer navigation |
| Documentation | ✅ Complete |
| Code reuse | ✅ Centralized in GameLayout |
