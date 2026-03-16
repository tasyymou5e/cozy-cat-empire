

## Improve Cat Cards — Premium Tier Visuals

### Current State
- Cat cards use a basic `.cat-card` class with minimal glassmorphism (`bg-card/80 backdrop-blur-sm`)
- Tier glow animations (`golden-glow`, `purple-glow`, `rainbow-glow`) exist in tailwind config but are only applied as border glows on trading cards — not on the main card variant
- No tier-specific background treatments, accent bars, or differentiated layouts
- Stats use plain `Progress` bars with no color variation

### Plan

**1. Add tier-specific CSS classes in `src/index.css`**

New classes that layer on top of `.cat-card`:
- `.cat-card-common` — subtle gray border, no glow
- `.cat-card-uncommon` — soft blue inner glow, blue-tinted top accent strip
- `.cat-card-rare` — **Amethyst/crystalline theme**: purple gradient background, faceted inset shadow (purple tones), subtle crystalline shimmer overlay via `::after` pseudo-element
- `.cat-card-very-rare` — **Gold/metallic theme**: warm amber gradient background, golden inner glow, metallic sheen sweep animation via `::after`
- `.cat-card-ultra-rare` — **Holographic prismatic**: animated rainbow gradient border (using existing `rainbow-glow`), prismatic shimmer overlay, enhanced sparkle particles

Add a `::before` accent bar (3px colored strip at card top) driven by a `--tier-accent` CSS variable.

**2. Add new keyframes in `src/index.css`**
- `@keyframes metallic-sheen` — diagonal light sweep for gold cards
- `@keyframes crystal-shimmer` — subtle faceted light pulse for rare cards

**3. Update `UnifiedCatCard.tsx` default "card" variant (lines 288-509)**
- Compute tier-specific class name and apply it alongside `.cat-card`
- Set `--tier-accent` CSS variable per tier (gray, blue, purple, gold, rainbow gradient)
- Add a tier label badge in top-right for rare+ cats: "RARE" (purple), "LEGENDARY" (gold), "MYTHIC" (rainbow gradient text)
- Upgrade stat bars: apply inline gradient colors on the Progress indicator (green→yellow→red based on value)
- Polish layout: add a soft radial gradient behind the avatar area

**4. Update `TradingCardView` (lines 569-804)**
- Apply matching tier background classes
- Add crystalline overlay for rare, metallic sheen for veryRare
- Keep existing ultraRare holographic border, enhance with prismatic inner glow

**5. Update `TIER_VISUALS` in `src/config/graphics.ts`**
- Add `accentColor` and `tierLabel` properties for each tier
- Update `bgGradient` values to richer, more distinct gradients

### Files to modify
- `src/index.css` — tier card classes, accent bar, new keyframes
- `src/components/game/UnifiedCatCard.tsx` — apply tier classes, accent variable, tier labels, stat bar gradients
- `src/config/graphics.ts` — enhanced tier config with accent colors and labels

