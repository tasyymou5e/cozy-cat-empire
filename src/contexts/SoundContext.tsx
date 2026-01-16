/**
 * @fileoverview Unified Sound System Provider
 *
 * Provides procedural audio for game sounds and ambient music using Web Audio API.
 * This is the single source of truth for all audio in the game.
 *
 * Features:
 * - Sound effects for UI, game events, and cat activities
 * - Mood-based ambient music that changes with game progression
 * - Volume controls for SFX and music independently
 * - Celebration and tense mood triggers
 *
 * @module contexts/SoundContext
 */

import React, { createContext, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';

/**
 * Available sound effect types
 */
export type SoundType =
  | 'click'
  | 'success'
  | 'error'
  | 'meow'
  | 'purr'
  | 'hiss'
  | 'friendship'
  | 'rivalry'
  | 'levelUp'
  | 'coin'
  | 'achievement'
  | 'nextDay'
  | 'cardFlip'
  | 'moodHappy'
  | 'moodSad'
  | 'dailyEvent'
  | 'challengeProgress'
  | 'challengeComplete'
  | 'heartBurst'
  | 'sparkClash'
  | 'catEating'
  | 'catPlaying'
  | 'catSleeping'
  | 'catGrooming'
  | 'catExploring'
  | 'catHunting'
  | 'catStretching'
  | 'catCuddling'
  | 'catTraining'
  | 'catMischief'
  | 'catZoomies'
  | 'catSunbathing'
  | 'catBirdwatching'
  | 'giftReceived'
  | 'tradeReceived';

/**
 * Music mood types for ambient background music
 */
export type MusicMood = 'morning' | 'afternoon' | 'evening' | 'night' | 'celebration' | 'tense';

/**
 * Configuration for a single oscillator tone
 */
interface SoundConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  ramp?: 'up' | 'down' | 'none';
  harmonics?: number[];
}

/**
 * Sound context interface - all available methods
 */
interface SoundContextType {
  /** Play a sound effect by type */
  playSound: (type: SoundType) => void;
  /** Enable or disable sound effects */
  setEnabled: (enabled: boolean) => void;
  /** Set SFX volume (0-1) */
  setVolume: (volume: number) => void;
  /** Check if sounds are enabled */
  isEnabled: () => boolean;
  /** Get current SFX volume */
  getVolume: () => number;
  /** Start ambient background music */
  startMusic: (mood?: MusicMood) => void;
  /** Stop background music */
  stopMusic: () => void;
  /** Set music volume (0-0.3) */
  setMusicVolume: (volume: number) => void;
  /** Check if music is playing */
  isMusicPlaying: () => boolean;
  /** Change the current music mood */
  setMusicMood: (mood: MusicMood) => void;
  /** Get the current music mood */
  getCurrentMood: () => MusicMood;
  /** Update music mood based on game day */
  updateMusicForDay: (day: number) => void;
  /** Trigger celebration mood temporarily (10s) */
  triggerCelebration: () => void;
  /** Trigger tense mood temporarily (6s) */
  triggerTense: () => void;
}

