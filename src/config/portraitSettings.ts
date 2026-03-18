/**
 * Portrait Settings Configuration
 *
 * Defines portrait style options, display metadata, and localStorage persistence
 * for global default portrait style preferences.
 */

export type PortraitStyle = 'realistic' | 'kawaii';

export const PORTRAIT_STYLES: Record<
  PortraitStyle,
  { label: string; description: string; icon: string }
> = {
  kawaii: {
    label: 'Kawaii',
    description: 'Cute cartoon style with big eyes and soft features',
    icon: '🎨',
  },
  realistic: {
    label: 'Realistic',
    description: 'Semi-realistic digital painting with detailed fur',
    icon: '📷',
  },
};

const STORAGE_KEY = 'cat-farm-portrait-style';

/**
 * Get the global default portrait style from localStorage
 */
export function getGlobalPortraitStyle(): PortraitStyle {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'realistic' || stored === 'kawaii') return stored;
  } catch {
    // ignore
  }
  return 'kawaii';
}

/**
 * Set the global default portrait style in localStorage
 */
export function setGlobalPortraitStyle(style: PortraitStyle): void {
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // ignore
  }
}

/**
 * Get the effective style for a specific cat.
 * Cat-level override takes priority over global default.
 */
export function getEffectivePortraitStyle(
  catStyle?: PortraitStyle,
  globalDefault?: PortraitStyle
): PortraitStyle {
  return catStyle || globalDefault || getGlobalPortraitStyle();
}
