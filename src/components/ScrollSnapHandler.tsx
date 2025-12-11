import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";

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
    snapDuration = 400 
}: ScrollSnapHandlerProps) {
    const scroll = useScroll();
    const lastScrollTime = useRef(Date.now());
    const lastOffset = useRef(0);
    const velocityHistory = useRef<number[]>([]);
    
    // Snap animation state
    const isSnapping = useRef(false);
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
            isSnapping.current = false;
        };

        el.addEventListener('wheel', handleUserScroll, { passive: true });
        el.addEventListener('touchstart', handleUserScroll, { passive: true });
        el.addEventListener('touchmove', handleUserScroll, { passive: true });

        return () => {
            el.removeEventListener('wheel', handleUserScroll);
            el.removeEventListener('touchstart', handleUserScroll);
            el.removeEventListener('touchmove', handleUserScroll);
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
        if (isSnapping.current) {
            const elapsed = now - snapStartTime.current;
            const progress = Math.min(elapsed / snapDuration, 1);
            const easedProgress = easeOutCubic(progress);
            
            // snapStartOffset and snapTargetOffset are in "section units" (e.g., 0.44 means 44% into section 0)
            // Convert to scrollTop using viewportHeight
            const startScrollTop = snapStartOffset.current * snapViewportHeight.current;
            const targetScrollTop = snapTargetOffset.current * snapViewportHeight.current;
            const newScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easedProgress;
            
            // Use scrollTo with instant behavior to bypass smooth scrolling
            scroll.el.scrollTo({ top: newScrollTop, behavior: 'instant' as ScrollBehavior });
            
            if (progress >= 1) {
                // Snap complete - ensure exact position
                scroll.el.scrollTo({ top: targetScrollTop, behavior: 'instant' as ScrollBehavior });
                isSnapping.current = false;
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
        const avgVelocity = velocityHistory.current.reduce((a, b) => a + b, 0) / 
            velocityHistory.current.length;
        
        const timeSinceLastScroll = now - lastScrollTime.current;
        
        // Detect when scroll has settled (damping finished):
        // - User hasn't scrolled recently (300ms)
        // - Average velocity is very low (damping has settled)
        const hasSettled = timeSinceLastScroll > 300 && avgVelocity < 0.0001;
        
        if (hasSettled && !isSnapping.current) {
            // Calculate current section based on scroll position using dynamic sectionHeight
            const currentScrollTop = scroll.el.scrollTop;
            const currentSection = Math.floor(currentScrollTop / sectionHeight);
            const positionInSection = (currentScrollTop % sectionHeight) / sectionHeight;
            
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
                isSnapping.current = true;
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
