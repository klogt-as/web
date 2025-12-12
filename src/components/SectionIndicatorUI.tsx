import { useRef, useLayoutEffect, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";

// Design constants for indicator sizing
const DOT_SIZE = 8; // px
const DOT_GAP = 36; // px - gap between dots
const CONTAINER_PADDING = 16; // px

interface SectionIndicatorUIProps {
  totalSections: number;
  blobPosition: number;
  isNearSnap: boolean;
  isSnapping?: boolean;
}

export function SectionIndicatorUI({
  totalSections,
  blobPosition,
  isNearSnap,
  isSnapping = false,
}: SectionIndicatorUIProps) {
  const isMobile = useIsMobile();
  const [measuredDotSpacing, setMeasuredDotSpacing] = useState(DOT_GAP);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure actual DOM spacing between dots
  useLayoutEffect(() => {
    if (!containerRef.current || totalSections < 2) return;

    const dots = containerRef.current.querySelectorAll("[data-dot]");
    if (dots.length < 2) return;

    // Measure spacing between first two dots to get exact distance
    const firstDot = dots[0].getBoundingClientRect();
    const secondDot = dots[1].getBoundingClientRect();

    // Calculate center-to-center distance between adjacent dots
    const firstCenter = firstDot.top + firstDot.height / 2;
    const secondCenter = secondDot.top + secondDot.height / 2;
    const spacing = secondCenter - firstCenter;

    setMeasuredDotSpacing(spacing);
  }, [totalSections]);

  // Calculate translateY for the blob using measured spacing
  const translateY = blobPosition * measuredDotSpacing;

  if (isMobile) {
    return null;
  }

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Background dots */}
      {Array.from({ length: totalSections }).map((_, index) => (
        <div key={index} data-dot style={styles.dot} />
      ))}

      {/* Animated liquid blob */}
      <div
        style={{
          ...styles.blob,
          transform: `translateY(${translateY}px)`,
          opacity: isNearSnap ? 1 : 0.85,
          filter: isNearSnap ? "blur(0.5px)" : "blur(1.5px)",
          // Disable transitions during snap to prevent blob from moving ahead of scroll
          transition: isSnapping
            ? "opacity 0.4s ease, filter 0.4s ease"
            : "transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1), opacity 0.4s ease, filter 0.4s ease",
        }}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    left: "32px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    gap: `${DOT_GAP}px`,
    padding: `${CONTAINER_PADDING}px 12px`,
    background: "rgb(5, 6, 8)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    pointerEvents: "none",
  },
  dot: {
    width: `${DOT_SIZE}px`,
    height: `${DOT_SIZE}px`,
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  blob: {
    position: "absolute",
    width: `${DOT_SIZE + 2}px`,
    height: `${DOT_SIZE + 2}px`,
    borderRadius: "50%",
    background: "white",
    filter: "blur(1px)",
    boxShadow: "0 0 12px rgba(255, 255, 255, 0.6)",
    // Center blob on first dot: padding + (dot_size - blob_size) / 2
    top: `${CONTAINER_PADDING + (DOT_SIZE - (DOT_SIZE + 2)) / 2}px`,
    // Center blob horizontally: left_padding + (dot_size - blob_size) / 2
    left: `${12 + (DOT_SIZE - (DOT_SIZE + 2)) / 2}px`,
    // Sync timing with ScrollSnapHandler's snapDuration (400ms) and use ease-out-cubic
    transition:
      "transform 0.4s cubic-bezier(0.215, 0.61, 0.355, 1), opacity 0.4s ease, filter 0.4s ease",
    pointerEvents: "none",
  },
};
