import { useRef, useEffect } from "react";
import { useScrollProgress } from "../hooks/useScrollProgress";
import type { ReactNode } from "react";

interface ScrollAnimatedSectionProps {
  children: ReactNode;
  index: number;
  totalSections: number;
  style?: React.CSSProperties;
}

export function ScrollAnimatedSection({
  children,
  index,
  totalSections,
  style = {},
}: ScrollAnimatedSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const { global: scrollOffset } = useScrollProgress();

  useEffect(() => {
    if (!ref.current) return;

    const isFirstSection = index === 0;
    const isLastSection = index === totalSections - 1;

    // Calculate section boundaries
    const sectionStart = index / totalSections;
    const sectionEnd = (index + 1) / totalSections;

    // Calculate progress within this section (0 to 1)
    const sectionProgress = Math.max(
      0,
      Math.min(1, (scrollOffset - sectionStart) / (sectionEnd - sectionStart))
    );

    // Smooth fade in/out with overlapping
    let opacity = 1;

    // Fade in timing (same for all sections)
    const fadeInEnd = 0.25;

    // Fade out timing (adjusted for first section)
    const fadeOutStart = isFirstSection ? 0.85 : 0.75;

    if (sectionProgress < fadeInEnd) {
      // Fade in: 0 → 1
      opacity = sectionProgress / fadeInEnd;
    } else if (sectionProgress > fadeOutStart && !isLastSection) {
      // Fade out: 1 → 0 (but not for last section)
      opacity = 1 - (sectionProgress - fadeOutStart) / (1 - fadeOutStart);
    } else if (isLastSection) {
      // Last section stays at full opacity once faded in
      opacity = 1;
    }

    // Apply opacity smoothly
    ref.current.style.opacity = opacity.toString();
  }, [index, totalSections, scrollOffset]);

  return (
    <section ref={ref} style={{ ...style, opacity: 0 }}>
      {children}
    </section>
  );
}
