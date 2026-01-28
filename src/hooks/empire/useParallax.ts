import { useState, useEffect, useCallback, useRef } from 'react';

export interface ParallaxOffset {
  x: number;
  y: number;
}

/**
 * Hook to create parallax effect based on mouse position
 * Returns offset values that can be applied to element transforms
 * 
 * @param enabled - Whether parallax effect is enabled
 * @param intensity - Multiplier for the effect (default 30)
 * @param smoothing - Transition smoothness factor (default 0.08)
 */
export function useParallax(
  enabled: boolean = true, 
  intensity: number = 30,
  smoothing: number = 0.08
): ParallaxOffset {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });
  const targetRef = useRef<ParallaxOffset>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  // Smooth animation loop for fluid parallax
  const animate = useCallback(() => {
    setOffset(current => {
      const dx = targetRef.current.x - current.x;
      const dy = targetRef.current.y - current.y;
      
      // Stop animating if close enough
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        return targetRef.current;
      }
      
      return {
        x: current.x + dx * smoothing,
        y: current.y + dy * smoothing,
      };
    });
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [smoothing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    
    // Calculate offset from center of screen (-0.5 to 0.5)
    const xNorm = (e.clientX / window.innerWidth) - 0.5;
    const yNorm = (e.clientY / window.innerHeight) - 0.5;
    
    // Apply intensity multiplier
    targetRef.current = {
      x: xNorm * intensity,
      y: yNorm * (intensity * 0.6), // Less vertical movement
    };
  }, [enabled, intensity]);

  // Handle mouse leaving window - smoothly return to center
  const handleMouseLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    if (!enabled) {
      targetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
      return;
    }

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, handleMouseMove, handleMouseLeave, animate]);

  return offset;
}

export default useParallax;
