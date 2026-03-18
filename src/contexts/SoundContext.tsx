/**
 * @fileoverview Unified Sound System Provider
 *
 * Provides audio for game sounds and ambient music using both real audio files
 * and Web Audio API synthesized sounds.
 *
 * Features:
 * - Sound effects for UI, game events, and cat activities
 * - Real cat audio files for authentic cat sounds
 * - Synthesized sounds for instant UI feedback
 * - Mood-based ambient music that changes with game progression
 * - Volume controls for SFX and music independently
 * - Celebration and tense mood triggers
 *
 * @module contexts/SoundContext
 */

import React, { createContext, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import {
  SOUND_SOURCES,
  PRELOAD_SOUNDS,
  isAudioFileSound,
  type SynthSoundConfig,
} from '@/config/sounds';

import { createLogger } from '@/lib/logger';

const logger = createLogger('SoundContext');

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
  | 'tradeReceived'
  | 'catChirp'
  | 'catTrill'
  | 'catGrowl'
  | 'catYawn'
  | 'kittenMeow'
  | 'catContentPurr'
  | 'catChattering'
  | 'catStartled';

/**
 * Music mood types for ambient background music
 */
export type MusicMood = 'morning' | 'afternoon' | 'evening' | 'night' | 'celebration' | 'tense';

/**
 * Configuration for a single oscillator tone (internal use)
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

// Sound configurations are now managed in src/config/sounds.ts (SOUND_SOURCES)
// This centralizes all sound mappings for easier maintenance

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
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
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
  const hasPreloadedRef = useRef(false);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Preload critical audio files on first user interaction
  useEffect(() => {
    const preloadAudio = () => {
      if (hasPreloadedRef.current) return;
      hasPreloadedRef.current = true;

      PRELOAD_SOUNDS.forEach((path) => {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audioCacheRef.current.set(path, audio);
      });
    };

    document.addEventListener('click', preloadAudio, { once: true });
    document.addEventListener('keydown', preloadAudio, { once: true });

    return () => {
      document.removeEventListener('click', preloadAudio);
      document.removeEventListener('keydown', preloadAudio);
    };
  }, []);

  /**
   * Play an audio file with volume control
   */
  const playAudioFile = useCallback((path: string, sourceVolume: number) => {
    if (!enabledRef.current) return;

    try {
      // Clone cached audio or create new
      const cached = audioCacheRef.current.get(path);
      const audio = cached ? (cached.cloneNode() as HTMLAudioElement) : new Audio(path);

      audio.volume = sourceVolume * volumeRef.current;
      audio.play().catch(() => {
        // Silently fail if audio cannot play (e.g., autoplay policy)
      });
    } catch {
      // Silently fail if audio is not available
    }
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

  /**
   * Play a sound effect by type
   *
   * Routes to either audio file playback or synthesized sound
   * based on the SOUND_SOURCES configuration.
   */
  const playSound = useCallback(
    (type: SoundType) => {
      if (!enabledRef.current) return;

      const source = SOUND_SOURCES[type];

      if (isAudioFileSound(source)) {
        // Play real audio file
        playAudioFile(source.path, source.volume ?? 0.5);
      } else {
        // Play synthesized sound
        const config = source.config;
        if (Array.isArray(config)) {
          let delay = 0;
          config.forEach((c) => {
            playTone(c as SoundConfig, delay);
            delay += c.duration * 0.8;
          });
        } else {
          playTone(config as SoundConfig);
        }
      }
    },
    [playTone, playAudioFile]
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
          logger.debug('Oscillator cleanup:', error);
        }
      });
      if (lfo) {
        try {
          lfo.stop();
        } catch (error) {
          logger.debug('LFO cleanup:', error);
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
            logger.debug('Oscillator cleanup on unmount:', error);
          }
        });
        if (musicNodesRef.current.lfo) {
          try {
            musicNodesRef.current.lfo.stop();
          } catch (error) {
            logger.debug('LFO cleanup on unmount:', error);
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
