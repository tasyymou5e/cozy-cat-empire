import { Link, LinkProps } from 'react-router-dom';
import { forwardRef, useCallback, useRef } from 'react';
import { prefetchRoute } from '@/lib/routePrefetch';

interface PrefetchLinkProps extends LinkProps {
  /** 
   * Prefetch strategy:
   * - 'hover': Prefetch when user hovers or focuses (default)
   * - 'mount': Prefetch immediately when component mounts
   * - 'none': No prefetching
   */
  prefetch?: 'hover' | 'mount' | 'none';
}

/**
 * A Link component that prefetches route chunks on hover/focus.
 * Drop-in replacement for react-router-dom's Link.
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ to, prefetch = 'hover', onMouseEnter, onFocus, children, ...props }, ref) => {
    const hasPrefetched = useRef(false);
    const path = typeof to === 'string' ? to : to.pathname || '';

    // Prefetch on mount if requested
    if (prefetch === 'mount' && !hasPrefetched.current) {
      hasPrefetched.current = true;
      prefetchRoute(path);
    }

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (prefetch === 'hover' && !hasPrefetched.current) {
          hasPrefetched.current = true;
          prefetchRoute(path);
        }
        onMouseEnter?.(e);
      },
      [path, prefetch, onMouseEnter]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        if (prefetch === 'hover' && !hasPrefetched.current) {
          hasPrefetched.current = true;
          prefetchRoute(path);
        }
        onFocus?.(e);
      },
      [path, prefetch, onFocus]
    );

    return (
      <Link
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

PrefetchLink.displayName = 'PrefetchLink';
