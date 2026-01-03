# Cat Farm - Cat Visuals & Gallery System

## Overview

This document covers all components related to cat visual display, portraits, photo booth, gallery, and trading cards. These components form the visual identity system for cats in the game.

---

## Edge Functions

### generate-cat-portrait (Supabase Edge Function)

**Location:** `supabase/functions/generate-cat-portrait/index.ts`

**Purpose:** Generates AI-powered cat portraits using Lovable AI's image generation.

**Request Payload:**
```typescript
{
  cat: {
    id: string;
    name: string;
    breed: string;
    personality: string;
    appearance?: {
      furColor?: string;
      pattern?: string;
      eyeColor?: string;
      hairLength?: string;
      facialFeature?: string;
    };
    costume?: {
      id: string;
      name: string;
      emoji: string;
      category: string;
    };
  }
}
```

**Response:**
```typescript
{
  portraitUrl: string;  // Public URL to stored image
  catId: string;
}
```

**Features:**
- Builds detailed prompts from cat appearance data
- Maps personality to expression (lazy → sleepy, playful → excited, etc.)
- Includes costume descriptions in prompt
- Uploads generated image to `cat-portraits` storage bucket
- Logs AI usage to `ai_usage_log` table
- Handles rate limits and credit depletion gracefully

**Prompt Building:**
- Breed-specific names (stray → domestic shorthair, persian → Persian, etc.)
- Personality expressions (lazy → sleepy, playful → excited, affectionate → warm)
- Fur color, pattern, eye color, hair length
- Facial features (scar, eyepatch, grumpy, cute_blush)
- Costume overlays (16+ costume descriptions)

---

## Pages

### CatCollection (`/collection`)

**Location:** `src/pages/CatCollection.tsx`

**Purpose:** Trading card collection view for all player's cats.

**Features:**
- Grid display of FlippableTradingCard components
- Search by cat name
- Sort by grade, name, value, age, health, show wins
- Filter by breed and tier
- Stats summary (total cats, average grade, total wins, total value)
- CatDetailModal for detailed cat view
- Cloud save integration
- Settings dropdown (sound, theme, navigation)

**Key Props/State:**
- `search`, `sortBy`, `sortDesc`, `filterBreed`, `filterTier`
- Integrates `useGameState`, `useCloudSave`, `useRelationships`

---

### CatCustomization (`/customize/:catId?`)

**Location:** `src/pages/CatCustomization.tsx`

**Purpose:** Full-page cat appearance editor.

**Features:**
- Cat selector dropdown
- Live preview with CatAvatar (multiple sizes)
- 5-tab editor: Fur, Eyes, Hair, Face, Costume
- Fur color picker (8 colors)
- Pattern selector (6 patterns + pattern color)
- Eye color selector (6 options including heterochromia)
- Hair length selector (short, medium, fluffy)
- Facial features (normal, scar, eyepatch, grumpy, cute_blush)
- Costume equip from owned costumes
- Randomize and Reset buttons
- Save to cloud functionality

**Editor Tabs:**
1. **Fur** - Color grid + pattern cards + pattern color
2. **Eyes** - Eye color with preview circles
3. **Hair** - Hair length with emoji indicators
4. **Face** - Facial feature selection
5. **Costume** - Owned costume grid with equip

---

### CatGallery (`/gallery`)

**Location:** `src/pages/CatGallery.tsx`

**Purpose:** Photo gallery for viewing saved photo booth pictures.

**Features:**
- Filter by favorites or all photos
- Filter by cat name
- Sort by newest, oldest, or name
- Cloud sync status indicator
- Manual sync button
- Clear all with confirmation
- PhotoLightbox for full-screen view
- GalleryPhotoCard grid display

**State Management:**
- Uses `usePhotoGallery` hook for storage
- Local + cloud sync via `useCloudGallery`

---

### CatPhotoBooth (`/photobooth/:catId?`)

**Location:** `src/pages/CatPhotoBooth.tsx`

**Purpose:** Photo booth page wrapper with cat selection.

**Features:**
- Cat selector dropdown in header
- Links to gallery
- Loads game state from cloud or local storage
- Renders PhotoBooth component with selected cat

---

## Hooks

### usePhotoGallery

**Location:** `src/hooks/usePhotoGallery.ts`

**Purpose:** Manages photo gallery with local and cloud storage.

**Parameters:**
- `userId?: string | null` - User ID for cloud sync

