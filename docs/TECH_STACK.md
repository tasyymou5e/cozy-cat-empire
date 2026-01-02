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
│   ├── game/           # 35+ game components
│   ├── ui/             # 40+ shadcn/ui primitives
│   ├── stats/          # Statistics components
│   ├── ErrorBoundary.tsx
│   └── ErrorLoggerProvider.tsx
├── hooks/
│   ├── useGameState.ts      # Core game logic
│   ├── useRelationships.ts  # Cat relationships
│   ├── useSoundEffects.ts   # Audio system
│   ├── useCloudSave.ts      # Cloud persistence
│   ├── useFriends.ts        # Social features
│   └── ...                   # 15+ custom hooks
├── types/
│   ├── game.ts              # Cat, GameState
│   ├── grading.ts           # Grade system
│   ├── relationships.ts     # Relationship types
│   ├── costumes.ts          # Costume definitions
│   ├── showEvents.ts        # Show tiers
│   ├── dailyEvents.ts       # Random events
│   ├── dailyRewards.ts      # VIP rewards
│   └── challenges.ts        # Weekly challenges
├── contexts/
│   ├── AuthContext.tsx      # Authentication
│   └── SoundContext.tsx     # Sound provider
├── integrations/
│   └── supabase/
│       ├── client.ts        # Supabase client
│       └── types.ts         # Generated types
├── pages/
│   ├── Index.tsx            # Main game
│   ├── Auth.tsx             # Login/signup
│   ├── CatCollection.tsx    # Trading cards
│   ├── Leaderboard.tsx      # Global rankings
│   └── Stats.tsx            # Personal stats
└── lib/
    └── utils.ts             # Utility functions

supabase/
├── config.toml              # Supabase config
├── migrations/              # Database migrations
└── functions/
    ├── process-leaderboard-rewards/
    ├── generate-weekly-challenges/
    └── send-push-notification/
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

### React Optimizations
- `React.memo` for expensive components
- `useCallback` for stable function references
- `useMemo` for computed values
- Lazy loading for route components

### Data Fetching
- React Query for caching and deduplication
- Optimistic updates for UI responsiveness
- Background refetching for fresh data

### Bundle Optimization
- Vite code splitting
- Dynamic imports for routes
- Tree shaking for unused code

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
