import { useCallback, useRef, useEffect } from 'react';

type SoundType = 
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
  | 'nextDay';

interface SoundConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  ramp?: 'up' | 'down' | 'none';
  harmonics?: number[];
}

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
};

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);
  const volumeRef = useRef(0.5);

  // Initialize audio context on first user interaction
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

    // Add harmonics if specified
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
        delay += c.duration * 0.8; // Slight overlap for smoother sound
      });
    } else {
      playTone(config);
    }
  }, [playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  const setVolume = useCallback((volume: number) => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
  }, []);

  const isEnabled = useCallback(() => enabledRef.current, []);
  const getVolume = useCallback(() => volumeRef.current, []);

  return {
    playSound,
    setEnabled,
    setVolume,
    isEnabled,
    getVolume,
  };
}

export type { SoundType };
