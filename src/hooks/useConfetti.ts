import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const fireConfetti = useCallback(() => {
    // Fire confetti from the left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'],
    });

    // Fire confetti from the right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'],
    });
  }, []);

  const fireCelebration = useCallback(() => {
    // Big celebration burst
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 50,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2,
        },
        colors: ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#fbbf24'],
      });
    }, 250);
  }, []);

  const fireStars = useCallback(() => {
    // Star-shaped confetti for achievements
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: 20,
      shapes: ['star'] as confetti.Shape[],
      colors: ['#ffd700', '#ffb347', '#ff6961', '#77dd77', '#aec6cf'],
    };

    confetti({
      ...defaults,
      particleCount: 30,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.5 },
    });

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 20,
        scalar: 0.8,
        origin: { x: 0.3, y: 0.4 },
      });
    }, 150);

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 20,
        scalar: 0.8,
        origin: { x: 0.7, y: 0.4 },
      });
    }, 300);
  }, []);

  const fireChallengeBurst = useCallback(() => {
    // Burst from center with trophy-colored particles
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#eab308', '#84cc16', '#22c55e'],
      shapes: ['circle', 'square'],
      scalar: 1.2,
    });

    // Delayed second burst for extra impact
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 60,
        startVelocity: 25,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#ffd700', '#fff', '#f97316'],
      });
    }, 150);
  }, []);

  return {
    fireConfetti,
    fireCelebration,
    fireStars,
    fireChallengeBurst,
  };
}
