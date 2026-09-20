/**
 * GraphicsMotionGate
 *
 * Applies the in-app Reduced Motion / graphics-quality preferences to the
 * document root so purely CSS-driven effects (costume + tier glows, ambient
 * sky/float/sway animations, shimmers, particles) actually stop.
 *
 * - `app-reduce-motion`: in-app animations disabled or Reduced Motion on
 * - `app-no-glow`: tier/costume glows disabled or avatar quality set to low
 */
import { useEffect } from 'react';
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';

export function GraphicsMotionGate() {
  const { settings, effectiveAnimations } = useGraphicsSettings();

  const glowsEnabled =
    effectiveAnimations && settings.enableTierGlows && settings.avatarQuality !== 'low';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('app-reduce-motion', !effectiveAnimations);
    root.classList.toggle('app-no-glow', !glowsEnabled);
  }, [effectiveAnimations, glowsEnabled]);

  return null;
}

export default GraphicsMotionGate;
