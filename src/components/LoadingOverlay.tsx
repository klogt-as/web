import { useProgress } from "@react-three/drei";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";

// Easing function for smooth progress animation
const easeOutCubic = (t: number): number => {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
};

// localStorage key for caching
const CACHE_KEY = "klogt-assets-loaded";

/**
 * Check if assets were loaded within the cache duration
 * @param durationDays - Cache duration in days
 * @returns true if cache is valid, false otherwise
 */
const checkAssetsCached = (durationDays: number): boolean => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const { timestamp } = JSON.parse(cached);
    const cacheExpiry = timestamp + durationDays * 24 * 60 * 60 * 1000;

    return Date.now() < cacheExpiry;
  } catch {
    // If there's any error parsing cache, treat as not cached
    return false;
  }
};

/**
 * Save assets loaded timestamp to localStorage
 */
const saveAssetsLoaded = (): void => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        loaded: true,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Silently fail if localStorage is not available
  }
};

interface LoadingOverlayProps {
  /** Minimum display time in ms before the overlay can disappear */
  minDisplayTime?: number;
  /** Delay after loading completes before starting slide animation */
  slideDelay?: number;
  /** Duration of the slide animation in ms */
  slideDuration?: number;
  /** Enable/disable caching. Set to false to always show loading (default: true) */
  enableCache?: boolean;
  /** Cache duration in days when cache is enabled (default: 1 day) */
  cacheDurationDays?: number;
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
  enableCache = true,
  cacheDurationDays = 1,
  onSlideStart,
  onComplete,
}) => {
  // Check if assets are cached - if so, we'll start at 100% instead of hiding
  const isCached = enableCache && checkAssetsCached(cacheDurationDays);

  const { progress: assetProgress, active, total } = useProgress();
  const [displayedProgress, setDisplayedProgress] = useState(
    isCached ? 100 : 0
  );
  const [isVisible, setIsVisible] = useState(true);
  const [isSliding, setIsSliding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number>(0);

  // Track if we've ever seen assets being loaded (to prevent finishing purely on time)
  const hasSeenAssetsRef = useRef(false);
  if (total > 0 || active) {
    hasSeenAssetsRef.current = true;
  }

  const isAssetTracked = hasSeenAssetsRef.current;

  // Dev mode debug logging
  const DEBUG =
    typeof import.meta !== "undefined" && (import.meta as any).env?.DEV;

  // Determine if we can actually finish loading
  const canFinish = useMemo(() => {
    // If we never tracked assets, allow finishing by time only (UX fallback)
    if (!isAssetTracked) return true;

    // If we did track assets, only finish when Drei reports done
    return !active && assetProgress >= 100;
  }, [active, assetProgress, isAssetTracked]);

  // Calculate the target progress based on asset loading and minimum time
  const getTargetProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;

    // Time-based progress (smooth animation over minDisplayTime)
    const timeProgress = Math.min(100, (elapsed / minDisplayTime) * 100);

    // If we have (or have had) assets being tracked, prevent reaching 100%
    // until loading is actually done to avoid "100% then suddenly content appears"
    if (isAssetTracked) {
      const blended = Math.max(timeProgress * 0.3, assetProgress);

      // Hold at 99% until assets are actually finished
      if (!canFinish) return Math.min(99, blended);

      return 100;
    }

    // No assets tracked - use time-based progress with easing
    return Math.min(100, easeOutCubic(elapsed / minDisplayTime) * 100);
  }, [assetProgress, minDisplayTime, isAssetTracked, canFinish]);

  // Animate the displayed progress smoothly (skip if cached)
  useEffect(() => {
    // If cached, we're already at 100%, no need to animate
    if (isCached) return;

    const animate = () => {
      const target = getTargetProgress();

      setDisplayedProgress((prev) => {
        // Ensure prev is valid (never negative)
        const safePrev = Math.max(0, prev);

        // Smoothly approach target
        const diff = target - safePrev;
        const step = Math.max(0.5, Math.abs(diff) * 0.1);

        let next = safePrev;
        if (Math.abs(diff) < 0.5) {
          next = Math.round(target);
        } else {
          next = safePrev + (diff > 0 ? step : -step);
        }

        // CRITICAL: Keep progress monotonic - never go backwards!
        // This prevents the 4% -> 1% jump when asset tracking switches on
        return Math.max(safePrev, next);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [getTargetProgress, isCached]);

  // Handle completion when progress reaches 100%
  useEffect(() => {
    // If cached, trigger completion immediately (no minDisplayTime wait)
    if (isCached && displayedProgress >= 100 && !isComplete) {
      setIsComplete(true);
      return;
    }

    // Only allow completion if loading is actually done
    if (!canFinish) return;

    if (displayedProgress >= 100 && !isComplete) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      // Wait for minimum display time before marking complete
      const timer = setTimeout(() => {
        setIsComplete(true);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [displayedProgress, isComplete, minDisplayTime, canFinish, isCached]);

  // Handle the slide animation when loading is complete
  useEffect(() => {
    if (isComplete && !active) {
      // Save to cache when loading completes (if caching is enabled)
      if (enableCache) {
        saveAssetsLoaded();
      }

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
  }, [
    isComplete,
    active,
    slideDelay,
    slideDuration,
    onSlideStart,
    onComplete,
    enableCache,
  ]);

  // Optional debug logs (dev only) - helps diagnose loading issues
  useEffect(() => {
    if (!DEBUG) return;

    const rounded = Math.round(displayedProgress);

    // Log every 5% increment, plus key milestones
    if (
      rounded % 5 === 0 ||
      rounded === 1 ||
      rounded === 99 ||
      rounded === 100
    ) {
      // eslint-disable-next-line no-console
      // console.log(`[LoadingOverlay] ${rounded}%`, {
      //   displayedProgress: displayedProgress.toFixed(1),
      //   assetProgress: assetProgress.toFixed(1),
      //   active,
      //   total,
      //   isAssetTracked,
      //   canFinish,
      //   isComplete,
      //   isSliding,
      // });
    }
  }, [
    DEBUG,
    displayedProgress,
    assetProgress,
    active,
    total,
    isAssetTracked,
    canFinish,
    isComplete,
    isSliding,
  ]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const roundedProgress = Math.round(displayedProgress);
  const displayText = `${roundedProgress}`;

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
      <div key={roundedProgress} style={styles.percentageText} translate="no">
        {displayText}
      </div>
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
    fontSize: "clamp(4rem, 15vw, 6rem)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
};

export default LoadingOverlay;
