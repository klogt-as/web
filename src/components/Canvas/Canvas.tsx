import { Canvas, type Frameloop } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { AdaptiveDpr } from "@react-three/drei";
import WebGPUCapabilities from "three/examples/jsm/capabilities/WebGPU.js";
import { WebGPURenderer } from "three/webgpu";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { ReactNode } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";

interface WebGPUCanvasProps {
  webglFallback?: boolean;
  frameloop?: "always" | "never" | "demand";
  children?: ReactNode;
  debug?: boolean;
  [key: string]: any;
}

const WebGPUCanvas = ({
  webglFallback = true,
  frameloop = "always",
  children,
  debug,
  ...props
}: WebGPUCanvasProps) => {
  const [canvasFrameloop, setCanvasFrameloop] = useState<Frameloop>("never");
  const [initialising, setInitialising] = useState(true);
  const isMobile = useIsMobile(); // Use hook to detect mobile devices

  useEffect(() => {
    if (initialising) return;

    setCanvasFrameloop(frameloop);
  }, [initialising, frameloop]);

  const webGPUAvailable = WebGPUCapabilities.isAvailable();

  return (
    <Canvas
      {...props}
      id="gl"
      frameloop={canvasFrameloop}
      dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower pixel ratio on mobile for better performance
      gl={(canvas) => {
        const renderer = new WebGPURenderer({
          canvas: canvas.canvas as HTMLCanvasElement,
          antialias: !isMobile, // Disable antialiasing on mobile for performance
          alpha: true,
          forceWebGL: !webGPUAvailable,
        });
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.outputColorSpace = SRGBColorSpace;

        // Set pixel ratio based on device
        const pixelRatio = isMobile
          ? Math.min(window.devicePixelRatio, 1.5)
          : Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pixelRatio);

        renderer.init().then(() => {
          setInitialising(false);
        });

        return renderer;
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none", // Prevent touch scrolling on canvas
      }}
    >
      <AdaptiveDpr pixelated={isMobile} />
      {children}
    </Canvas>
  );
};

export default WebGPUCanvas;