// Chord progressions for different moods (frequencies in Hz)
const MUSIC_MOODS: Record<MusicMood, { chords: number[][]; tempo: number; brightness: number }> = {
  morning: {
    chords: [
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
    ],
    tempo: 0.08,
    brightness: 1.2,
  },
  afternoon: {
    chords: [
      [98.0, 123.47, 146.83, 185.0], // G
      [110.0, 138.59, 164.81, 207.65], // Am
      [123.47, 155.56, 185.0, 233.08], // Bm
      [130.81, 164.81, 196.0, 246.94], // C
    ],
    tempo: 0.1,
    brightness: 1.0,
  },
  evening: {
    chords: [
      [87.31, 110.0, 130.81, 164.81], // Fmaj7
      [98.0, 123.47, 146.83, 185.0], // G7
      [110.0, 130.81, 164.81, 196.0], // Am7
      [116.54, 146.83, 174.61, 220.0], // Bb
    ],
    tempo: 0.06,
    brightness: 0.8,
  },
  night: {
    chords: [
      [110.0, 130.81, 164.81, 207.65], // Am7
      [98.0, 123.47, 146.83, 185.0], // G
      [87.31, 110.0, 130.81, 164.81], // Fmaj7
      [82.41, 103.83, 123.47, 155.56], // Em
    ],
    tempo: 0.04,
    brightness: 0.6,
  },
  celebration: {
    chords: [
      [130.81, 164.81, 196.0, 261.63], // C
      [146.83, 185.0, 220.0, 293.66], // D
      [164.81, 207.65, 246.94, 329.63], // E
      [174.61, 220.0, 261.63, 349.23], // F
    ],
    tempo: 0.15,
    brightness: 1.5,
  },
  tense: {
    chords: [
      [110.0, 130.81, 155.56, 185.0], // Am dim
      [103.83, 123.47, 146.83, 174.61], // G#dim
      [98.0, 116.54, 138.59, 164.81], // Gm
      [92.5, 110.0, 130.81, 155.56], // F#dim
    ],
    tempo: 0.12,
    brightness: 0.5,
  },
};

