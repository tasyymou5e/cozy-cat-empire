/**
 * @fileoverview Sound Configuration
 *
 * Maps each SoundType to either a real audio file or synthesized config.
 * Real audio files are preferred for cat sounds; synthesized for UI feedback.
 *
 * @module config/sounds
 */

import type { SoundType } from '@/contexts/SoundContext';

/**
 * Audio file-based sound source
 */
export interface AudioFileSound {
  type: 'file';
  /** Path to the audio file relative to public folder */
  path: string;
  /** Volume multiplier (0-1), default 0.5 */
  volume?: number;
}

/**
 * Synthesized oscillator sound configuration
 */
export interface SynthSoundConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  ramp?: 'up' | 'down' | 'none';
  harmonics?: number[];
}

/**
 * Synthesized sound source
 */
export interface SynthesizedSound {
  type: 'synth';
  config: SynthSoundConfig | SynthSoundConfig[];
}

/**
 * Union type for all sound sources
 */
export type SoundSource = AudioFileSound | SynthesizedSound;

/**
 * All unique audio file paths for preloading
 */
export const AUDIO_FILE_PATHS = [
  '/sounds/cat-meow.mp3',
  '/sounds/cat-purr.wav',
  '/sounds/cat-angry-meow.wav',
  '/sounds/cat-sweet-meow.wav',
  '/sounds/cat-hungry-meow.wav',
  '/sounds/cat-attention-meow.wav',
  '/sounds/cute-cat-meow.mp3',
  '/sounds/cute-cat-meow-2.mp3',
  '/sounds/cat-purring-and-meow.mp3',
  '/sounds/funny-cat-meow.mp3',
  '/sounds/cat-meow-fx.mp3',
  '/sounds/lion-roar.wav',
  '/sounds/cat-little-meow.wav',
  '/sounds/cat-begging-meow.wav',
  '/sounds/cat-pain-meow.wav',
  // New sounds from Mixkit (royalty-free)
  '/sounds/cat-growl.wav',
  '/sounds/cat-angry-hiss.wav',
  '/sounds/kitten-meow.wav',
  '/sounds/cat-hungry-meow-2.wav',
  '/sounds/cat-wild-growl.wav',
  '/sounds/cat-angry-cartoon.wav',
  '/sounds/cat-pain-meow-2.wav',
  '/sounds/cat-wild-moan.wav',
  '/sounds/cat-scary-roar.wav',
  '/sounds/cat-begging-meow-2.wav',
  '/sounds/lion-roar-wild.wav',
] as const;

/**
 * Critical sounds to preload immediately for instant playback
 */
export const PRELOAD_SOUNDS = [
  '/sounds/cat-meow.mp3',
  '/sounds/cat-purr.wav',
  '/sounds/cute-cat-meow.mp3',
  '/sounds/cat-attention-meow.wav',
] as const;

/**
 * Complete sound source mapping
 *
 * Cat-related sounds use real audio files for authenticity.
 * UI feedback sounds use synthesized audio for instant response.
 */