**Returns:**
```typescript
{
  photos: GalleryPhoto[];
  savePhoto: (photo) => Promise<{ success, error?, photo? }>;
  deletePhoto: (photoId) => Promise<void>;
  toggleFavorite: (photoId) => Promise<void>;
  clearGallery: () => Promise<void>;
  isFull: boolean;
  photoCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncNow: () => Promise<void>;
  isCloudEnabled: boolean;
  isLoading: boolean;
}
```

**Features:**
- localStorage with `cat-farm-gallery` key
- Max 50 photos
- Auto-sync on mount if authenticated
- Sync statuses: `local`, `syncing`, `synced`, `error`
- Cloud photos take precedence on merge

---

### useCloudGallery

**Location:** `src/hooks/useCloudGallery.ts`

**Purpose:** Low-level cloud storage operations for gallery photos.

**Returns:**
```typescript
{
  uploadPhoto: (photoId, dataUrl) => Promise<{ path, url } | null>;
  downloadPhoto: (path) => Promise<string | null>;
  savePhotoMetadata: (photo) => Promise<{ id } | null>;
  loadCloudPhotos: () => Promise<CloudGalleryPhoto[]>;
  updatePhotoMetadata: (id, updates) => Promise<boolean>;
  deleteCloudPhoto: (id, imagePath) => Promise<boolean>;
  cloudPhotoToLocal: (cloudPhoto, imageDataUrl) => GalleryPhoto;
}
```

---

## Core Display Components

### CatAvatar

**Location:** `src/components/game/CatAvatar.tsx`

**Purpose:** Renders customizable cat face avatar with appearance system.

**Props:**
```typescript
interface CatAvatarProps {
  cat: Cat;
  equippedCostumeId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showCostume?: boolean;
  animated?: boolean;
  className?: string;
}
```

**Size Classes:**
- `xs`: 32px, `sm`: 48px, `md`: 64px, `lg`: 96px, `xl`: 128px

**Features:**
- SVG-based fur texture filter
- Pattern overlays (tabby, spotted, tuxedo, bicolor, calico)
- Eye rendering with reflections and heterochromia support
- Animated features (breathing, blinking, ear twitches, whisker wiggle)
- Tier-based animations (ultraRare bounces, veryRare pulses)
- Costume overlays positioned by category
- Facial features (scar, eyepatch, grumpy, cute_blush)

**Animations:**
- `animate-cat-breathe` - Subtle breathing effect
- `animate-cat-blink` - Eye blink animation
- `animate-ear-twitch-left/right` - Ear movements
- `animate-whisker-wiggle` - Whisker animation
- `animate-eye-shimmer` - Eye reflection sparkle

---

### CatCard

**Location:** `src/components/game/CatCard.tsx`

**Purpose:** Individual cat display card with stats and actions.

**Props:**
```typescript
interface CatCardProps {
  cat: Cat;
  onSell: (id: string) => void;
  onHeal: (id: string) => void;
  onComfort?: (id: string) => void;
  onRename?: (catId: string, newName: string) => void;
  compact?: boolean;
  relationships?: CatRelationship[];
  allCats?: Cat[];
  equippedCostumeId?: string;
  reaction?: CatReaction;
}
```

**Features:**
- CatAvatar display
- Health, happiness, hunger progress bars
- Grade badge with tier styling
- Relationship badges (friends/enemies count)
- Trick count badge
- Inline rename with random name generator
- Comfort button for upset cats
- Heal and Sell action buttons
- Tier-specific visual effects (sparkles, shimmer)

**Name Generator:**
- Breed-specific names (8 breeds × ~10 names each)
- Personality-based names (6 personalities × ~10 names each)
- Universal fallback names (~18 names)

---

### CatPortrait

**Location:** `src/components/game/CatPortrait.tsx`

**Purpose:** AI-generated portrait display with generation controls.

**Props:**
```typescript
interface CatPortraitProps {
  cat: Cat;
  equippedCostumeId?: string;
  onPortraitGenerated?: (catId: string, portraitUrl: string) => void;
}
```

**States:** `idle`, `generating`, `complete`, `error`

**Features:**
- Falls back to CatAvatar if no portrait
- Generate/Regenerate buttons
- Tier-based border styling
- Grade and star overlay on portrait
- Loading spinner during generation
- Error display with retry option
- Ultra rare sparkle effects

---

### GradeBadge

**Location:** `src/components/game/GradeBadge.tsx`

**Purpose:** Visual grade tier indicator badge.

