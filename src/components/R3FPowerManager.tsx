import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

/**
 * Power-saving + stability manager for react-three-fiber.
 *
 * Goals:
 * - Avoid burning GPU when the page is idle / hidden.
 * - Provide a small "active window" after user interaction (scroll/mouse/key) to allow smooth animations.
 * - Handle WebGL context lost/restored (common after sleep/wake on hybrid Intel+Nvidia setups).
 *
 * Works best with <Canvas frameloop="demand" />.
 */
export type R3FPowerManagerProps = {
  /**
   * How long (ms) we keep the render loop "active" after last interaction.
   * During this window we invalidate every frame.
   */
  activeMs?: number;
  /**
   * If true, also treat pointer movement as activity. This can be noisy on some devices.
   */
  trackPointerMove?: boolean;
};

export default function R3FPowerManager({
  activeMs = 2000,
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

  // Render loop control for frameloop="demand":
  // If within active window and visible + context ok => invalidate each frame.
  useFrame(() => {
    if (document.hidden) return;
    if (isWebglContextLost) return;

    const elapsedSinceActivity = Date.now() - lastActivityAt.current;
    if (elapsedSinceActivity <= activeMs) {
      invalidate();
    }
  });

  return null;
}
