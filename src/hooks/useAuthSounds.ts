import { useCallback, useRef } from 'react';

type CatSoundType = 'tabby' | 'gray' | 'white' | 'calico';

export function useAuthSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);
  const cooldownMs = 500; // Prevent sound spam

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playMeow = useCallback((pitch: number = 1) => {
    const now = Date.now();
    if (now - lastPlayedRef.current < cooldownMs) return;
    lastPlayedRef.current = now;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Meow sound: frequency sweep from high to low
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600 * pitch, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400 * pitch, ctx.currentTime + 0.15);
      oscillator.frequency.exponentialRampToValueAtTime(350 * pitch, ctx.currentTime + 0.25);

      // Volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Silently fail if audio context not available
    }
  }, [getAudioContext]);

  const playPurr = useCallback(() => {
    const now = Date.now();
    if (now - lastPlayedRef.current < cooldownMs) return;
    lastPlayedRef.current = now;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // LFO for rumble effect
      lfo.frequency.setValueAtTime(25, ctx.currentTime);
      lfoGain.gain.setValueAtTime(10, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(80, ctx.currentTime);

      // Gentle purr envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime + 0.3);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

      lfo.start(ctx.currentTime);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
      lfo.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Silently fail if audio context not available
    }
  }, [getAudioContext]);

  const playSleepyMurmur = useCallback(() => {
    const now = Date.now();
    if (now - lastPlayedRef.current < cooldownMs) return;
    lastPlayedRef.current = now;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Silently fail if audio context not available
    }
  }, [getAudioContext]);

  const playCatSound = useCallback((type: CatSoundType) => {
    switch (type) {
      case 'tabby':
        playMeow(1);
        break;
      case 'gray':
        playPurr();
        break;
      case 'white':
        playMeow(1.3); // Higher pitch "nya"
        break;
      case 'calico':
        playSleepyMurmur();
        break;
    }
  }, [playMeow, playPurr, playSleepyMurmur]);

  return { playCatSound };
}