**Props:**
```typescript
interface GradeBadgeProps {
  grade: number;      // 1-20
  showStars?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Tiers:**
| Tier | Grade Range | Colors |
|------|-------------|--------|
| common | 1-4 | Gray |
| uncommon | 5-8 | Blue |
| rare | 9-12 | Purple, glow pulse |
| veryRare | 13-16 | Yellow/gold, glow |
| ultraRare | 17-20 | Rainbow gradient, animated |

---

## Trading Card Components

### TradingCard

**Location:** `src/components/game/TradingCard.tsx`

**Purpose:** Static trading card display for cat collection.

**Props:**
```typescript
interface TradingCardProps {
  cat: Cat;
  relationships: CatRelationship[];
  allCats: Cat[];
  onClick: () => void;
  equippedCostumeId?: string;
}
```

**Features:**
- Tier-specific borders and backgrounds
- CatAvatar with tier animations
- Stats bars (HP, Joy, Full, Rest)
- Trick badges
- Relationship counters
- Best friend display
- Value display

---

### FlippableTradingCard

**Location:** `src/components/game/FlippableTradingCard.tsx`

**Purpose:** Interactive trading card with flip animation.

**Props:** Same as TradingCard

**Features:**
- 3D flip animation on click
- Front: Avatar, stats, grade
- Back: Detailed stats (age, grade, hunger, rest, tricks, social)
- Sound effect on flip
- Tier-specific glow animations

**Animations:**
- `animate-purple-glow` - Rare tier
- `animate-golden-glow` - Very rare tier
- `animate-rainbow-glow` - Ultra rare tier

---

## Photo Booth Components

### PhotoBooth

**Location:** `src/components/game/PhotoBooth.tsx`

**Purpose:** Interactive photo creation interface.

**Props:**
```typescript
interface PhotoBoothProps {
  cat: Cat;
  equippedCostumeId?: string;
}
```

**Features:**
- Background selection (16 options, 5 categories)
- Pose selection (7 poses)
- Frame selection (7 frames)
- Sticker placement (24 stickers, 5 categories)
- Export to: Download, Clipboard, Share, Gallery
- Cloud sync status indicator
- Reset all button

**Export Methods:**
- `toPng()` from html-to-image for download
- `toBlob()` for clipboard and share
- Gallery save via `usePhotoGallery`

**Categories:**
- Backgrounds: nature, fantasy, seasonal, solid
- Stickers: hearts, stars, text, animals, effects

---

### DraggableSticker

**Location:** `src/components/game/DraggableSticker.tsx`

**Purpose:** Draggable sticker element for photo booth.

**Props:**
```typescript
interface DraggableStickerProps {
  sticker: PlacedSticker;
  containerRef: React.RefObject<HTMLDivElement>;
  onUpdate: (id: string, updates: Partial<PlacedSticker>) => void;
  onRemove: (id: string) => void;
  isExporting?: boolean;
}
```

**Features:**
- Mouse and touch drag support
- Position as percentage of container
- Delete button on hover (hidden during export)
- Scale and rotation support

---

### GalleryPhotoCard

**Location:** `src/components/game/GalleryPhotoCard.tsx`

**Purpose:** Photo thumbnail card for gallery grid.

**Props:**
```typescript
interface GalleryPhotoCardProps {
  photo: GalleryPhoto;
  onView: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onDownload: () => void;
}
```

**Features:**
- Aspect-square thumbnail
- Favorite heart indicator
- Cloud sync status icon
- Cat name and date info bar
- Hover overlay with action buttons

**Sync Status Icons:**
- `synced` → Green cloud
- `syncing` → Blue spinning loader
- `error` → Red alert
- `local` → Gray cloud-off

---

### PhotoLightbox

**Location:** `src/components/game/PhotoLightbox.tsx`

**Purpose:** Full-screen photo viewer modal.

**Props:**
```typescript
interface PhotoLightboxProps {
  photo: GalleryPhoto | null;
  photos: GalleryPhoto[];
  open: boolean;
  onClose: () => void;
  onNavigate: (photoId: string) => void;
  onToggleFavorite: (photoId: string) => void;
  onDelete: (photoId: string) => void;
}
```

**Features:**
- Keyboard navigation (arrows, escape)
- Previous/Next arrows
- Favorite, Download, Share, Delete actions
- Cat name and timestamp display

---

## Costume System

### CostumeShopPanel

**Location:** `src/components/game/CostumeShopPanel.tsx`

**Purpose:** Costume shop and equip interface.

**Props:**
```typescript
interface CostumeShopPanelProps {
  cats: Cat[];
  money: number;
  ownedCostumes: string[];
  catCostumes: Record<string, string>;
  onBuyCostume: (costumeId: string) => void;
  onEquipCostume: (catId: string, costumeId: string | null) => void;
}
```

**Tabs:**
1. **Shop** - Browse and buy costumes by category
2. **Equip** - Select cat and assign costume

**Categories:** hat, outfit, accessory, special

**Features:**
- Rarity badges (common → legendary)
- VIP exclusive costumes (streak locked)
- Show bonus and happiness bonus display
- Owned status indicator
- Equip dialog with costume list

---

## UI Primitives

### Card (shadcn/ui)

**Location:** `src/components/ui/card.tsx`

**Components:**
- `Card` - Container with border and shadow
- `CardHeader` - Header section with padding
- `CardTitle` - H3 heading
- `CardDescription` - Muted paragraph
- `CardContent` - Main content area
- `CardFooter` - Footer with flex layout

---

### Avatar (shadcn/ui)

**Location:** `src/components/ui/avatar.tsx`

**Components:**
- `Avatar` - Circular container
- `AvatarImage` - Image with object-fit
- `AvatarFallback` - Fallback content

---

### HoverCard (shadcn/ui)

**Location:** `src/components/ui/hover-card.tsx`

**Components:**
- `HoverCard` - Root container
- `HoverCardTrigger` - Trigger element
- `HoverCardContent` - Popup content with animations

---

## Type Definitions

### GalleryPhoto

```typescript
interface GalleryPhoto {
  id: string;
  cloudId?: string;
  catId: string;
  catName: string;
  imageDataUrl: string;
  imageUrl?: string;
  imagePath?: string;
  backgroundId: string;
  poseId: string;
  frameId: string;
  stickerCount: number;
  createdAt: string;
  isFavorite: boolean;
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
}
```

### PlacedSticker

```typescript
interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number;      // Percentage position
  y: number;
  scale: number;
  rotation: number;
}
```

### CatAppearance

```typescript
interface CatAppearance {
  furColor: FurColor;
  pattern: FurPattern;
  patternColor?: string;
  eyeColor: EyeColor;
  hairLength: HairLength;
  facialFeature?: FacialFeature;
}
```

---

## Storage

### Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `photo-gallery` | Photo booth images | Yes |
| `cat-portraits` | AI-generated portraits | Yes |

### localStorage Keys

| Key | Purpose |
|-----|---------|
| `cat-farm-gallery` | Local photo gallery |
| `cat-farm-save` | Game save data |

---

## Database Tables

### gallery_photos

```sql
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  cat_id TEXT NOT NULL,
  cat_name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  background_id TEXT NOT NULL,
  pose_id TEXT NOT NULL,
  frame_id TEXT NOT NULL,
  sticker_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### ai_usage_log

