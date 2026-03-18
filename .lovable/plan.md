

# Mini Cat Games — Random Pop-up Prompts

## What We're Building
A system of small, fun mini-games that randomly pop up as animated modals while the user plays, encouraging interaction with their cats. Each game is quick (10-30 seconds), themed around cats, and rewards the player.

## Mini-Games (5 games)

1. **Catch the Yarn** — A yarn ball bounces around; click/tap it before time runs out. More catches = better reward.
2. **Cat Nap Timing** — A sleeping cat with a rising "zzz" bar; tap at the perfect moment to get maximum rest bonus.
3. **Treat Toss** — Falling treats from the top; move a cat bowl left/right to catch them. Score-based.
4. **Whack-a-Mouse** — Mice pop out of holes; tap them before they hide. Classic whack-a-mole reskinned.
5. **Memory Match** — Flip cat-themed cards to find matching pairs against a timer.

## How It Works

- A `MiniGamePrompt` component renders a themed animated modal with a preview of the game and a "Play!" / "Skip" button pair.
- A `useMiniGameTrigger` hook tracks elapsed time / actions and randomly fires a prompt every ~3-8 minutes of active play.
- On completion, the player earns coins, treats, or a small happiness boost to a random cat.
- Results show with confetti/sparkle animation before dismissing.

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/game/minigames/MiniGamePrompt.tsx` | Animated pop-up prompt modal |
| `src/components/game/minigames/CatchTheYarn.tsx` | Yarn-catching click game |
| `src/components/game/minigames/CatNapTiming.tsx` | Timing-based tap game |
| `src/components/game/minigames/TreatToss.tsx` | Falling treats catch game |
| `src/components/game/minigames/WhackAMouse.tsx` | Whack-a-mole variant |
| `src/components/game/minigames/MemoryMatch.tsx` | Card-matching memory game |
| `src/components/game/minigames/MiniGameReward.tsx` | Reward display with animation |
| `src/components/game/minigames/index.ts` | Barrel export |
| `src/hooks/useMiniGameTrigger.ts` | Random trigger logic + cooldown |

## Files to Edit

| File | Change |
|------|--------|
| `src/components/game/CatFarm.tsx` | Mount `MiniGamePrompt` overlay with trigger hook |

## Technical Approach

- Each game is a self-contained component accepting `onComplete(score)` and `onSkip` callbacks
- Games use CSS animations (bouncing, sliding, scaling) from existing tailwind keyframes + a few new ones
- Canvas-free: all games built with animated divs and emoji/SVG graphics for consistency
- `useMiniGameTrigger` uses `setInterval` + `Math.random()` with a cooldown stored in state to avoid spamming
- Rewards scale with score: coins (10-50), treats (1-3), or +5-15 happiness to a random cat
- The prompt slides in from bottom with `animate-fade-in` + scale, with a playful bouncing cat emoji header

## Reward Integration

Games call `actions.setMoney(current + reward)` for coins or modify resources/happiness through existing game actions passed as props.

