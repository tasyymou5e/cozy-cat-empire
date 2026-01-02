import React, { createContext, useContext, ReactNode } from 'react';
import { useSoundEffects, SoundType } from '@/hooks/useSoundEffects';

interface SoundContextType {
  playSound: (type: SoundType) => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  isEnabled: () => boolean;
  getVolume: () => number;
  startMusic: () => void;
  stopMusic: () => void;
  setMusicVolume: (volume: number) => void;
  isMusicPlaying: () => boolean;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const soundSystem = useSoundEffects();
  return (
    <SoundContext.Provider value={soundSystem}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
