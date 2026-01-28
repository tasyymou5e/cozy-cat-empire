# Mobile & Tablet UI System

## Overview

Cat Farm uses a responsive, device-aware architecture that provides optimized experiences for phones, tablets, and desktops. The system features:

- **Device-specific navigation patterns** (FAB + drawer on mobile, collapsed sidebar on tablet, full sidebar on desktop)
- **Safe area support** for notched devices (iPhone X+, etc.)
- **Touch-optimized sizing** following Apple/Google Human Interface Guidelines (44px minimum)
- **Haptic feedback** for tactile button responses on supported devices

---

## Device Detection

### Breakpoints

| Device Type | Width Range | Constant |
|-------------|-------------|----------|
| Mobile | < 640px | `MOBILE_BREAKPOINT` |
| Tablet | 640px - 1023px | `TABLET_BREAKPOINT` |
| Desktop | ≥ 1024px | - |

**File:** `src/hooks/use-mobile.tsx`

```typescript
const MOBILE_BREAKPOINT = 640;   // Phones
const TABLET_BREAKPOINT = 1024;  // Tablets
```

### useIsMobile Hook

Simple boolean check for mobile devices.

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

function MyComponent() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### useDeviceType Hook

Full device type discrimination for granular control.

```typescript
import { useDeviceType } from '@/hooks/use-mobile';

function MyComponent() {
  const { deviceType, isMobile, isTablet, isDesktop } = useDeviceType();
  
  // Show collapsed sidebar on tablets, full drawer on mobile
  if (isTablet) return <CollapsedSidebar />;
  if (isMobile) return <BottomDrawer />;
  return <FullSidebar />;
}
```

**Return Value:**
```typescript
{
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isMobile: boolean;   // deviceType === 'mobile'
  isTablet: boolean;   // deviceType === 'tablet'
  isDesktop: boolean;  // deviceType === 'desktop'
}
```

---

## Mobile Navigation Components

### MobileNavBar

**File:** `src/components/game/MobileNavBar.tsx`

Fixed bottom bar displaying game stats with a menu button.

**Features:**
- Shows current day and money
- Menu button opens `MobileGameDrawer`
- Safe area padding for notched devices
- Touch-optimized button sizing
- Haptic feedback on button press

**Props:**
```typescript
interface MobileNavBarProps {
  day: number;
  money: number;
  onOpenMenu: () => void;
}
```

**Visual Layout:**
```
┌────────────────────────────────────────┐
│  📅 Day 15        $1,234    [☰ Menu]   │
└────────────────────────────────────────┘
```

### MobileGameDrawer

**File:** `src/components/game/MobileGameDrawer.tsx`

Bottom drawer with accordion-style category navigation.

**Features:**
- Swipe-to-dismiss gesture (via Vaul drawer)
- Accordion categories matching desktop sidebar
- Responsive grid (2 columns on small phones, 3 on larger)
- Haptic feedback on all buttons
- Badge indicators for notifications
- Quick access to external pages

**Props:**
```typescript
interface MobileGameDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges: Record<string, number>;
  day?: number;
  money?: number;
}
```

**Category Structure:**
| Category | Icon | Tabs |
|----------|------|------|
| Farm | 🏠 | Actions, Supplies, Market, Bulk Actions |
| Cats | 🐱 | Breeding, Training, Costumes, Specializations |
| Social | 👥 | Social, Friends, Gifts, Trading, Coop |
| Progress | 📈 | Leaderboard, Challenges, Objectives, Battle Pass |
| Settings | ⚙️ | Achievements, Graphics, Save/Load, Profile |

### MobileNavFAB

**File:** `src/components/game/MobileNavFAB.tsx`

Floating action button for external pages (Empire, Stats, Collection, etc.).

**Features:**
- Fixed position (bottom-right with safe area offset)
- Only visible on mobile devices (`md:hidden`)
- Touch-friendly sizing (56px diameter)
- Haptic feedback on press
- Active press state animation

**Props:**
```typescript
interface MobileNavFABProps {
  onOpenMenu: () => void;
}
```

**Usage:**
```tsx
import { MobileNavFAB } from '@/components/game/MobileNavFAB';

// In external page
{isMobile && (
  <MobileNavFAB onOpenMenu={() => setDrawerOpen(true)} />
)}
```

---

## Layout System

### GameLayout Wrapper

**File:** `src/components/layouts/GameLayout.tsx`

Shared layout wrapper providing consistent navigation across all game pages.

**Features:**
- Automatic device detection
- Sidebar for tablet/desktop
- FAB + drawer for mobile
- Day/money stats display

**Props:**
```typescript
interface GameLayoutProps {
  children: ReactNode;
  currentPage?: string;  // Override for sidebar highlighting
  day?: number;          // For sidebar stats
  money?: number;        // For sidebar stats
}
```

**Usage:**
```tsx
import { GameLayout } from '@/components/layouts/GameLayout';

function EmpirePage() {
  return (
    <GameLayout currentPage="/empire" day={state.day} money={state.money}>
      <main>...</main>
    </GameLayout>
  );
}
```

### Device-Specific Behavior

| Device | Navigation | Sidebar | Notes |
|--------|-----------|---------|-------|
| Mobile | FAB + Drawer | Hidden | Bottom drawer for full navigation |
| Tablet | Collapsed sidebar | Icon-only by default | Expandable on click |
| Desktop | Full sidebar | Always visible | Collapsible |