```sql
CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  function_name TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## File Structure

```
src/
├── pages/
│   ├── CatCollection.tsx      # Trading card collection
│   ├── CatCustomization.tsx   # Appearance editor
│   ├── CatGallery.tsx         # Photo gallery
│   └── CatPhotoBooth.tsx      # Photo booth wrapper
├── hooks/
│   ├── usePhotoGallery.ts     # Gallery state management
│   └── useCloudGallery.ts     # Cloud storage operations
├── components/
│   ├── game/
│   │   ├── CatAvatar.tsx      # Cat face avatar
│   │   ├── CatCard.tsx        # Cat info card
│   │   ├── CatPortrait.tsx    # AI portrait display
│   │   ├── GradeBadge.tsx     # Grade tier badge
│   │   ├── TradingCard.tsx    # Static trading card
│   │   ├── FlippableTradingCard.tsx  # Flippable card
│   │   ├── PhotoBooth.tsx     # Photo creation
│   │   ├── DraggableSticker.tsx      # Sticker element
│   │   ├── GalleryPhotoCard.tsx      # Gallery thumbnail
│   │   ├── PhotoLightbox.tsx  # Full-screen viewer
│   │   └── CostumeShopPanel.tsx      # Costume shop
│   └── ui/
│       ├── card.tsx           # Card primitives
│       ├── avatar.tsx         # Avatar primitives
│       └── hover-card.tsx     # Hover card primitives
├── types/
│   ├── gallery.ts             # Gallery types
│   ├── photoBooth.ts          # Photo booth assets
│   └── catAppearance.ts       # Appearance types
└── supabase/functions/
    └── generate-cat-portrait/ # AI portrait generation
```

---

## Best Practices

### Performance
- Use `size` prop appropriately for CatAvatar
- Disable animations when not needed
- Lazy load gallery photos
- Compress images before cloud upload

### Accessibility
- Include alt text on all images
- Keyboard navigation in lightbox
- Touch support for mobile drag

### Styling
- Use tier-specific effects consistently
- Follow design system colors
- Maintain responsive layouts
