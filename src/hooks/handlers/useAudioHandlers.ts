/**
 * @fileoverview Audio control handlers for CatFarm
 * 
 * Manages sound effects and music playback, volume controls,
 * and mood-based music updates.
 * 
 * @module hooks/handlers/useAudioHandlers
 */

import { useCallback, useEffect } from 'react';
import { MOOD_LABELS } from '@/constants/moods';
import type { CatFarmState } from '../useCatFarmState';

interface AudioHandlersDeps {
  farmState: CatFarmState;
}

/**
 * Hook providing audio control handlers and effects
 */
export function useAudioHandlers({ farmState }: AudioHandlersDeps) {
  const { sound, state, message, confetti, ui } = farmState;

  const { playSound } = sound;
  const { fireCelebration } = confetti;

  // Update music mood when day changes
  useEffect(() => {
    if (ui.musicOn) {
      sound.updateMusicForDay(state.day);
      ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]);
    }
  }, [state.day, ui.musicOn, sound, ui]);

  // Fire confetti on achievements
  useEffect(() => {
    const unlockedCount = state.achievements.filter(a => a.unlocked).length;
    if (unlockedCount > ui.lastAchievementCount && ui.lastAchievementCount > 0) {
      confetti.fireStars();
      if (ui.musicOn) {
        sound.triggerCelebration();
        ui.setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(
          () => ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]),
          10000
        );
      }
    }
    ui.setLastAchievementCount(unlockedCount);
  }, [state.achievements, ui, confetti, sound]);

  // Fire confetti on show wins
  useEffect(() => {
    if (message?.includes('wins!') && message?.includes('Cat show')) {
      fireCelebration();
      if (ui.musicOn) {
        sound.triggerCelebration();
        ui.setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(
          () => ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]),
          10000
        );
      }
    }
  }, [message, fireCelebration, ui, sound]);

  // Trigger tense mood on negative events
  useEffect(() => {
    if (
      ui.musicOn &&
      (message?.includes('fight') ||
        message?.includes('sick') ||
        message?.includes('ran away') ||
        message?.includes('passed away'))
    ) {
      sound.triggerTense();
      ui.setCurrentMoodLabel(MOOD_LABELS.tense);
      setTimeout(
        () => ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]),
        6000
      );
    }
  }, [message, ui.musicOn, sound, ui]);

  const toggleSound = useCallback(() => {
    const newState = !ui.soundOn;
    ui.setSoundOn(newState);
    sound.setEnabled(newState);
    if (newState) playSound('click');
  }, [ui, sound, playSound]);

  const toggleMusic = useCallback(() => {
    if (ui.musicOn) {
      sound.stopMusic();
      ui.setMusicOn(false);
      ui.setCurrentMoodLabel('');
    } else {
      sound.startMusic();
      ui.setMusicOn(true);
      sound.updateMusicForDay(state.day);
      ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]);
      playSound('click');
    }
  }, [ui, sound, state.day, playSound]);

  const handleSfxVolumeChange = useCallback(
    (value: number[]) => {
      const vol = value[0];
      ui.setSfxVolume(vol);
      sound.setVolume(vol / 100);
    },
    [ui, sound]
  );

  const handleMusicVolumeChange = useCallback(
    (value: number[]) => {
      const vol = value[0];
      ui.setMusicVolume(vol);
      sound.setMusicVolume((vol / 100) * 0.3);
    },
    [ui, sound]
  );

  return {
    toggleSound,
    toggleMusic,
    handleSfxVolumeChange,
    handleMusicVolumeChange,
  };
}
