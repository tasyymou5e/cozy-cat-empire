# Cat Farm - Technology Stack

## Overview
Cat Farm is built with a modern React-based frontend and Supabase backend (via Lovable Cloud), optimized for performance, developer experience, and scalability.

---

## Frontend Stack

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | - | Type safety |
| Vite | - | Build tool & dev server |

### Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | - | Utility-first CSS |
| tailwindcss-animate | 1.0.7 | Animation utilities |
| next-themes | 0.3.0 | Dark/light mode |

### UI Components
| Package | Version | Components |
|---------|---------|------------|
| shadcn/ui | - | 40+ UI primitives |
| @radix-ui/* | Various | Accessible primitives |
| lucide-react | 0.462.0 | Icon library |
| class-variance-authority | 0.7.1 | Variant styling |
| tailwind-merge | 2.6.0 | Class merging |
| clsx | 2.1.1 | Conditional classes |

### Routing
| Package | Version | Purpose |
|---------|---------|---------|
| react-router-dom | 6.30.1 | Client-side routing |

### Forms
| Package | Version | Purpose |
|---------|---------|---------|
| react-hook-form | 7.61.1 | Form management |
| @hookform/resolvers | 3.10.0 | Schema validation |
| zod | 3.25.76 | Schema validation |

### State & Data
| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-query | 5.83.0 | Server state management |
| @supabase/supabase-js | 2.89.0 | Supabase client |

### Charts & Visualization
| Package | Version | Purpose |
|---------|---------|---------|
| recharts | 2.15.4 | Data visualization |
| canvas-confetti | 1.9.4 | Celebration effects |

### Image Processing
| Package | Version | Purpose |
|---------|---------|---------|
| html-to-image | 1.11.13 | Screenshot/export photos |

### UI Utilities
| Package | Version | Purpose |
|---------|---------|---------|
| date-fns | 3.6.0 | Date formatting |
| sonner | 1.7.4 | Toast notifications |
| cmdk | 1.1.1 | Command palette |
| vaul | 0.9.9 | Drawer component |
| input-otp | 1.4.2 | OTP input |
| embla-carousel-react | 8.6.0 | Carousels |
| react-resizable-panels | 2.1.9 | Resizable layouts |
| react-day-picker | 8.10.1 | Date picker |

---

## Backend Stack (Lovable Cloud)

### Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| JSONB | Complex data storage (game state) |

### Authentication
| Technology | Purpose |
|------------|---------|
| Supabase Auth | Email/password authentication |
| JWT | Session tokens |

### Real-time
| Technology | Purpose |
|------------|---------|
| Supabase Realtime | Live notifications |
| postgres_changes | Database change events |

### Storage
| Technology | Purpose |
|------------|---------|
| Supabase Storage | File/image storage |
| photo-gallery bucket | Photo booth images |
| cat-portraits bucket | AI-generated portraits |

### Edge Functions
| Runtime | Purpose |
|---------|---------|
| Deno | Serverless functions |

---

## Audio System

### Web Audio API
Custom procedural audio system using native browser APIs:

```typescript
// Sound generation
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

// Features
- Procedural sound effects
- Dynamic music generation
- Mood-based chord progressions
- Volume controls
```

### Sound Categories
- **SFX**: click, success, error, meow, purr, hiss, coin, achievement
- **Music**: Morning, afternoon, evening, night ambiance
- **Special**: Celebration, tense mood triggers

---

## Build & Development

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    componentTagger(),  // Lovable component tracking
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

---

## File Structure

```
src/
├── components/
│   ├── game/           # 82+ game components
│   │   ├── CatFarm.tsx         # Main game orchestrator
│   │   ├── CatCard.tsx         # Cat display + inline rename
│   │   ├── CatVisual.tsx       # Unified cat visual
│   │   ├── PhotoBooth.tsx      # Photo booth interface
│   │   ├── GalleryPhotoCard.tsx
│   │   ├── PhotoLightbox.tsx
│   │   ├── DraggableSticker.tsx
│   │   ├── TutorialSystem.tsx  # 16-step tutorial
│   │   ├── WhatsNewPopup.tsx   # Changelog popup
│   │   ├── SocialCalendarPanel.tsx  # Relationship maintenance view
│   │   ├── MilestonePopup.tsx  # Milestone celebrations
│   │   ├── HallOfFamePanel.tsx # Retired cats gallery
│   │   ├── LuckyWheelPanel.tsx # Daily spin wheel
│   │   ├── BattlePassPanel.tsx # Seasonal battle pass
│   │   ├── CoopChallengesPanel.tsx # Friend challenges
│   │   ├── DailyObjectivesPanel.tsx # Daily objectives
│   │   ├── SpecializationPanel.tsx # Cat specializations
│   │   ├── CollectionProgressPanel.tsx # Collection tracking
│   │   ├── *Skeleton.tsx       # Loading skeletons
│   │   └── ...
│   ├── ui/             # 45+ UI components (shadcn/ui + custom)
│   │   ├── SeasonalParticles.tsx  # Season-based particle effects
│   │   ├── AnimatedFarmCats.tsx   # Interactive animated cats for auth page
│   │   ├── AnimatedBackground.tsx
│   │   ├── FloatingDecorations.tsx
│   │   ├── GlassCard.tsx
│   │   ├── LoadingCat.tsx
│   │   └── ...                    # 40+ shadcn/ui primitives
│   ├── stats/          # 7 statistics components
│   ├── admin/          # 7 admin dashboard components
│   ├── ErrorBoundary.tsx
│   └── ErrorLoggerProvider.tsx
├── hooks/              # 42 custom hooks
│   ├── useGameState.ts      # Core game logic + bulk actions
│   ├── useRelationships.ts  # Cat relationships + maintenance streak
│   ├── useRelationshipReminders.ts # Decay reminder toasts
│   ├── useSoundEffects.ts   # Audio system
│   ├── useCloudSave.ts      # Cloud persistence
│   ├── useFriends.ts        # Social features
│   ├── usePhotoGallery.ts   # Local + cloud gallery
│   ├── useCloudGallery.ts   # Cloud gallery operations
│   ├── useInfiniteScroll.ts # Infinite scroll utility
│   ├── useHaptics.ts        # Mobile haptic feedback
│   ├── useDailyLoginRewards.ts # Login streaks + VIP
│   ├── useWeeklyChallenges.ts  # Challenge tracking
│   ├── useLeaderboardHistory.ts # Historical rankings
│   ├── useLeaderboardRewards.ts # Reward claiming
│   ├── usePushNotifications.ts  # Web push notifications
│   ├── useChallengeAchievements.ts # Challenge linking
│   ├── usePlayerStats.ts   # Player statistics
│   ├── usePlayerActivityLog.ts # Activity logging
│   ├── useMilestones.ts    # Milestone celebrations
│   ├── useLegacy.ts        # Cat retirement system
│   ├── useCollectionProgress.ts # Collection tracking
│   ├── useSpecializations.ts # Cat specializations
│   ├── useLuckyWheel.ts    # Lucky wheel spins
│   ├── useCoopChallenges.ts # Co-op challenges
│   ├── useBattlePass.ts    # Battle pass progress
│   ├── useDailyObjectives.ts # Daily objectives
│   ├── useAdminAuth.ts     # Admin authentication
│   ├── useAdminData.ts     # Admin data queries
│   ├── useAdminActivityLog.ts # Admin activity logging
│   ├── useAdminAIData.ts   # AI usage metrics
│   └── ...
├── types/
│   ├── game.ts              # Cat, GameState
│   ├── grading.ts           # Grade system
│   ├── relationships.ts     # Relationship types
│   ├── costumes.ts          # Costume definitions
│   ├── showEvents.ts        # Show tiers
│   ├── dailyEvents.ts       # Random events
│   ├── dailyRewards.ts      # VIP rewards
│   ├── challenges.ts        # Weekly challenges
│   ├── gallery.ts           # Photo gallery types
│   ├── photoBooth.ts        # Photo booth assets
│   ├── catAppearance.ts     # Cat appearance options
│   └── changelog.ts         # Version changelog
├── contexts/
│   ├── AuthContext.tsx      # Authentication
│   ├── SoundContext.tsx     # Sound provider
│   └── CatReactionContext.tsx # Cat reactions
├── config/
│   └── graphics.ts          # Graphics configuration
├── integrations/
│   └── supabase/
│       ├── client.ts        # Supabase client
│       └── types.ts         # Generated types
├── lib/
│   ├── utils.ts             # Utility functions
│   ├── portraitUtils.ts     # Portrait utilities
│   └── seasonUtils.ts       # Season detection and seasonal prompts
├── pages/
│   ├── Index.tsx            # Main game
│   ├── Auth.tsx             # Login/signup
│   ├── CatCollection.tsx    # Trading cards
│   ├── CatPhotoBooth.tsx    # Photo booth page
│   ├── CatGallery.tsx       # Photo gallery page
│   ├── CatCustomization.tsx # Cat appearance editor
│   ├── Leaderboard.tsx      # Global rankings
│   ├── Stats.tsx            # Personal stats
│   ├── AdminAuth.tsx        # Admin login
│   └── admin/               # Admin dashboard
│       ├── AdminDashboard.tsx
│       ├── AdminUsers.tsx
│       ├── AdminStatistics.tsx
│       ├── AdminErrorLogs.tsx
│       ├── AdminModeration.tsx
│       ├── AdminAnnouncements.tsx
│       ├── AdminSettings.tsx
│       └── AdminAIMetrics.tsx
└── index.css                # Global styles

supabase/
├── config.toml              # Supabase config
├── migrations/              # Database migrations
└── functions/
    ├── process-leaderboard-rewards/
    ├── generate-weekly-challenges/
    ├── generate-cat-portrait/
    ├── generate-auth-background/  # Seasonal auth page backgrounds
    ├── send-push-notification/
    ├── send-password-reset/
    ├── cleanup-error-logs/
    └── admin-delete-user/
```

---

## Design System

### Tailwind Configuration
```typescript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        // Semantic tokens
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT, foreground },
        secondary: { DEFAULT, foreground },
        muted: { DEFAULT, foreground },
        accent: { DEFAULT, foreground },
        destructive: { DEFAULT, foreground },
      },
      keyframes: {
        shimmer: { /* VIP badge animation */ },
        "vip-glow": { /* VIP glow effect */ },
        "accordion-down": { /* UI animation */ },
        // ...
      }
    }
  }
}
```

### CSS Variables (index.css)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  /* ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

---

## Performance Optimizations

### Route-Level Code Splitting
All 24 pages are lazy-loaded using React.lazy() with Suspense boundaries:
- Main pages: Index, CatCollection, CatGallery, Stats, Leaderboard, etc.
- Admin pages: AdminDashboard, AdminUsers, AdminStatistics, etc.
- Fallback: PageLoader component with animated cat emoji

### Bundle Splitting Strategy (vite.config.ts)
| Chunk | Contents | Purpose |
|-------|----------|---------|
| vendor-react | react, react-dom, react-router-dom | Core framework |
| vendor-query | @tanstack/react-query | Data fetching |
| vendor-supabase | @supabase/supabase-js | Backend client |
| ui-radix | 23 @radix-ui components | UI primitives |
| charts | recharts | Data visualization |
| paper-avatar | paper, catVectorGenerator | Vector cat avatars |
| virtualization | react-virtuoso | List virtualization |
| date-utils | date-fns, react-day-picker | Date handling |
| forms | react-hook-form, zod | Form management |
| effects | canvas-confetti, html-to-image | Visual effects |
| icons | lucide-react | Icon library |

### Route Prefetching
- **Critical routes** (`/`, `/collection`) prefetched on app load via requestIdleCallback
- **Hover prefetching** via PrefetchLink component
- **Admin prefetching** when admin routes accessed
- Files: `src/lib/routePrefetch.ts`, `src/hooks/usePrefetch.ts`, `src/components/PrefetchLink.tsx`

### Service Worker Caching
| Request Type | Strategy | Details |
|--------------|----------|---------|
| JS/CSS chunks | Cache-first | Long-term caching for versioned assets |
| Images | Cache-first | Served from cache when available |
| HTML pages | Network-first | Fresh content, cache fallback offline |
| Supabase API | Network-only | Always fresh data |

### Component Optimizations
- **React.memo**: UnifiedCatCard (with custom arePropsEqual), VirtualizedCatGrid, LeaderboardPanel, AchievementsPanel, RelationshipDirectory
- **Debounced search**: useDebouncedSearch hook (300ms) used in CatCollection, AdminUsers, RelationshipDirectory
- **Virtual scrolling**: VirtualizedCatGrid uses react-virtuoso for 20+ cats
- **useCallback/useMemo**: Stable references and computed value memoization

### Lazy Loading
- **PaperCatAvatar**: Dynamically imports Paper.js module
- **Pages**: All routes lazy-loaded via React.lazy

### Data Fetching
- React Query for caching and deduplication
- Optimistic updates for UI responsiveness
- Background refetching for fresh data

---

## Browser Support

### Minimum Requirements
- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

### Features Used
- Web Audio API
- CSS Grid/Flexbox
- CSS Custom Properties
- ES2020 features
- localStorage
- Clipboard API
- Share API
- Vibration API (mobile)

---

## Development Tools

### Linting
```javascript
// eslint.config.js
- @eslint/js
- typescript-eslint
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
```

### IDE Support
- TypeScript strict mode
- Path aliases (@/)
- Auto-imports

---

## Deployment

### Frontend
- Vite build output
- Static hosting (Lovable)
- CDN distribution

### Backend
- Supabase Cloud (via Lovable Cloud)
- Edge Functions auto-deploy
- Database migrations managed

### Environment Variables
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
```
