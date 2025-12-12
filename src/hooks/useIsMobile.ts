import { useState, useEffect } from "react";

/**
 * Custom hook to detect if the screen width is mobile size (≤768px)
 * Updates automatically on window resize with debouncing for better performance
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check - use matchMedia for better performance
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const checkMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    // Check on mount
    checkMobile();

    // Use matchMedia change event instead of resize for better performance
    // This avoids forced reflows from repeatedly reading window.innerWidth
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Modern browsers support addEventListener, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // @ts-ignore - legacy support
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // @ts-ignore - legacy support
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [breakpoint]);

  return isMobile;
};
