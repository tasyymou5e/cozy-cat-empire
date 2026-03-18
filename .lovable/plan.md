

# Add Missing CSS Keyframes to index.css

## What
Add 4 missing keyframes + animation classes after line 1200 in `src/index.css`.

## Change: `src/index.css` (after line 1200, +28 lines)

```css
/* Whisker Flicker */
@keyframes whisker-flicker { ... }
.animate-whisker-flicker { animation: whisker-flicker 0.15s ease-out; }

/* Ear Twitch (kawaii) */
@keyframes kawaii-ear-twitch { ... }
.animate-kawaii-ear-twitch { animation: kawaii-ear-twitch 0.3s ease-out; transform-origin: bottom center; }

/* Eye Blink overlay */
@keyframes cat-eye-blink { ... }
.animate-cat-eye-blink { animation: cat-eye-blink 0.15s ease-in-out; transform-origin: center top; }

/* Head Tilt (realistic) */
@keyframes realistic-head-tilt { ... }
.animate-realistic-head-tilt { animation: realistic-head-tilt 4s ease-in-out infinite; }
```

Exact CSS content as specified in the user's gap analysis. One file, ~28 lines added.

