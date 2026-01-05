# Cat Relationships Page - Implementation Guide

## Overview

Dedicated page at `/relationships` providing an expanded, detailed view of cat relationships with full-screen visualizations, comprehensive filtering, and rich interaction capabilities.

---

## Page Structure

### Header Section
- Back to Farm button
- Page title with relationship emoji (💗)
- Quick stats badges (total friends, best friends, rivals, enemies)
- Settings dropdown (sound toggle, theme toggle)

---

## Four Main Sections (Tabs)

### 1. Full-Screen Network Graph
- Larger interactive force-directed graph (fills available space)
- Enhanced hover tooltips with cat portraits
- Click to select cat and highlight all connections
- Pan and zoom controls
- Color legend with counts
- Toggle to show/hide neutral relationships

### 2. Relationship Directory
- Grid/list of all relationship pairs
- Each entry shows both cats with CatVisual components
- Relationship score bar (color-coded -100 to +100)
- Filter by: All, Friends, Best Friends, Rivals, Enemies
- Sort by: Score (high/low), Recent interaction, Cat name
- Search by cat name
- Click to expand details (last interaction, shared events)

### 3. Cat Social Profiles
- Select any cat to see their "social profile"
- Shows: Number of friends, enemies, best friend
- Lists all relationships with thumbnails
- Happiness modifier from relationships
- Breeding compatibility indicators
- "Most compatible" and "Least compatible" cats

### 4. Social Groups & History
- Larger group cards with all member avatars
- Group type badges (Friendly, Outcasts, Rivals)
- Expanded event history with date filtering
- Event timeline visualization
- Event type icons (positive/negative/neutral)

---

## Component Architecture

```
src/pages/CatRelationships.tsx
├── Header (back button, title, stats, settings)
├── Tabs
│   ├── "Network" - FullScreenNetworkGraph
│   ├── "Directory" - RelationshipDirectory
│   ├── "Profiles" - CatSocialProfiles
│   └── "Groups" - GroupsAndHistory
└── CatDetailModal (when clicking a cat)
```

---

## New Components

### FullScreenNetworkGraph.tsx
`src/components/game/FullScreenNetworkGraph.tsx`

Enhanced version of RelationshipNetworkGraph for full-page view.

**Enhancements:**
- Dynamic sizing based on container
- Larger node sizes with visible cat portraits
- Smooth pan and zoom (using CSS transform)
- Click-to-select with detailed tooltip panel
- Better physics with configurable parameters
- Export as image option

### RelationshipDirectory.tsx
`src/components/game/RelationshipDirectory.tsx`

Grid view of all relationship pairs.

**Features:**
- Card for each relationship pair
- Both cat avatars displayed side-by-side
- Visual score bar (-100 to +100)
- Relationship emoji and level text
- Click to see history between pair
- Filter and sort controls

### CatSocialProfile.tsx
`src/components/game/CatSocialProfile.tsx`

Detailed social view for a single cat.

**Features:**
- Selected cat's avatar (large)
- Relationship breakdown pie chart
- List of all connected cats with scores
- Happiness modifier calculation shown
- Best friend highlight
- Worst enemy highlight

---

## Route Configuration

**In `src/App.tsx`:**
```tsx
import CatRelationships from "./pages/CatRelationships";
// ...
<Route path="/relationships" element={<CatRelationships />} />
```

---

## Navigation Links

Add link in:
1. `CatFarm.tsx` header - Settings dropdown
2. `CatCollection.tsx` header - Settings dropdown
3. `RelationshipPanel.tsx` - "View Full Page" button

---

## Data Flow

```
CatRelationships.tsx
├── useGameState() → cats, catCostumes
├── useCloudSave() → load/save state
├── useAuth() → user session
└── useRelationships() → relationships, events, groups
```

---

## Layout Design

### Desktop (Tabs)
```
┌─────────────────────────────────────────────────────┐
│ ← Back   💗 Cat Relationships    [stats]  [settings]│
├─────────────────────────────────────────────────────┤
│ [Network] [Directory] [Profiles] [Groups & History] │
├─────────────────────────────────────────────────────┤
│                                                     │
│                 [Selected Tab Content]              │
│                                                     │
│            (Full height scrollable area)            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Mobile (Compact Tabs)
```
┌─────────────────────┐
│ ← Back  💗 Relations│
├─────────────────────┤
│ [Net] [Dir] [Pro]...│
├─────────────────────┤
│                     │
│  [Tab Content]      │
│                     │
└─────────────────────┘
```

---

## Key Visual Improvements

| Feature | Current Panel | New Page |
|---------|---------------|----------|
| Network graph | 280x240 fixed | Full-screen responsive |
| Relationship list | Text only | Cat avatars with portraits |
| Groups | Small badges | Large cards with all members |
| History | Last 20 events | Full timeline with filters |
| Cat profiles | None | Dedicated social profile view |
| Interactivity | Hover only | Click, select, filter, search |

---

## Files Summary

### Files to Modify
| File | Changes |
|------|---------|
| `src/App.tsx` | Add route for `/relationships` |
| `src/components/game/CatFarm.tsx` | Add nav link in settings dropdown |
| `src/pages/CatCollection.tsx` | Add nav link in settings dropdown |
| `src/components/game/RelationshipPanel.tsx` | Add "View Full Page" link |

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/CatRelationships.tsx` | Main page component |
| `src/components/game/FullScreenNetworkGraph.tsx` | Enhanced network visualization |
| `src/components/game/RelationshipDirectory.tsx` | Relationship pair grid |
| `src/components/game/CatSocialProfile.tsx` | Single cat social view |

---

## Implementation Phases

1. **Phase 1:** Create basic page with existing components scaled up
2. **Phase 2:** Add enhanced network graph with full interactivity
3. **Phase 3:** Add relationship directory with filtering
4. **Phase 4:** Add cat social profiles and group management

---

## Related Files

- `src/types/relationships.ts` - Relationship types and utilities
- `src/hooks/useRelationships.ts` - Relationship state management
- `src/components/game/RelationshipPanel.tsx` - Existing panel component
- `src/components/game/RelationshipNetworkGraph.tsx` - Existing network graph
