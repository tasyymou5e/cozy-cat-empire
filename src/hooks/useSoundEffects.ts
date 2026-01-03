import { useCallback, useRef, useEffect } from 'react';

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
  | 'giftReceived'
  | 'tradeReceived';

type MusicMood = 'morning' | 'afternoon' | 'evening' | 'night' | 'celebration' | 'tense';

interface SoundConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  ramp?: 'up' | 'down' | 'none';
  harmonics?: number[];
}

// Chord progressions for different moods (frequencies in Hz)
const MUSIC_MOODS: Record<MusicMood, { chords: number[][]; tempo: number; brightness: number }> = {
  morning: {
    // C major 7 - bright and fresh
    chords: [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [164.81, 196.00, 246.94, 293.66], // Em7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
    ],
    tempo: 0.08,
    brightness: 1.2,
  },
  afternoon: {
    // G major progression - warm and active
    chords: [
      [98.00, 123.47, 146.83, 185.00],  // G
      [110.00, 138.59, 164.81, 207.65], // Am
      [123.47, 155.56, 185.00, 233.08], // Bm
      [130.81, 164.81, 196.00, 246.94], // C
    ],
    tempo: 0.1,
    brightness: 1.0,
  },
  evening: {
    // F major 7 progression - mellow sunset
    chords: [
      [87.31, 110.00, 130.81, 164.81],  // Fmaj7
      [98.00, 123.47, 146.83, 185.00],  // G7
      [110.00, 130.81, 164.81, 196.00], // Am7
      [116.54, 146.83, 174.61, 220.00], // Bb
    ],
    tempo: 0.06,
    brightness: 0.8,
  },
  night: {
    // Am progression - peaceful and dreamy
    chords: [
      [110.00, 130.81, 164.81, 207.65], // Am7
      [98.00, 123.47, 146.83, 185.00],  // G
      [87.31, 110.00, 130.81, 164.81],  // Fmaj7
      [82.41, 103.83, 123.47, 155.56],  // Em
    ],
    tempo: 0.04,
    brightness: 0.6,
  },
  celebration: {
    // Bright major progression - joyful!
    chords: [
      [130.81, 164.81, 196.00, 261.63], // C
      [146.83, 185.00, 220.00, 293.66], // D
      [164.81, 207.65, 246.94, 329.63], // E
      [174.61, 220.00, 261.63, 349.23], // F
    ],
    tempo: 0.15,
    brightness: 1.5,
  },
  tense: {
    // Minor/diminished - something's happening
    chords: [
      [110.00, 130.81, 155.56, 185.00], // Am dim
      [103.83, 123.47, 146.83, 174.61], // G#dim
      [98.00, 116.54, 138.59, 164.81],  // Gm
      [92.50, 110.00, 130.81, 155.56],  // F#dim
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
  // Cat activity sounds - subtle and cozy
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
  // Gift and trade notification sounds
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

// Get mood based on game day (simulates time of day cycle)
function getMoodForDay(day: number): MusicMood {
  const timeOfDay = day % 4;
  switch (timeOfDay) {
    case 0: return 'morning';
    case 1: return 'afternoon';
    case 2: return 'evening';
    case 3: return 'night';
    default: return 'afternoon';
  }
}

export function useSoundEffects() {
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

  const playTone = useCallback((config: SoundConfig, delay: number = 0) => {
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
      config.harmonics.forEach(harmFreq => {
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
  }, [initAudio]);

  const playSound = useCallback((type: SoundType) => {
    const config = SOUND_CONFIGS[type];
    
    if (Array.isArray(config)) {
      let delay = 0;
      config.forEach(c => {
        playTone(c, delay);
        delay += c.duration * 0.8;
      });
    } else {
      playTone(config);
    }
  }, [playTone]);

  // Transition to a new chord smoothly
  const transitionToChord = useCallback((frequencies: number[], brightness: number) => {
    if (!musicNodesRef.current || !audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const { oscillators, gains } = musicNodesRef.current;
    
    frequencies.forEach((freq, i) => {
      if (oscillators[i] && gains[i]) {
        // Smooth frequency transition
        oscillators[i].frequency.linearRampToValueAtTime(freq * brightness, ctx.currentTime + 2);
        // Slight volume swell during transition
        gains[i].gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1);
        gains[i].gain.linearRampToValueAtTime(0.12 + (i * 0.02), ctx.currentTime + 2);
      }
    });
  }, []);

  // Start chord progression cycling
  const startChordProgression = useCallback(() => {
    if (chordIntervalRef.current) return;
    
    const cycleChord = () => {
      const mood = MUSIC_MOODS[currentMoodRef.current];
      currentChordIndexRef.current = (currentChordIndexRef.current + 1) % mood.chords.length;
      transitionToChord(mood.chords[currentChordIndexRef.current], mood.brightness);
    };
    
    // Change chord every 8 seconds
    chordIntervalRef.current = window.setInterval(cycleChord, 8000);
  }, [transitionToChord]);

  const startMusic = useCallback((mood: MusicMood = 'afternoon') => {
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

    // Start with first chord of the mood
    const firstChord = moodConfig.chords[0];
    
    firstChord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * moodConfig.brightness, ctx.currentTime);
      osc.detune.setValueAtTime((i - 1.5) * 5, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.12 + (i * 0.02), ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      
      oscillators.push(osc);
      gains.push(gain);
    });

    // LFO for gentle movement
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
  }, [initAudio, startChordProgression]);

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
      oscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      if (lfo) {
        try { lfo.stop(); } catch (e) {}
      }
      musicNodesRef.current = null;
      musicPlayingRef.current = false;
    }, 1100);
  }, []);

  // Change music mood (smooth transition)
  const setMusicMood = useCallback((mood: MusicMood) => {
    if (!musicPlayingRef.current || !musicNodesRef.current || !audioContextRef.current) return;
    
    currentMoodRef.current = mood;
    currentChordIndexRef.current = 0;
    
    const moodConfig = MUSIC_MOODS[mood];
    const ctx = audioContextRef.current;
    
    // Update LFO tempo
    if (musicNodesRef.current.lfo) {
      musicNodesRef.current.lfo.frequency.linearRampToValueAtTime(moodConfig.tempo, ctx.currentTime + 1);
    }
    
    // Transition to first chord of new mood
    transitionToChord(moodConfig.chords[0], moodConfig.brightness);
  }, [transitionToChord]);

  // Update music based on game day
  const updateMusicForDay = useCallback((day: number) => {
    if (!musicPlayingRef.current) return;
    const newMood = getMoodForDay(day);
    if (newMood !== currentMoodRef.current) {
      setMusicMood(newMood);
    }
  }, [setMusicMood]);

  // Trigger celebration mood temporarily
  const triggerCelebration = useCallback(() => {
    if (!musicPlayingRef.current) return;
    const previousMood = currentMoodRef.current;
    setMusicMood('celebration');
    
    // Return to previous mood after 10 seconds
    setTimeout(() => {
      if (musicPlayingRef.current) {
        setMusicMood(previousMood);
      }
    }, 10000);
  }, [setMusicMood]);

  // Trigger tense mood temporarily
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

  useEffect(() => {
    return () => {
      if (chordIntervalRef.current) {
        clearInterval(chordIntervalRef.current);
      }
      if (musicNodesRef.current) {
        musicNodesRef.current.oscillators.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
        if (musicNodesRef.current.lfo) {
          try { musicNodesRef.current.lfo.stop(); } catch (e) {}
        }
      }
    };
  }, []);

  return {
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
}

export type { MusicMood };
