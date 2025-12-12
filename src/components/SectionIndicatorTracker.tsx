import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useScrollState } from "./ScrollContext";

interface SectionIndicatorTrackerProps {
  totalSections: number;
  onUpdate: (data: {
    blobPosition: number;
    isNearSnap: boolean;
    isSnapping: boolean;
  }) => void;
}

// Easing function for smooth liquid movement
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function SectionIndicatorTracker({
  totalSections,
  onUpdate,
}: SectionIndicatorTrackerProps) {
  const scroll = useScroll();
  const scrollState = useScrollState();
  const prevValues = useRef({ blobPosition: 0, isNearSnap: true });

  useFrame(() => {
    const scrollOffset = scroll.offset * (totalSections - 1);
    const currentSection = Math.floor(scrollOffset);
    const positionInSection = scrollOffset - currentSection;

    const threshold = 0.35; // 35% threshold - må matche ScrollSnapHandler

    let finalBlobPos = currentSection;
    let nearSnap = true;

    if (positionInSection > threshold && currentSection < totalSections - 1) {
      // Liquid movement: interpolate from current to next section
      // Map positionInSection from [0.35, 1.0] to [0, 1]
      const progress = (positionInSection - threshold) / (1 - threshold);
      const easedProgress = easeInOutCubic(progress);
      finalBlobPos = currentSection + easedProgress;
      nearSnap = false;
    }

    // Only allow isNearSnap when:
    // 1. Not currently snapping
    // 2. nearSnap is true (below threshold)
    // 3. AND we're very close to a section boundary (within 2% to avoid flickering)
    const isVeryCloseToSection =
      positionInSection < 0.02 || positionInSection > 0.98;
    const isNearSnap = scrollState.isSnapping.current
      ? false
      : nearSnap && isVeryCloseToSection;

    // Only update if values have changed significantly
    const positionChanged =
      Math.abs(prevValues.current.blobPosition - finalBlobPos) > 0.01;
    const snapStateChanged = prevValues.current.isNearSnap !== isNearSnap;

    if (positionChanged || snapStateChanged) {
      prevValues.current = { blobPosition: finalBlobPos, isNearSnap };
      onUpdate({
        blobPosition: finalBlobPos,
        isNearSnap,
        isSnapping: scrollState.isSnapping.current,
      });
    }
  });

  return null; // This component doesn't render anything
}
