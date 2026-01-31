/**
 * @fileoverview Authentication Page Cat Sounds
 *
 * Provides real cat audio playback for interactive cat elements
 * on the authentication page. Uses actual audio files instead of
 * synthesized sounds for a more authentic experience.
 *
 * @module hooks/useAuthSounds
 */

import { useCallback, useRef } from 'react';

/**
 * Cat types available on the auth page
 */
type CatSoundType = 'tabby' | 'gray' | 'white' | 'calico';

/**
 * Mapping of cat types to their audio files
 */
const AUTH_SOUNDS: Record<CatSoundType, string> = {
  tabby: '/sounds/cat-meow.mp3',
  gray: '/sounds/cat-purr.wav',
  white: '/sounds/cute-cat-meow.mp3',
  calico: '/sounds/cat-sweet-meow.wav',
};

/**
 * Volume for auth page sounds (0-1)
 */
const AUTH_SOUND_VOLUME = 0.4;

/**
 * Cooldown between sounds to prevent spam (ms)
 */
const COOLDOWN_MS = 500;

/**
 * Hook for playing cat sounds on the authentication page
 *
 * Uses real audio files for authentic cat sounds with cooldown
 * to prevent sound spam.
 *
 * @returns Object containing playCatSound function
 *
 * @example
 * ```tsx
 * function AuthCat({ type }: { type: CatSoundType }) {
 *   const { playCatSound } = useAuthSounds();
 *
 *   return (
 *     <div onClick={() => playCatSound(type)}>
 *       <CatAvatar />
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthSounds() {
  const lastPlayedRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Play a cat sound by type
   *
   * @param type - The cat type (tabby, gray, white, calico)
   */
  const playCatSound = useCallback((type: CatSoundType) => {
    const now = Date.now();

    // Enforce cooldown
    if (now - lastPlayedRef.current < COOLDOWN_MS) {
      return;
    }
    lastPlayedRef.current = now;

    try {
      // Stop previous sound if still playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create and play new audio
      const soundPath = AUTH_SOUNDS[type];
      const audio = new Audio(soundPath);
      audio.volume = AUTH_SOUND_VOLUME;

      audioRef.current = audio;

      audio.play().catch(() => {
        // Silently fail if audio cannot play (e.g., autoplay policy)
      });
    } catch {
      // Silently fail if audio is not available
    }
  }, []);

  return { playCatSound };
}
