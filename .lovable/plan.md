

# Stop the Login Button from Blinking

The submit button on line 1053-1055 of `src/pages/Auth.tsx` currently has `animate-[gradient-shift_3s_ease-in-out_infinite]` which creates a constantly shifting/blinking gradient animation.

## Change

**File: `src/pages/Auth.tsx` (line 1055)**

Replace the animated gradient button class with a solid, attractive gradient that does not animate:

```
// Before:
className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[gradient-shift_3s_ease-in-out_infinite] hover:opacity-90 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-primary/25 relative overflow-hidden group"

// After:
className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-primary/25 relative overflow-hidden group"
```

Key changes:
- Remove `animate-[gradient-shift_3s_ease-in-out_infinite]` (stops the blinking)
- Remove `bg-[length:200%_auto]` (no longer needed without animation)
- Simplify to a clean `from-primary to-accent` two-tone gradient
- Keep hover scale, shadow, and shimmer-on-hover effects intact

This gives a solid, vibrant gradient button that still feels polished with the hover effects.

