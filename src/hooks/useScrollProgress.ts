import { useState, useEffect, type RefObject } from "react";
import { useScrollbar } from "@14islands/r3f-scroll-rig";

interface ScrollProgress {
  global: number;
  section: number;
}

/**
 * React hook that returns reactive scroll progress
 * Uses r3f-scroll-rig's useScrollbar to listen to scroll events
 *
 * @param sectionRef - Optional ref to a section element for section-specific progress
 * @returns Object with global and section progress (0-1)
 */
export function useScrollProgress(
  sectionRef?: RefObject<HTMLElement | null>
): ScrollProgress {
  const [globalProgress, setGlobalProgress] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);
  const { onScroll } = useScrollbar();

  useEffect(() => {
    const unsubscribe = onScroll((scrollData) => {
      // Always update global progress
      setGlobalProgress(scrollData.progress);

      // Update section progress if ref provided
      if (sectionRef?.current) {
        const section = sectionRef.current;
        const rect = section.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const scrollY = scrollData.scroll;
        const sectionTop = rect.top + scrollY;
        const sectionHeight = rect.height;

        // Calculate: 0 = entering viewport, 1 = leaving viewport
        const progress =
          (scrollY - sectionTop + windowHeight) /
          (sectionHeight + windowHeight);

        setSectionProgress(Math.max(0, Math.min(1, progress)));
      } else {
        // If no ref, section progress = global progress
        setSectionProgress(scrollData.progress);
      }
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [onScroll, sectionRef]);

  return { global: globalProgress, section: sectionProgress };
}
