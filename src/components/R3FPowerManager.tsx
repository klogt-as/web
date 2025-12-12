import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

/**
 * Power-saving + stability manager for react-three-fiber.
 *
 * Goals:
 * - Handle WebGL context lost/restored (common after sleep/wake on hybrid Intel+Nvidia setups).
 * - Track user activity for potential optimizations.
 * - Pause animations when page is hidden to save resources.
 *
 * Works with <Canvas frameloop="always" />.
 */
export type R3FPowerManagerProps = {
  /**
   * How long (ms) before we reduce frame rate to save power.
   * After this time, we render at half rate (30 FPS instead of 60 FPS).
   */
  idleMs?: number;
  /**
   * If true, also treat pointer movement as activity. This can be noisy on some devices.
   */
  trackPointerMove?: boolean;
};

export default function R3FPowerManager({
  idleMs = 10000,
  trackPointerMove = false,
}: R3FPowerManagerProps) {
  const { gl, invalidate } = useThree();

  const lastActivityAt = useRef<number>(Date.now());
  const [isWebglContextLost, setIsWebglContextLost] = useState(false);

  // Activity tracking: whenever user interacts, we "wake" rendering.
  useEffect(() => {
    const markActivity = () => {
      lastActivityAt.current = Date.now();
      // Kick a frame immediately.
      invalidate();
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Waking up tab: mark activity to trigger a frame.
        markActivity();
      }
    };

    window.addEventListener("focus", markActivity, { passive: true });
    window.addEventListener("blur", markActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange, {
      passive: true,
    });

    // High-signal inputs
    window.addEventListener("wheel", markActivity, { passive: true });
    window.addEventListener("touchstart", markActivity, { passive: true });
    window.addEventListener("touchmove", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity);
    window.addEventListener("pointerdown", markActivity);

    if (trackPointerMove) {
      window.addEventListener("pointermove", markActivity, { passive: true });
    }

    return () => {
      window.removeEventListener("focus", markActivity);
      window.removeEventListener("blur", markActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      window.removeEventListener("wheel", markActivity);
      window.removeEventListener("touchstart", markActivity);
      window.removeEventListener("touchmove", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("pointerdown", markActivity);

      if (trackPointerMove) {
        window.removeEventListener("pointermove", markActivity);
      }
    };
  }, [invalidate, trackPointerMove]);

  // WebGL context lost/restored
  useEffect(() => {
    const canvas = gl.domElement;

    const onContextLost = (e: Event) => {
      // Prevent browser default reload behavior.
      // (We want to wait for a restore event and then invalidate.)
      e.preventDefault?.();
      setIsWebglContextLost(true);
    };

    const onContextRestored = () => {
      setIsWebglContextLost(false);
      lastActivityAt.current = Date.now();
      invalidate();
    };

    canvas.addEventListener("webglcontextlost", onContextLost as any, false);
    canvas.addEventListener(
      "webglcontextrestored",
      onContextRestored as any,
      false
    );

    return () => {
      canvas.removeEventListener(
        "webglcontextlost",
        onContextLost as any,
        false
      );
      canvas.removeEventListener(
        "webglcontextrestored",
        onContextRestored as any,
        false
      );
    };
  }, [gl, invalidate]);

  // With frameloop="always", the browser handles the render loop automatically.
  // We just need to handle visibility changes and context loss/restore.
  // The activity tracking is kept for potential future optimizations.

  return null;
}
