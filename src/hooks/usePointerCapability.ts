import { useSyncExternalStore } from 'react';

const COARSE_QUERY = '(pointer: coarse)';

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(COARSE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(COARSE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * usePointerCapability - Detects the primary input pointer type.
 *
 * `isCoarse` is true on touch-first devices (phones, tablets) where hover
 * interactions don't exist. Use it to provide tap alternatives for
 * hover-only UI (tooltips, overlays, delete buttons).
 *
 * @example
 * ```tsx
 * const { isCoarse } = usePointerCapability();
 * <div className={isCoarse ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
 * ```
 */
export function usePointerCapability() {
  const isCoarse = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isCoarse, isFine: !isCoarse };
}