const SOUND_CONFIGS: Record<SoundType, SoundConfig | SoundConfig[]> = {
  click: { frequency: 800, type: 'sine', duration: 0.05, volume: 0.2 },
  success: [
    { frequency: 523, type: 'sine', duration: 0.1, volume: 0.2 },
    { frequency: 659, type: 'sine', duration: 0.1, volume: 0.2 },
    { frequency: 784, type: 'sine', duration: 0.15, volume: 0.25 },
  ],
  error: { frequency: 200, type: 'square', duration: 0.2, volume: 0.15, ramp: 'down' },
  meow: [
    { frequency: 600, type: 'sine', duration: 0.15, volume: 0.25, ramp: 'up' },
    { frequency: 450, type: 'sine', duration: 0.2, volume: 0.2, ramp: 'down' },
  ],
  purr: { frequency: 25, type: 'sine', duration: 0.5, volume: 0.1, harmonics: [50, 75] },
  hiss: { frequency: 2000, type: 'sawtooth', duration: 0.3, volume: 0.1, ramp: 'down' },
  friendship: [
    { frequency: 440, type: 'sine', duration: 0.1, volume: 0.2 },
    { frequency: 554, type: 'sine', duration: 0.1, volume: 0.2 },
    { frequency: 659, type: 'sine', duration: 0.15, volume: 0.25 },
    { frequency: 880, type: 'sine', duration: 0.2, volume: 0.3 },
  ],
  rivalry: [
    { frequency: 300, type: 'square', duration: 0.1, volume: 0.15 },
    { frequency: 250, type: 'square', duration: 0.15, volume: 0.12 },
  ],
  levelUp: [
    { frequency: 392, type: 'sine', duration: 0.1, volume: 0.25 },
    { frequency: 523, type: 'sine', duration: 0.1, volume: 0.25 },
    { frequency: 659, type: 'sine', duration: 0.1, volume: 0.25 },
    { frequency: 784, type: 'sine', duration: 0.15, volume: 0.3 },
    { frequency: 1047, type: 'sine', duration: 0.25, volume: 0.35 },
  ],
  coin: [
    { frequency: 1318, type: 'sine', duration: 0.08, volume: 0.2 },
    { frequency: 1568, type: 'sine', duration: 0.12, volume: 0.25 },
  ],
  achievement: [
    { frequency: 523, type: 'sine', duration: 0.15, volume: 0.25 },
    { frequency: 659, type: 'sine', duration: 0.15, volume: 0.25 },
    { frequency: 784, type: 'sine', duration: 0.15, volume: 0.25 },
    { frequency: 1047, type: 'sine', duration: 0.3, volume: 0.35 },
  ],
  nextDay: [
    { frequency: 440, type: 'sine', duration: 0.2, volume: 0.15 },
    { frequency: 550, type: 'sine', duration: 0.3, volume: 0.2 },
  ],
  cardFlip: [
    { frequency: 1200, type: 'sine', duration: 0.05, volume: 0.15 },
    { frequency: 800, type: 'sine', duration: 0.08, volume: 0.12 },
  ],
  moodHappy: [
    { frequency: 600, type: 'sine', duration: 0.1, volume: 0.2 },
    { frequency: 800, type: 'sine', duration: 0.12, volume: 0.22 },
    { frequency: 1000, type: 'sine', duration: 0.15, volume: 0.18 },
  ],
  moodSad: [
    { frequency: 400, type: 'sine', duration: 0.15, volume: 0.15, ramp: 'down' },
    { frequency: 300, type: 'sine', duration: 0.2, volume: 0.12, ramp: 'down' },
  ],
  dailyEvent: [
    { frequency: 523, type: 'sine', duration: 0.1, volume: 0.2 },
    { frequency: 659, type: 'sine', duration: 0.1, volume: 0.22 },
    { frequency: 784, type: 'sine', duration: 0.15, volume: 0.25 },
  ],
  challengeProgress: [
    { frequency: 880, type: 'sine', duration: 0.08, volume: 0.15 },
    { frequency: 1100, type: 'sine', duration: 0.1, volume: 0.18 },
  ],
  challengeComplete: [
    { frequency: 440, type: 'sine', duration: 0.12, volume: 0.2 },
    { frequency: 554, type: 'sine', duration: 0.12, volume: 0.22 },
    { frequency: 659, type: 'sine', duration: 0.12, volume: 0.24 },
    { frequency: 880, type: 'sine', duration: 0.25, volume: 0.3 },
  ],
  heartBurst: [
    { frequency: 523, type: 'sine', duration: 0.08, volume: 0.2 },
    { frequency: 659, type: 'sine', duration: 0.08, volume: 0.22 },
    { frequency: 784, type: 'sine', duration: 0.1, volume: 0.25 },
    { frequency: 1047, type: 'sine', duration: 0.15, volume: 0.2 },
  ],
  sparkClash: [
    { frequency: 350, type: 'sawtooth', duration: 0.06, volume: 0.12 },
    { frequency: 280, type: 'square', duration: 0.08, volume: 0.1 },
    { frequency: 180, type: 'sawtooth', duration: 0.12, volume: 0.08, ramp: 'down' },
  ],
  catEating: [
    { frequency: 300, type: 'sine', duration: 0.08, volume: 0.12 },
    { frequency: 350, type: 'sine', duration: 0.06, volume: 0.1 },
    { frequency: 320, type: 'sine', duration: 0.07, volume: 0.08 },
  ],
  catPlaying: [
    { frequency: 800, type: 'sine', duration: 0.08, volume: 0.15 },
    { frequency: 1000, type: 'sine', duration: 0.06, volume: 0.12 },
    { frequency: 900, type: 'sine', duration: 0.1, volume: 0.1 },
  ],
  catSleeping: { frequency: 25, type: 'sine', duration: 0.6, volume: 0.08, harmonics: [50, 75] },
  catGrooming: [
    { frequency: 500, type: 'sine', duration: 0.05, volume: 0.1 },
    { frequency: 600, type: 'sine', duration: 0.04, volume: 0.08 },
  ],
  catExploring: [
    { frequency: 400, type: 'sine', duration: 0.1, volume: 0.1 },
    { frequency: 500, type: 'sine', duration: 0.08, volume: 0.12 },
    { frequency: 450, type: 'sine', duration: 0.12, volume: 0.08 },
  ],
  catHunting: [
    { frequency: 200, type: 'sine', duration: 0.15, volume: 0.08 },
    { frequency: 250, type: 'sine', duration: 0.1, volume: 0.1 },
    { frequency: 180, type: 'sine', duration: 0.2, volume: 0.06 },
  ],
  catStretching: [
    { frequency: 350, type: 'sine', duration: 0.2, volume: 0.1 },
    { frequency: 400, type: 'sine', duration: 0.25, volume: 0.08 },
    { frequency: 450, type: 'sine', duration: 0.15, volume: 0.06 },
  ],
  catCuddling: { frequency: 30, type: 'sine', duration: 0.5, volume: 0.1, harmonics: [60, 80] },
  catTraining: [
    { frequency: 600, type: 'sine', duration: 0.1, volume: 0.12 },
    { frequency: 700, type: 'sine', duration: 0.08, volume: 0.14 },
    { frequency: 800, type: 'sine', duration: 0.12, volume: 0.1 },
  ],
  catMischief: [
    { frequency: 800, type: 'sawtooth', duration: 0.08, volume: 0.12 },
    { frequency: 400, type: 'square', duration: 0.1, volume: 0.1 },
    { frequency: 200, type: 'sawtooth', duration: 0.15, volume: 0.08, ramp: 'down' },
  ],
  catZoomies: [
    { frequency: 300, type: 'sawtooth', duration: 0.05, volume: 0.08 },
    { frequency: 500, type: 'sawtooth', duration: 0.05, volume: 0.1 },
    { frequency: 700, type: 'sawtooth', duration: 0.05, volume: 0.12 },
    { frequency: 900, type: 'sawtooth', duration: 0.05, volume: 0.14 },
    { frequency: 1100, type: 'sawtooth', duration: 0.08, volume: 0.1, ramp: 'down' },
  ],
  catSunbathing: {
    frequency: 150,
    type: 'sine',
    duration: 0.6,
    volume: 0.06,
    harmonics: [200, 250],
  },
  catBirdwatching: [
    { frequency: 600, type: 'sine', duration: 0.1, volume: 0.08 },
    { frequency: 800, type: 'sine', duration: 0.08, volume: 0.1 },
    { frequency: 1000, type: 'sine', duration: 0.06, volume: 0.12 },
  ],
  giftReceived: [
    { frequency: 523, type: 'sine', duration: 0.1, volume: 0.2 },
    { frequency: 659, type: 'sine', duration: 0.1, volume: 0.22 },
    { frequency: 784, type: 'sine', duration: 0.12, volume: 0.25 },
    { frequency: 1047, type: 'sine', duration: 0.2, volume: 0.3 },
  ],
  tradeReceived: [
    { frequency: 440, type: 'sine', duration: 0.1, volume: 0.18 },
    { frequency: 554, type: 'sine', duration: 0.1, volume: 0.2 },
    { frequency: 659, type: 'sine', duration: 0.15, volume: 0.22 },
  ],
};

