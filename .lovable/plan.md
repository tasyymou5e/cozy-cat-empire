

## Card Showcase Page

I'll create a standalone **Card Showcase** page at `/card-showcase` that displays mock cats at every tier level (Common, Uncommon, Rare, Legendary, Mythic) so you can see and compare the new premium tier designs without needing to be in-game.

### What it will show
- **5 mock cats** — one per tier — each with realistic stats, names, breeds, and personalities
- Both the **standard card** variant and the **trading card** variant side by side
- Dark mode toggle so you can preview both themes
- Each cat will have tier-appropriate grades so all the new CSS effects (amethyst crystalline for Rare, gold metallic for Legendary, holographic for Mythic) are visible

### Implementation
- Create `src/pages/CardShowcase.tsx` with hardcoded mock `Cat` objects at grades 1, 6, 11, 16, and 20 (covering all 5 tiers)
- Render them in a grid using `UnifiedCatCard` with `variant="card"` and `variant="trading"`
- Add a lazy route at `/card-showcase` (no auth required)
- This is a dev/preview page — can be removed later

### Files
- **New**: `src/pages/CardShowcase.tsx`
- **Edit**: `src/App.tsx` — add route

