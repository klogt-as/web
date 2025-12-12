import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { useScrollState } from "./ScrollContext";

interface ScrollSnapHandlerProps {
  pages: number;
  threshold?: number; // Position threshold to snap to next section (0-1), default 0.35 (35%)
  snapDuration?: number; // Duration of snap animation in ms, default 400
}

// Easing function for smooth snap animation (ease-out cubic)
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function ScrollSnapHandler({
  pages,
  threshold = 0.35, // 35% threshold - beyond this snaps to next
  snapDuration = 400,
}: ScrollSnapHandlerProps) {
  const scroll = useScroll();
  const scrollState = useScrollState();
  const lastScrollTime = useRef(Date.now());
  const lastOffset = useRef(0);
  const velocityHistory = useRef<number[]>([]);

  // Snap animation state (local refs)
  const snapStartTime = useRef(0);
  const snapStartOffset = useRef(0);
  const snapTargetOffset = useRef(0);
  const snapViewportHeight = useRef(0);

  useEffect(() => {
    const el = scroll.el;
    if (!el) return;

    const handleUserScroll = () => {
      lastScrollTime.current = Date.now();
      // Cancel ongoing snap if user starts scrolling
      scrollState.isSnapping.current = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Detect if user is clicking on the scrollbar
      // Scrollbar is on the right side of the element
      const target = e.target as HTMLElement;
      const rect = el.getBoundingClientRect();
      const scrollbarWidth = el.offsetWidth - el.clientWidth;

      // Check if click is in scrollbar area (right edge)
      if (scrollbarWidth > 0 && e.clientX >= rect.right - scrollbarWidth) {
        scrollState.isDraggingScrollbar.current = true;
        scrollState.isSnapping.current = false;
        lastScrollTime.current = Date.now();
      }
    };

    const handleMouseUp = () => {
      if (scrollState.isDraggingScrollbar.current) {
        scrollState.isDraggingScrollbar.current = false;
        // Reset timer so snap logic can engage after release
        lastScrollTime.current = Date.now();
      }
    };

    const handleMouseLeave = () => {
      // If mouse leaves window while dragging, treat as release
      if (scrollState.isDraggingScrollbar.current) {
        scrollState.isDraggingScrollbar.current = false;
        lastScrollTime.current = Date.now();
      }
    };

    el.addEventListener("wheel", handleUserScroll, { passive: true });
    el.addEventListener("touchstart", handleUserScroll, { passive: true });
    el.addEventListener("touchmove", handleUserScroll, { passive: true });
    el.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("wheel", handleUserScroll);
      el.removeEventListener("touchstart", handleUserScroll);
      el.removeEventListener("touchmove", handleUserScroll);
      el.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [scroll.el]);

  useFrame(() => {
    if (!scroll.el) return;

    const currentOffset = scroll.offset;
    const now = Date.now();
    const viewportHeight = scroll.el.clientHeight;

    // Calculate section height dynamically based on drei's scroll system
    // drei uses maxScroll = scrollHeight - clientHeight
    const maxScroll = scroll.el.scrollHeight - scroll.el.clientHeight;
    const sectionHeight = maxScroll / (pages - 1);

    // If currently snapping, continue the animation
    if (scrollState.isSnapping.current) {
      const elapsed = now - snapStartTime.current;
      const progress = Math.min(elapsed / snapDuration, 1);
      const easedProgress = easeOutCubic(progress);

      // snapStartOffset and snapTargetOffset are in "section units" (e.g., 0.44 means 44% into section 0)
      // Convert to scrollTop using viewportHeight
      const startScrollTop =
        snapStartOffset.current * snapViewportHeight.current;
      const targetScrollTop =
        snapTargetOffset.current * snapViewportHeight.current;
      const newScrollTop =
        startScrollTop + (targetScrollTop - startScrollTop) * easedProgress;

      // Use scrollTo with instant behavior to bypass smooth scrolling
      scroll.el.scrollTo({
        top: newScrollTop,
        behavior: "instant" as ScrollBehavior,
      });

      if (progress >= 1) {
        // Snap complete - ensure exact position
        scroll.el.scrollTo({
          top: targetScrollTop,
          behavior: "instant" as ScrollBehavior,
        });
        scrollState.isSnapping.current = false;
        scrollState.snapProgress.current = 0;
      } else {
        scrollState.snapProgress.current = easedProgress;
      }
      return;
    }

    // Track velocity to detect when damping has settled
    const velocity = Math.abs(currentOffset - lastOffset.current);
    velocityHistory.current.push(velocity);
    if (velocityHistory.current.length > 10) {
      velocityHistory.current.shift();
    }

    // Calculate average velocity over recent frames
    const avgVelocity =
      velocityHistory.current.reduce((a, b) => a + b, 0) /
      velocityHistory.current.length;

    const timeSinceLastScroll = now - lastScrollTime.current;

    // Detect when scroll has settled (damping finished):
    // - User hasn't scrolled recently (300ms)
    // - Average velocity is very low (damping has settled)
    // - User is not dragging the scrollbar
    const hasSettled =
      timeSinceLastScroll > 300 &&
      avgVelocity < 0.0001 &&
      !scrollState.isDraggingScrollbar.current;

    if (hasSettled && !scrollState.isSnapping.current) {
      // Calculate current section based on scroll position using dynamic sectionHeight
      const currentScrollTop = scroll.el.scrollTop;
      const currentSection = Math.floor(currentScrollTop / sectionHeight);
      const positionInSection =
        (currentScrollTop % sectionHeight) / sectionHeight;

      // Clamp to valid section range
      const clampedSection = Math.max(0, Math.min(currentSection, pages - 1));

      let targetSection: number;

      // THRESHOLD LOGIC:
      // Below threshold → snap back to current section start
      // Above threshold → snap forward to next section start
      if (positionInSection < threshold) {
        targetSection = clampedSection;
      } else {
        targetSection = Math.min(clampedSection + 1, pages - 1);
      }

      // Calculate target using dynamic sectionHeight
      const targetScrollTop = targetSection * sectionHeight;
      if (Math.abs(targetScrollTop - currentScrollTop) > 1) {
        // Start snap animation
        scrollState.isSnapping.current = true;
        scrollState.snapTargetSection.current = targetSection;
        snapStartTime.current = now;
        snapStartOffset.current = currentSection + positionInSection; // Store as section units
        snapTargetOffset.current = targetSection; // Target section number
        snapViewportHeight.current = sectionHeight; // Store sectionHeight for consistent animation
      }
    }

    lastOffset.current = currentOffset;
  });

  return null;
}
