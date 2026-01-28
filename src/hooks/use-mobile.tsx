import * as React from 'react';

const MOBILE_BREAKPOINT = 640;   // Phones (< 640px)
const TABLET_BREAKPOINT = 1024;  // Tablets (640px - 1023px)

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Determines device type based on viewport width
 * @returns DeviceType - 'mobile' for phones, 'tablet' for tablets, 'desktop' for larger screens
 */
function getDeviceType(width: number): DeviceType {
  if (width < MOBILE_BREAKPOINT) return 'mobile';
  if (width < TABLET_BREAKPOINT) return 'tablet';
  return 'desktop';
}

/**
 * Hook to detect if the current viewport is mobile-sized
 * @returns boolean - true if viewport is less than 640px
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

/**
 * Hook to detect device type (mobile/tablet/desktop)
 * Useful for providing different experiences on tablets vs phones
 * 
 * @returns Object with deviceType, isMobile, isTablet, isDesktop booleans
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop } = useDeviceType();
 * 
 * // Show collapsed sidebar on tablets, full drawer on mobile
 * if (isTablet) return <CollapsedSidebar />;
 * if (isMobile) return <BottomDrawer />;
 * return <FullSidebar />;
 * ```
 */
export function useDeviceType() {
  const [deviceType, setDeviceType] = React.useState<DeviceType>(() => {
    if (typeof window !== 'undefined') {
      return getDeviceType(window.innerWidth);
    }
    return 'desktop';
  });

  React.useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType(window.innerWidth));
    };

    // Use matchMedia for both breakpoints for better performance
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const tabletQuery = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`);

    const onChange = () => handleResize();
    
    mobileQuery.addEventListener('change', onChange);
    tabletQuery.addEventListener('change', onChange);
    
    // Initial check
    handleResize();

    return () => {
      mobileQuery.removeEventListener('change', onChange);
      tabletQuery.removeEventListener('change', onChange);
    };
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };
}

// Export breakpoint constants for use in other components
export { MOBILE_BREAKPOINT, TABLET_BREAKPOINT };