/**
 * Get mood based on game day (simulates time of day cycle)
 */
function getMoodForDay(day: number): MusicMood {
  const timeOfDay = day % 4;
  switch (timeOfDay) {
    case 0:
      return 'morning';
    case 1:
      return 'afternoon';
    case 2:
      return 'evening';
    case 3:
      return 'night';
    default:
      return 'afternoon';
  }
}

const SoundContext = createContext<SoundContextType | null>(null);

/**
 * Sound Provider Component
 *
 * Provides the unified sound system to all children components.
 * Must wrap any components that need access to sound effects or music.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <SoundProvider>
 *       <GameComponent />
 *     </SoundProvider>
 *   );
 * }
 * ```
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);
  const volumeRef = useRef(0.5);
  const musicVolumeRef = useRef(0.12);
  const currentMoodRef = useRef<MusicMood>('afternoon');
  const currentChordIndexRef = useRef(0);
  const musicNodesRef = useRef<{
    oscillators: OscillatorNode[];
    gains: GainNode[];
    masterGain: GainNode | null;
    lfo: OscillatorNode | null;
  } | null>(null);
  const musicPlayingRef = useRef(false);
  const chordIntervalRef = useRef<number | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (config: SoundConfig, delay: number = 0) => {
      if (!enabledRef.current) return;

      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const startTime = ctx.currentTime + delay;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, startTime);

      const volume = config.volume * volumeRef.current;

      if (config.ramp === 'up') {
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + config.duration * 0.3);
        gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration);
      } else if (config.ramp === 'down') {
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration);
      } else {
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration - 0.01);
      }

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + config.duration);

      if (config.harmonics) {
        config.harmonics.forEach((harmFreq) => {
          const harmOsc = ctx.createOscillator();
          const harmGain = ctx.createGain();
          harmOsc.type = config.type;
          harmOsc.frequency.setValueAtTime(harmFreq, startTime);
          harmGain.gain.setValueAtTime(volume * 0.5, startTime);
          harmGain.gain.linearRampToValueAtTime(0, startTime + config.duration);
          harmOsc.connect(harmGain);
          harmGain.connect(ctx.destination);
          harmOsc.start(startTime);
          harmOsc.stop(startTime + config.duration);
        });
      }
    },
    [initAudio]
  );

  const playSound = useCallback(
    (type: SoundType) => {
      const config = SOUND_CONFIGS[type];

      if (Array.isArray(config)) {
        let delay = 0;
        config.forEach((c) => {
          playTone(c, delay);
          delay += c.duration * 0.8;
        });
      } else {
        playTone(config);
      }
    },
    [playTone]
  );

  const transitionToChord = useCallback((frequencies: number[], brightness: number) => {
    if (!musicNodesRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const { oscillators, gains } = musicNodesRef.current;

    frequencies.forEach((freq, i) => {
      if (oscillators[i] && gains[i]) {
        oscillators[i].frequency.linearRampToValueAtTime(freq * brightness, ctx.currentTime + 2);
        gains[i].gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1);
        gains[i].gain.linearRampToValueAtTime(0.12 + i * 0.02, ctx.currentTime + 2);
      }
    });
  }, []);

  const startChordProgression = useCallback(() => {
    if (chordIntervalRef.current) return;

    const cycleChord = () => {
      const mood = MUSIC_MOODS[currentMoodRef.current];
      currentChordIndexRef.current = (currentChordIndexRef.current + 1) % mood.chords.length;
      transitionToChord(mood.chords[currentChordIndexRef.current], mood.brightness);
    };

    chordIntervalRef.current = window.setInterval(cycleChord, 8000);
  }, [transitionToChord]);

  const startMusic = useCallback(
    (mood: MusicMood = 'afternoon') => {
      if (musicPlayingRef.current || musicNodesRef.current) return;

      currentMoodRef.current = mood;
      currentChordIndexRef.current = 0;

      const ctx = initAudio();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const moodConfig = MUSIC_MOODS[mood];
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(musicVolumeRef.current, ctx.currentTime + 2);
      masterGain.connect(ctx.destination);

      const oscillators: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      const firstChord = moodConfig.chords[0];

      firstChord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * moodConfig.brightness, ctx.currentTime);
        osc.detune.setValueAtTime((i - 1.5) * 5, ctx.currentTime);

        gain.gain.setValueAtTime(0.12 + i * 0.02, ctx.currentTime);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();

        oscillators.push(osc);
        gains.push(gain);
      });

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(moodConfig.tempo, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      lfo.start();

      musicNodesRef.current = { oscillators, gains, masterGain, lfo };
      musicPlayingRef.current = true;

      startChordProgression();
    },
    [initAudio, startChordProgression]
  );

  const stopMusic = useCallback(() => {
    if (!musicNodesRef.current) return;

    if (chordIntervalRef.current) {
      clearInterval(chordIntervalRef.current);
      chordIntervalRef.current = null;
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    const { oscillators, masterGain, lfo } = musicNodesRef.current;

    if (masterGain) {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    }

    setTimeout(() => {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch (error) {
          console.debug('Oscillator cleanup:', error);
        }
      });
      if (lfo) {
        try {
          lfo.stop();
        } catch (error) {
          console.debug('LFO cleanup:', error);
        }
      }
      musicNodesRef.current = null;
      musicPlayingRef.current = false;
    }, 1100);
  }, []);

  const setMusicMood = useCallback(
    (mood: MusicMood) => {
      if (!musicPlayingRef.current || !musicNodesRef.current || !audioContextRef.current) return;

      currentMoodRef.current = mood;
      currentChordIndexRef.current = 0;

      const moodConfig = MUSIC_MOODS[mood];
      const ctx = audioContextRef.current;

      if (musicNodesRef.current.lfo) {
        musicNodesRef.current.lfo.frequency.linearRampToValueAtTime(
          moodConfig.tempo,
          ctx.currentTime + 1
        );
      }

      transitionToChord(moodConfig.chords[0], moodConfig.brightness);
    },
    [transitionToChord]
  );

  const updateMusicForDay = useCallback(
    (day: number) => {
      if (!musicPlayingRef.current) return;
      const newMood = getMoodForDay(day);
      if (newMood !== currentMoodRef.current) {
        setMusicMood(newMood);
      }
    },
    [setMusicMood]
  );

  const triggerCelebration = useCallback(() => {
    if (!musicPlayingRef.current) return;
    const previousMood = currentMoodRef.current;
    setMusicMood('celebration');

    setTimeout(() => {
      if (musicPlayingRef.current) {
        setMusicMood(previousMood);
      }
    }, 10000);
  }, [setMusicMood]);

  const triggerTense = useCallback(() => {
    if (!musicPlayingRef.current) return;
    const previousMood = currentMoodRef.current;
    setMusicMood('tense');

    setTimeout(() => {
      if (musicPlayingRef.current) {
        setMusicMood(previousMood);
      }
    }, 6000);
  }, [setMusicMood]);

  const setMusicVolume = useCallback((volume: number) => {
    musicVolumeRef.current = Math.max(0, Math.min(0.3, volume));
    if (musicNodesRef.current?.masterGain && audioContextRef.current) {
      musicNodesRef.current.masterGain.gain.linearRampToValueAtTime(
        musicVolumeRef.current,
        audioContextRef.current.currentTime + 0.1
      );
    }
  }, []);

  const isMusicPlaying = useCallback(() => musicPlayingRef.current, []);
  const getCurrentMood = useCallback(() => currentMoodRef.current, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);
  const getVolume = useCallback(() => volumeRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chordIntervalRef.current) {
        clearInterval(chordIntervalRef.current);
      }
      if (musicNodesRef.current) {
        musicNodesRef.current.oscillators.forEach((osc) => {
          try {
            osc.stop();
          } catch (error) {
            console.debug('Oscillator cleanup on unmount:', error);
          }
        });
        if (musicNodesRef.current.lfo) {
          try {
            musicNodesRef.current.lfo.stop();
          } catch (error) {
            console.debug('LFO cleanup on unmount:', error);
          }
        }
      }
    };
  }, []);

  const soundSystem: SoundContextType = {
    playSound,
    setEnabled,
    setVolume,
    isEnabled,
    getVolume,
    startMusic,
    stopMusic,
    setMusicVolume,
    isMusicPlaying,
    setMusicMood,
    getCurrentMood,
    updateMusicForDay,
    triggerCelebration,
    triggerTense,
  };

  return <SoundContext.Provider value={soundSystem}>{children}</SoundContext.Provider>;
}

/**
 * Hook to access the sound system
 *
 * Must be used within a SoundProvider.
 *
 * @returns Sound system methods
 * @throws Error if used outside SoundProvider
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { playSound, startMusic, updateMusicForDay } = useSound();
 *
 *   const handleClick = () => {
 *     playSound('click');
 *   };
 *
 *   useEffect(() => {
 *     startMusic('morning');
 *   }, []);
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useSound(): SoundContextType {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
