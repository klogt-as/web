import { useState, useEffect } from "react";
import { useLenis } from "@studio-freight/react-lenis";
import { useIsMobile } from "./useIsMobile";

/**
 * Hybrid scroll progress hook
 * - Desktop: Uses Lenis smooth scrolling
 * - Mobile: Uses native scroll for better performance
 * Returns scroll progress from 0 to 1
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);
  const isMobile = useIsMobile();

  // Desktop: Use Lenis smooth scrolling
  useLenis((lenis) => {
    if (!isMobile) {
      setProgress(lenis.progress || 0);
    }
  });

  // Mobile: Use native scroll events
  useEffect(() => {
    if (!isMobile) return;

    const updateProgress = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress =
        scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setProgress(currentProgress);
    };

    // Initial calculation
    updateProgress();

    // Update on scroll
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [isMobile]);

  return progress;
}