**Implementation:**
```typescript
// In GameLayout.tsx
<SidebarProvider defaultOpen={!isMobile && !isTablet}>
  {!isMobile && <ExternalPageSidebar />}
  <SidebarInset>{children}</SidebarInset>
  {isMobile && (
    <>
      <MobileNavFAB onOpenMenu={() => setDrawerOpen(true)} />
      <MobileGameDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )}
</SidebarProvider>
```

---

## CSS Utilities

### Safe Area Insets

**File:** `src/index.css`

Utilities for handling notched devices (iPhone X+, Android devices with notches/punch-holes).

```css
/* Padding utilities */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.safe-area-inset-top {
  padding-top: env(safe-area-inset-top, 0px);
}

.pb-safe {
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
}

.pt-safe {
  padding-top: max(1rem, env(safe-area-inset-top, 0px));
}

/* Margin utilities */
.mb-safe {
  margin-bottom: env(safe-area-inset-bottom, 0px);
}

.mt-safe {
  margin-top: env(safe-area-inset-top, 0px);
}
```

**Usage:**
```tsx
// Fixed bottom bar with safe area
<nav className="fixed bottom-0 left-0 right-0 pb-safe bg-background">
  ...
</nav>
```

### Touch Target Sizing

Minimum tap target size following Apple/Google HIG (44px minimum).

```css
/* Applied on touch devices */
@media (pointer: coarse) {
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
}
```

**Usage:**
```tsx
<button className="touch-target flex items-center justify-center">
  <Menu className="h-5 w-5" />
</button>
```

---

## Haptic Feedback

**File:** `src/hooks/useHaptics.ts`

Provides tactile feedback on supported devices (iOS Safari, Android Chrome with Vibration API).

**Usage in Mobile Components:**
```typescript
import { useHaptics } from '@/hooks/useHaptics';

function MobileButton({ onClick }) {
  const { trigger } = useHaptics();
  
  const handleClick = () => {
    trigger('light');  // Options: 'light' | 'medium' | 'heavy'
    onClick();
  };
  
  return <button onClick={handleClick}>Press Me</button>;
}
```

**Integration Points:**
- `MobileNavBar` - Menu button press
- `MobileGameDrawer` - All navigation buttons
- `MobileNavFAB` - FAB press

---

## Best Practices

### 1. Use Device Hooks Appropriately

```typescript
// ✅ Good: Use useIsMobile for simple mobile checks
const isMobile = useIsMobile();
if (isMobile) return <MobileView />;

// ✅ Good: Use useDeviceType when tablet needs different behavior
const { isMobile, isTablet } = useDeviceType();
if (isMobile) return <MobileView />;
if (isTablet) return <TabletView />;
return <DesktopView />;

// ❌ Bad: Using useDeviceType when only mobile/desktop distinction needed
const { isMobile } = useDeviceType(); // Unnecessary overhead
```

### 2. Always Apply Safe Areas on Fixed Elements

```tsx
// ✅ Good: Fixed bottom element with safe area
<div className="fixed bottom-0 pb-safe">...</div>

// ❌ Bad: Fixed element without safe area (content hidden behind home indicator)
<div className="fixed bottom-0">...</div>
```

### 3. Touch Targets for Interactive Elements

```tsx
// ✅ Good: Touch-friendly button
<button className="touch-target p-2">
  <Icon className="h-5 w-5" />
</button>

// ❌ Bad: Tiny tap target
<button className="p-1">
  <Icon className="h-4 w-4" />
</button>
```

### 4. Responsive Grids in Mobile Components

```tsx
// ✅ Good: Responsive grid that adapts to screen width
<div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
  {items.map(item => <ItemCard key={item.id} />)}
</div>

// ❌ Bad: Fixed columns that may be too cramped on small phones
<div className="grid grid-cols-4 gap-2">
  {items.map(item => <ItemCard key={item.id} />)}
</div>
```

---

## Component API Reference

### MobileNavBar

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `day` | `number` | Yes | Current game day |
| `money` | `number` | Yes | Current player money |
| `onOpenMenu` | `() => void` | Yes | Handler to open drawer |

### MobileGameDrawer

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | Yes | Drawer open state |
| `onOpenChange` | `(open: boolean) => void` | Yes | State change handler |
| `activeTab` | `string` | Yes | Currently selected tab |
| `onTabChange` | `(tab: string) => void` | Yes | Tab selection handler |
| `badges` | `Record<string, number>` | Yes | Badge counts per tab |
| `day` | `number` | No | Current game day |
| `money` | `number` | No | Current player money |

### MobileNavFAB

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onOpenMenu` | `() => void` | Yes | Handler to open menu |

### GameLayout

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | Yes | Page content |
| `currentPage` | `string` | No | Path for sidebar highlighting |
| `day` | `number` | No | Current game day (default: 1) |
| `money` | `number` | No | Current player money (default: 0) |

---

## File Structure

```
src/
├── hooks/
│   ├── use-mobile.tsx          # Device detection hooks
│   └── useHaptics.ts           # Haptic feedback
├── components/
│   ├── layouts/
│   │   └── GameLayout.tsx      # Shared layout wrapper
│   └── game/
│       ├── MobileNavBar.tsx    # Bottom stat bar
│       ├── MobileGameDrawer.tsx # Navigation drawer
│       └── MobileNavFAB.tsx    # Floating action button
└── index.css                   # Safe area & touch utilities
```

---

## Related Documentation

- [Navigation Improvements](./NAVIGATION_IMPROVEMENTS.md) - Full navigation system
- [Components](./COMPONENTS.md) - All component documentation
- [Graphics Settings](./GRAPHICS_SETTINGS.md) - Performance options for mobile
