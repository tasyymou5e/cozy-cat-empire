

## Redesign the Auth/Landing Page — "Storybook Kingdom" Aesthetic

### Design Direction
**Aesthetic**: Warm storybook / illustrated luxury — like opening a fairytale book about a cat kingdom. Not a SaaS login page.

**DFII Score**: 12/15 (Impact: 5, Fit: 5, Feasibility: 4, Performance: 4, Consistency Risk: -1 — already using Playfair Display and glassmorphism site-wide)

**Differentiation anchor**: A split-panel layout with an illustrated "kingdom preview" on the left and the form on the right, connected by a decorative arch border. On mobile, it collapses to a single column with the hero stacking above the form.

### What changes and why

**1. Layout overhaul (`src/pages/Auth.tsx`)**
- Replace the current centered single-column card with a **two-panel layout** on desktop (≥1024px):
  - **Left panel** (55%): The hero section — gradient background with the animated cats, seasonal particles, bouncing emojis, tagline cycler, and feature badges. This becomes the "kingdom window."
  - **Right panel** (45%): The login/signup form in a clean glass card with generous padding.
- On mobile: stacks vertically — compact hero on top, form below.
- Remove the cat ear decorations on the card (feels gimmicky at this level of polish).
- Keep the AI-generated background image as the full-page backdrop behind both panels.

**2. Typography upgrades**
- `GlassCardTitle` "Cozy Cat Empire" → use Playfair Display (`.page-heading` class) at a larger size.
- Form labels: use EB Garamond (already imported) for a refined serif feel instead of default sans.
- Social proof text at bottom: Playfair italic for the "Join thousands" line.

**3. Hero panel refinements (`src/components/auth/AuthHero.tsx`)**
- Make the gradient headline larger (text-5xl on desktop).
- Add a subtle paw-print trail decoration using CSS `::before` pseudo-elements.
- Tighten the feature badges — make them slightly larger with more glass-like styling.

**4. Form card refinements**
- Increase the card's glass intensity — stronger backdrop-blur (from `md` to `lg`), slightly more opaque background.
- Input fields: add a subtle inner glow on focus using `ring-primary/30` + a warm box-shadow.
- Submit button: keep the current gradient but add a **press animation** (`active:scale-[0.98]`) for tactile feel.
- Error/success messages: softer rounded corners (rounded-xl) and slightly more padding.

**5. Entrance animation sequence**
- Left panel slides in from the left (`translateX(-30px)` → 0) with 0.6s ease-out.
- Right panel slides in from the right (`translateX(30px)` → 0) with 0.6s ease-out, 200ms delay.
- Form fields stagger-fade within the card (using existing `panel-fade-in` pattern).

**6. Footer polish (`src/components/auth/AuthFooter.tsx`)**
- Add a decorative thin line divider (gradient from transparent to primary/20 to transparent) above the switch-mode links.
- Links get the `.story-link` underline animation on hover instead of plain underline.

**7. CSS additions (`src/index.css`)**
- `.auth-split-layout` — CSS Grid: `grid-template-columns: 1.2fr 1fr` on lg, single column on mobile.
- `.auth-hero-panel` — entrance slide animation.
- `.auth-form-panel` — entrance slide animation with delay.
- `.auth-divider` — decorative gradient line.
- Adjust existing `.bokeh-bubble` to be constrained to the hero panel only.

### Files to modify
- `src/pages/Auth.tsx` — layout restructure, animation classes, typography
- `src/components/auth/AuthHero.tsx` — larger headline, paw-trail decoration, tighter badges
- `src/components/auth/AuthFooter.tsx` — divider + story-link hover
- `src/components/auth/LoginForm.tsx` — input focus glow enhancement
- `src/components/auth/SignupFields.tsx` — matching input focus glow
- `src/components/ui/GlassCard.tsx` — stronger blur variant prop
- `src/index.css` — new animation keyframes and layout utilities

### What stays the same
- All auth logic, validation, recovery flow — untouched
- AI background image system — still renders as full-page backdrop
- AnimatedFarmCats, SeasonalParticles, FloatingDecorations — repositioned into hero panel but same components
- Dark mode support — all new styles use CSS variables

