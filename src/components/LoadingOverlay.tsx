import { useProgress } from "@react-three/drei";
import { useEffect, useState, useRef, useCallback } from "react";

// Easing function for smooth progress animation
const easeOutCubic = (t: number): number => {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
};

interface LoadingOverlayProps {
  /** Minimum display time in ms before the overlay can disappear */
  minDisplayTime?: number;
  /** Delay after loading completes before starting slide animation */
  slideDelay?: number;
  /** Duration of the slide animation in ms */
  slideDuration?: number;
  /** Callback when overlay starts to slide away */
  onSlideStart?: () => void;
  /** Callback when overlay has completely disappeared */
  onComplete?: () => void;
}

/**
 * LoadingOverlay component
 *
 * Displays a full-screen black overlay with white percentage text (0-100%)
 * that tracks the loading progress of 3D assets. Once loading is complete,
 * the entire overlay slides upward to reveal the content underneath,
 * which slides in from the bottom.
 *
 * Uses a combination of actual asset loading progress from drei's useProgress
 * and simulated progress to ensure smooth visual feedback even when assets
 * load quickly or are cached.
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  minDisplayTime = 1500,
  slideDelay = 400,
  slideDuration = 800,
  onSlideStart,
  onComplete,
}) => {
  const { progress: assetProgress, active, total } = useProgress();
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number>(0);

  // Calculate the target progress based on asset loading and minimum time
  const getTargetProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;

    // Time-based progress (smooth animation over minDisplayTime)
    const timeProgress = Math.min(100, (elapsed / minDisplayTime) * 100);

    // If assets are being tracked, use real progress
    // Otherwise, use time-based progress for smooth UX
    const hasAssets = total > 0;

    if (hasAssets) {
      // Blend between time progress and asset progress
      // Asset progress takes priority when assets are loading
      return Math.min(100, Math.max(timeProgress * 0.3, assetProgress));
    }

    // No assets tracked - use time-based progress with easing
    return Math.min(100, easeOutCubic(elapsed / minDisplayTime) * 100);
  }, [assetProgress, total, minDisplayTime]);

  // Animate the displayed progress smoothly
  useEffect(() => {
    const animate = () => {
      const target = getTargetProgress();

      setDisplayedProgress((prev) => {
        // Smoothly approach target
        const diff = target - prev;
        const step = Math.max(0.5, Math.abs(diff) * 0.1);

        if (Math.abs(diff) < 0.5) {
          return Math.round(target);
        }

        return prev + (diff > 0 ? step : -step);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [getTargetProgress]);

  // Handle completion when progress reaches 100%
  useEffect(() => {
    if (displayedProgress >= 100 && !isComplete) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      // Wait for minimum display time before marking complete
      const timer = setTimeout(() => {
        setIsComplete(true);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [displayedProgress, isComplete, minDisplayTime]);

  // Handle the slide animation when loading is complete
  useEffect(() => {
    if (isComplete && !active) {
      const slideTimer = setTimeout(() => {
        setIsSliding(true);
        onSlideStart?.();

        // Remove overlay from DOM after slide animation completes
        const removeTimer = setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, slideDuration);

        return () => clearTimeout(removeTimer);
      }, slideDelay);

      return () => clearTimeout(slideTimer);
    }
  }, [isComplete, active, slideDelay, slideDuration, onSlideStart, onComplete]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const roundedProgress = Math.round(displayedProgress);

  return (
    <div
      style={{
        ...styles.container,
        transform: isSliding ? "translateY(-100%)" : "translateY(0)",
        transition: isSliding
          ? `transform ${slideDuration}ms cubic-bezier(0.65, 0, 0.35, 1)`
          : "none",
      }}
    >
      <div style={styles.percentageText}>{roundedProgress}%</div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    backgroundColor: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  percentageText: {
    color: "#ffffff",
    fontSize: "clamp(4rem, 15vw, 12rem)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    userSelect: "none",
  },
};

export default LoadingOverlay;
