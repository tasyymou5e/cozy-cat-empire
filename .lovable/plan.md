

## Add "Let's Have Fun" Landing State to Auth Page

### Concept
Show only the hero panel (centered, full-width) with a "Let's Have Fun" button on initial load. The login form panel is hidden until the user clicks the button, at which point the split-panel layout animates in.

### Changes

**`src/pages/Auth.tsx`**
- Add a `showForm` state (`useState(false)`), defaulting to `false`
- When `showForm` is false: render only the hero panel centered (no split layout, no form panel), with a large "Let's Have Fun 🎉" button at the bottom beneath the social proof section
- When `showForm` is true: render the current split-panel layout as-is
- Hide the `GlassCardTitle` "Cozy Cat Empire" and `GlassCardDescription` from the form panel (they're redundant since the hero already shows this)
- Skip the `showForm` gate for recovery flows (`isRecoveryFlow` or `mode === 'update-password'` should go straight to form)

**`src/index.css`**
- Add a transition class for the layout expanding from centered hero to split-panel (fade + scale)

### Detail

The hero panel in landing state will be a single centered card (max-width ~600px) containing:
1. AuthHero (cats, headline, badges)
2. Social proof section
3. "Made with 💜" footer
4. **"Let's Have Fun 🎉"** button — same gradient style as the submit button, centered below everything

On click → `setShowForm(true)` + `setMode('login')`, the split layout slides in.

