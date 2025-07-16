import { useState, useEffect } from 'react';

interface BreakpointHook {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
} as const;

export const useBreakpoint = (): BreakpointHook => {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    // Add event listener with passive option for better performance
    window.addEventListener('resize', handleResize, { passive: true });

    // Handle orientation change on mobile devices
    window.addEventListener('orientationchange', () => {
      // Delay to ensure the viewport has updated
      setTimeout(handleResize, 100);
    }, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = screenWidth < BREAKPOINTS.mobile;
  const isTablet = screenWidth >= BREAKPOINTS.mobile && screenWidth < BREAKPOINTS.desktop;
  const isDesktop = screenWidth >= BREAKPOINTS.desktop;

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth
  };
};