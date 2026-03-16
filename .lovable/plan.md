

## Apply Showcase Card Styling Site-Wide

The cozy card enhancements (hover lift, glassmorphism, rounded corners, warm gradients, Playfair Display headings, fade-in animations) currently only appear on `/card-showcase`. Here's the plan to propagate them across the main site.

### Changes

**1. Global CSS (`src/index.css`)**
- Add a `.page-heading` utility class using Playfair Display for consistent heading typography across all pages
- Add a `.cozy-page-bg` utility class with the warm beige-to-coral gradient background (light) and deep purple gradient (dark) from the showcase
- Add a global `.panel-fade-in` animation class for staggered panel entrance animations
- Ensure `.glass-panel` cards also get the softer 18px border-radius and hover lift treatment matching `.cat-card`

**2. Game Layout (`src/components/game/CatFarm.tsx`)**
- Apply the warm gradient background to the game wrapper (replace plain `bg-background` in `AnimatedBackground`)
- Add fade-in animations to the cat grid section and action sidebar panels

**3. Auth Page (`src/pages/Auth.tsx`)**
- Already uses `AnimatedBackground` with `variant="auth"` and `GlassCard` — no major changes needed, just ensure heading uses Playfair Display

**4. Other Pages (`Stats.tsx`, `Empire.tsx`, `Leaderboard.tsx`, `CatCollection.tsx`, etc.)**
- Apply `cozy-page-bg` background class
- Use Playfair Display on page headings via the `.page-heading` class
- Add entrance fade-in animations to card grids

**5. Component Updates**
- `StatsOverviewCards.tsx` — add hover lift and glassmorphism to stat cards
- `GameHeader.tsx` — apply Playfair Display to the game title/branding
- `AnimatedBackground.tsx` — update the `game` variant to use the warm cozy gradient instead of plain `bg-background`

### Files Affected
- `src/index.css` — new utility classes
- `src/components/ui/AnimatedBackground.tsx` — warm gradient for `game` variant
- `src/components/game/GameHeader.tsx` — Playfair heading
- `src/components/game/CatFarm.tsx` — fade-in on panels
- `src/components/stats/StatsOverviewCards.tsx` — glass + hover lift
- `src/pages/Stats.tsx`, `Empire.tsx`, `Leaderboard.tsx`, `CatCollection.tsx`, `CatGallery.tsx` — cozy bg + heading font + fade-in

