/**
 * Graphics Configuration
 *
 * Centralized configuration for visual settings throughout the app.
 * This makes it easy to adjust graphics, effects, and visual behavior
 * without modifying individual components.
 */

export const GRAPHICS_CONFIG = {
  /**
   * When true, shows AI-generated portrait over avatar when available
   * Set to false to always use the CatAvatar component
   */
  enablePortraitPriority: true,

  /**
   * Enable micro-animations (breathing, blinking, etc.)
   */
  enableAnimations: true,

  /**
   * Card border style mode
   * - 'tier': Border color based on cat grade tier
   * - 'simple': Simple border for all cats
   * - 'none': No special borders
   */
  cardBorderStyle: 'tier' as 'tier' | 'simple' | 'none',

  /**
   * Avatar rendering quality
   * - 'low': Faster rendering, less detail
   * - 'medium': Balanced
   * - 'high': Full detail and effects
   */
  avatarQuality: 'high' as 'low' | 'medium' | 'high',

  /**
   * Enable tier-specific glow effects
   */
  enableTierGlows: true,

  /**
   * Enable sparkle effects for ultra rare cats
   */
  enableSparkles: true,

  /**
   * Enable flip animation on trading cards
   */
  enableCardFlip: true,

  /**
   * Vector rendering engine
   * - 'paperjs': Use Paper.js for high-quality vector generation
   * - 'simple': Use CSS-based avatar rendering
   */
  vectorEngine: 'paperjs' as 'paperjs' | 'simple',

  /**
   * Show breed-specific avatar shapes and features
   */
  avatarBreedFeatures: true,

  /**
   * Use detailed pattern rendering on avatars
   */
  avatarDetailedPatterns: true,

  /**
   * How to display costumes
   * - 'vector': Use SVG vector costumes
   * - 'emoji': Use emoji overlays
   * - 'auto': Best available option
   */
  costumeDisplayMode: 'auto' as 'vector' | 'emoji' | 'auto',

  /**
   * Show costume indicator badge on AI portraits
   */
  showCostumeOnPortrait: true,

  /**
   * Cache generated Paper.js avatars
   */
  cacheGeneratedAvatars: true,

  /**
   * Fallback behavior when portrait fails to load
   * - 'avatar': Show CatAvatar component
   * - 'placeholder': Show generic placeholder
   * - 'silhouette': Show cat silhouette
   */
  portraitFallbackBehavior: 'avatar' as 'avatar' | 'placeholder' | 'silhouette',

  /**
   * Respect prefers-reduced-motion for accessibility
   */
  enableReducedMotion: false,

  /**
   * Enable animated effects on costumes (sparkles, glows, flowing capes, etc.)
   */
  enableCostumeAnimations: true,
} as const;

/**
 * Tier-based visual configuration
 */
export const TIER_VISUALS = {
  common: {
    borderColor: 'border-border',
    bgGradient: 'bg-card',
    glowClass: '',
    textColor: 'text-muted-foreground',
  },
  uncommon: {
    borderColor: 'border-blue-400',
    bgGradient: 'bg-gradient-to-b from-blue-50 to-card dark:from-blue-950/30',
    glowClass:
      'shadow-[0_0_12px_2px_rgba(59,130,246,0.35)] hover:shadow-[0_0_18px_4px_rgba(59,130,246,0.5)]',
    textColor: 'text-blue-400',
  },
  rare: {
    borderColor: 'border-purple-400',
    bgGradient: 'bg-gradient-to-b from-purple-50 to-card dark:from-purple-950/30',
    glowClass: 'animate-purple-glow',
    textColor: 'text-purple-400',
  },
  veryRare: {
    borderColor: 'border-yellow-400',
    bgGradient: 'bg-gradient-to-b from-yellow-50 to-card dark:from-yellow-950/30',
    glowClass: 'animate-golden-glow',
    textColor: 'text-yellow-400',
  },
  ultraRare: {
    borderColor: 'border-pink-400',
    bgGradient:
      'bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 dark:from-purple-950/50 dark:via-pink-950/30 dark:to-orange-950/50',
    glowClass: 'animate-rainbow-glow',
    textColor: 'text-pink-400',
    gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500',
  },
} as const;

/**
 * Get tier visuals configuration
 */
export function getTierVisuals(tier: keyof typeof TIER_VISUALS) {
  return TIER_VISUALS[tier] || TIER_VISUALS.common;
}