export const SOUND_SOURCES: Record<SoundType, SoundSource> = {
  // ========== CAT VOCALIZATIONS ==========
  meow: { type: 'file', path: '/sounds/cat-meow.mp3', volume: 0.6 },
  purr: { type: 'file', path: '/sounds/cat-purr.wav', volume: 0.5 },
  hiss: { type: 'file', path: '/sounds/cat-angry-meow.wav', volume: 0.5 },

  // ========== NEW CAT VOCALIZATIONS (Real audio files from Mixkit) ==========
  catChirp: { type: 'file', path: '/sounds/kitten-meow.wav', volume: 0.5 },
  catTrill: { type: 'file', path: '/sounds/cat-begging-meow-2.wav', volume: 0.45 },
  catGrowl: { type: 'file', path: '/sounds/cat-growl.wav', volume: 0.45 },
  catYawn: { type: 'file', path: '/sounds/cat-wild-moan.wav', volume: 0.35 },
  kittenMeow: { type: 'file', path: '/sounds/kitten-meow.wav', volume: 0.55 },
  catContentPurr: { type: 'file', path: '/sounds/cat-purring-and-meow.mp3', volume: 0.4 },
  catChattering: { type: 'file', path: '/sounds/cat-angry-cartoon.wav', volume: 0.4 },
  catStartled: { type: 'file', path: '/sounds/cat-angry-hiss.wav', volume: 0.4 },

  // ========== RELATIONSHIP SOUNDS ==========
  friendship: { type: 'file', path: '/sounds/cat-sweet-meow.wav', volume: 0.55 },
  rivalry: { type: 'file', path: '/sounds/cat-angry-meow.wav', volume: 0.5 },
  heartBurst: { type: 'file', path: '/sounds/cute-cat-meow-2.mp3', volume: 0.5 },
  sparkClash: { type: 'file', path: '/sounds/cat-pain-meow.wav', volume: 0.45 },

  // ========== MOOD SOUNDS ==========
  moodHappy: { type: 'file', path: '/sounds/cute-cat-meow.mp3', volume: 0.55 },
  moodSad: { type: 'file', path: '/sounds/cat-hungry-meow.wav', volume: 0.45 },

  // ========== CAT ACTIVITY SOUNDS (better variety) ==========
  catEating: { type: 'file', path: '/sounds/cat-purr.wav', volume: 0.4 },
  catPlaying: { type: 'file', path: '/sounds/cute-cat-meow.mp3', volume: 0.5 },
  catSleeping: { type: 'file', path: '/sounds/cat-purring-and-meow.mp3', volume: 0.3 },
  catGrooming: { type: 'file', path: '/sounds/cat-little-meow.wav', volume: 0.4 },
  catExploring: { type: 'file', path: '/sounds/cat-attention-meow.wav', volume: 0.45 },
  catHunting: { type: 'file', path: '/sounds/cat-meow-fx.mp3', volume: 0.45 },
  catStretching: { type: 'file', path: '/sounds/cat-sweet-meow.wav', volume: 0.35 },
  catCuddling: { type: 'file', path: '/sounds/cute-cat-meow-2.mp3', volume: 0.45 },
  catTraining: { type: 'file', path: '/sounds/cat-begging-meow.wav', volume: 0.5 },
  catMischief: { type: 'file', path: '/sounds/funny-cat-meow.mp3', volume: 0.5 },
  catZoomies: { type: 'file', path: '/sounds/cat-meow-fx.mp3', volume: 0.55 },
  catSunbathing: { type: 'file', path: '/sounds/cat-sweet-meow.wav', volume: 0.35 },
  catBirdwatching: { type: 'file', path: '/sounds/cat-attention-meow.wav', volume: 0.45 },

  // ========== NOTIFICATION SOUNDS ==========
  giftReceived: { type: 'file', path: '/sounds/cute-cat-meow.mp3', volume: 0.55 },
  tradeReceived: { type: 'file', path: '/sounds/cat-attention-meow.wav', volume: 0.5 },
  dailyEvent: { type: 'file', path: '/sounds/cat-meow.mp3', volume: 0.5 },

  // ========== ACHIEVEMENT SOUNDS ==========
  achievement: { type: 'file', path: '/sounds/cat-purring-and-meow.mp3', volume: 0.6 },
  levelUp: { type: 'file', path: '/sounds/lion-roar.wav', volume: 0.55 },
  challengeProgress: { type: 'file', path: '/sounds/cat-meow-fx.mp3', volume: 0.45 },
  challengeComplete: { type: 'file', path: '/sounds/cat-purring-and-meow.mp3', volume: 0.6 },

  // ========== UI SOUNDS (Synthesized for instant response) ==========
  click: {
    type: 'synth',
    config: { frequency: 800, type: 'sine', duration: 0.05, volume: 0.2 },
  },
  success: {
    type: 'synth',
    config: [
      { frequency: 523, type: 'sine', duration: 0.1, volume: 0.2 },
      { frequency: 659, type: 'sine', duration: 0.1, volume: 0.2 },
      { frequency: 784, type: 'sine', duration: 0.15, volume: 0.25 },
    ],
  },
  error: {
    type: 'synth',
    config: { frequency: 200, type: 'square', duration: 0.2, volume: 0.15, ramp: 'down' },
  },
  coin: {
    type: 'synth',
    config: [
      { frequency: 1318, type: 'sine', duration: 0.08, volume: 0.2 },
      { frequency: 1568, type: 'sine', duration: 0.12, volume: 0.25 },
    ],
  },
  nextDay: {
    type: 'synth',
    config: [
      { frequency: 440, type: 'sine', duration: 0.2, volume: 0.15 },
      { frequency: 550, type: 'sine', duration: 0.3, volume: 0.2 },
    ],
  },
  cardFlip: {
    type: 'synth',
    config: [
      { frequency: 1200, type: 'sine', duration: 0.05, volume: 0.15 },
      { frequency: 800, type: 'sine', duration: 0.08, volume: 0.12 },
    ],
  },
};

/**
 * Type guard to check if a sound source is an audio file
 */
export function isAudioFileSound(source: SoundSource): source is AudioFileSound {
  return source.type === 'file';
}

/**
 * Type guard to check if a sound source is synthesized
 */
export function isSynthesizedSound(source: SoundSource): source is SynthesizedSound {
  return source.type === 'synth';
}
