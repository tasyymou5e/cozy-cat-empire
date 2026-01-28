import { useState, useEffect, useCallback } from 'react';

interface ParallaxOffset {
  x: number;
  y: number;
}

/**
 * Hook to create parallax effect based on mouse position
 * Returns offset values that can be applied to element transforms
 * 
 * @param enabled - Whether parallax effect is enabled
 * @param intensity - Multiplier for the effect (default 20)
 */
export function useParallax(enabled: boolean = true, intensity: number = 20): ParallaxOffset {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    
    // Calculate offset from center of screen (-0.5 to 0.5)
    const xNorm = (e.clientX / window.innerWidth) - 0.5;
    const yNorm = (e.clientY / window.innerHeight) - 0.5;
    
    // Apply intensity multiplier
    setOffset({
      x: xNorm * intensity,
      y: yNorm * (intensity * 0.5), // Less vertical movement
    });
  }, [enabled, intensity]);

  // Handle mouse leaving window - reset to center
  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, handleMouseMove, handleMouseLeave]);

  return offset;
}

export default useParallax;
