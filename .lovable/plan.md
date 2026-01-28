
# Create Mobile & Tablet UI Documentation

## Summary

There is currently **no dedicated mobile/tablet documentation** in the project. The recent improvements need to be properly documented:

| Improvement | Documentation Status |
|-------------|---------------------|
| `useDeviceType()` hook with tablet breakpoint | ❌ Not documented |
| `MobileNavFAB` component | ❌ Not documented |
| Safe-area CSS utilities (pb-safe, mb-safe, etc.) | ❌ Not documented |
| Touch-target minimum sizing | ❌ Not documented |
| Responsive drawer grid with haptic feedback | ❌ Not documented |
| GameLayout tablet sidebar behavior | ❌ Not documented |

Additionally, `docs/NAVIGATION_IMPROVEMENTS.md` references **deleted components** (`MobileBottomNav.tsx`, `MobileMenuSheet.tsx`) that need to be updated.

---

## Files to Create

### 1. `docs/MOBILE_TABLET_UI.md` (New File)

Comprehensive documentation covering:

**Device Detection System:**
- Breakpoints: Mobile (<640px), Tablet (640-1023px), Desktop (≥1024px)
- `useIsMobile()` hook for simple mobile detection
- `useDeviceType()` hook for full device type discrimination

**Mobile Navigation Architecture:**
- `MobileNavBar.tsx` - Fixed bottom bar with day/money stats + menu button
- `MobileGameDrawer.tsx` - Accordion-style category navigation drawer
- `MobileNavFAB.tsx` - Floating action button for external pages

**Safe Area Support:**
- CSS utilities: `.safe-area-inset-bottom`, `.safe-area-inset-top`
- Padding utilities: `.pb-safe`, `.pt-safe`
- Margin utilities: `.mb-safe`, `.mt-safe`

**Touch Optimization:**
- `.touch-target` class (44px minimum per Apple/Google HIG)
- Haptic feedback integration via `useHaptics()`
- Active press states on buttons

**Layout Behavior by Device:**
| Device | Navigation | Sidebar | Notes |
|--------|-----------|---------|-------|
| Mobile | FAB + Drawer | Hidden | Bottom drawer for full navigation |
| Tablet | Collapsed sidebar | Icon-only by default | Expandable on click |
| Desktop | Full sidebar | Always visible | Collapsible |

**Component Reference:**
- Full props documentation for each component
- Usage examples with GameLayout wrapper

---

## Files to Update

### 2. `docs/NAVIGATION_IMPROVEMENTS.md`

**Changes needed:**
- Update Phase 3 (lines 79-107) to remove references to deleted `MobileBottomNav.tsx` and `MobileMenuSheet.tsx`
- Replace with current implementation: `MobileNavBar`, `MobileGameDrawer`, `MobileNavFAB`
- Update file list in Implementation Summary (lines 255-257)

### 3. `GAME_KNOWLEDGE.md`

Add a brief reference to the new mobile documentation:
- Mention `useDeviceType()` hook in the hooks section
- Reference `docs/MOBILE_TABLET_UI.md` for detailed mobile docs

### 4. `docs/README.md`

Add link to new mobile/tablet documentation in the documentation index.

---

## Documentation Structure for `MOBILE_TABLET_UI.md`

```markdown
# Mobile & Tablet UI System

## Overview
## Device Detection
  - Breakpoints
  - useIsMobile Hook
  - useDeviceType Hook
## Mobile Navigation Components
  - MobileNavBar
  - MobileGameDrawer
  - MobileNavFAB
## Layout System
  - GameLayout Wrapper
  - Device-Specific Behavior
## CSS Utilities
  - Safe Area Insets
  - Touch Target Sizing
## Haptic Feedback
## Best Practices
## Component API Reference
```

---

## Technical Details to Document

### Breakpoint Constants
```typescript
MOBILE_BREAKPOINT = 640   // Phones (< 640px)
TABLET_BREAKPOINT = 1024  // Tablets (640px - 1023px)
```

### CSS Utilities
```css
/* Safe areas for notched devices */
.safe-area-inset-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
.pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px)); }
.mb-safe { margin-bottom: env(safe-area-inset-bottom, 0px); }

/* Touch targets (44px min) */
@media (pointer: coarse) {
  .touch-target { min-height: 44px; min-width: 44px; }
}
```

### GameLayout Device Behavior
```typescript
<SidebarProvider defaultOpen={!isMobile && !isTablet}>
  {/* Desktop: sidebar open, Tablet: collapsed, Mobile: hidden */}
</SidebarProvider>
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `docs/MOBILE_TABLET_UI.md` | **Create** | New comprehensive mobile/tablet documentation |
| `docs/NAVIGATION_IMPROVEMENTS.md` | Update | Fix references to deleted components |
| `docs/README.md` | Update | Add link to new mobile docs |
| `GAME_KNOWLEDGE.md` | Update | Add hook reference and doc link |
