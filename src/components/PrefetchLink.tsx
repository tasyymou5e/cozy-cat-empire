import { Link, LinkProps } from 'react-router-dom';
import { forwardRef, useCallback, useRef } from 'react';
import { prefetchRoute } from '@/lib/routePrefetch';

interface PrefetchLinkProps extends Omit<LinkProps, 'prefetch'> {
  /** 
   * Prefetch strategy:
   * - 'hover': Prefetch when user hovers or focuses (default)
   * - 'mount': Prefetch immediately when component mounts
   * - 'none': No prefetching
   */
  prefetchStrategy?: 'hover' | 'mount' | 'none';
}

/**
 * A Link component that prefetches route chunks on hover/focus.
 * Drop-in replacement for react-router-dom's Link.
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({ to, prefetchStrategy = 'hover', onMouseEnter, onFocus, children, ...props }, ref) => {
    const hasPrefetched = useRef(false);
    const path = typeof to === 'string' ? to : to.pathname || '';

    // Prefetch on mount if requested
    if (prefetchStrategy === 'mount' && !hasPrefetched.current) {
      hasPrefetched.current = true;
      prefetchRoute(path);
    }

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (prefetchStrategy === 'hover' && !hasPrefetched.current) {
          hasPrefetched.current = true;
          prefetchRoute(path);
        }
        onMouseEnter?.(e);
      },
      [path, prefetchStrategy, onMouseEnter]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        if (prefetchStrategy === 'hover' && !hasPrefetched.current) {
          hasPrefetched.current = true;
          prefetchRoute(path);
        }
        onFocus?.(e);
      },
      [path, prefetchStrategy, onFocus]
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
