import { useFBO } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import { isMobile } from "../utils";
import { useIsMobile } from "../hooks/useIsMobile";
import FloatingImage from "./FloatingImage";
import FloatingBlob, { getBlobsForSection } from "./FloatingBlob";

interface SectionData {
  id: string;
  label: string;
  title: string;
  text: string;
  image: { src: string };
  accent: string;
  verticalAlign?: "top" | "center" | "bottom";
}

interface LandingSceneProps {
  sections: SectionData[];
}

const LandingScene: React.FC<LandingSceneProps> = ({ sections }) => {
  const { viewport } = useThree();
  const isMobileScreen = useIsMobile();

  // Høyden til én "side" i ScrollControls == 100vh i world units
  const pageHeight = viewport.height;

  /**
   * IMPORTANT PERF NOTE
   * Never call React setState inside useFrame.
   * It triggers a React re-render every frame and will eventually kill performance.
   *
   * The glass/FBO path is currently disabled in JSX below; keep this OFF unless needed.
   * If/when you enable LiquidGlassPanel, set this to true.
   */
  const ENABLE_GLASS_FBO = false;

  // FBO resolution - lower on mobile for better performance
  const fboSize = isMobile ? 512 : 1024;

  // Create FBO for rendering scene to texture (for glass refraction)
  const renderTarget = useFBO(fboSize, fboSize, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
  });

  // Render scene to FBO for glass effect (only if enabled)
  useFrame((state) => {
    if (!ENABLE_GLASS_FBO) return;
    state.gl.setRenderTarget(renderTarget);
    state.gl.clear();
    state.gl.render(state.scene, state.camera);
    state.gl.setRenderTarget(null);
  }, -1); // Run before main render

  // --- Match CSS-layouten horisontalt ---
  const leftPadding = 0.08;
  const rightPadding = 0.08;
  const contentWidth = 1 - leftPadding - rightPadding;

  const col1Fr = 1.2;
  const col2Fr = 1;
  const totalFr = col1Fr + col2Fr;

  const col1Frac = col1Fr / totalFr;
  const col2Frac = col2Fr / totalFr;

  // Bredde på kolonne 2 (i skjerm-fraksjon)
  const col2WidthFrac = contentWidth * col2Frac;

  // Kolonne 2 i world units:
  const col2WidthWorld = col2WidthFrac * viewport.width;

  // Senterposisjon til høyre kolonne:
  const rightColStart = leftPadding + contentWidth * col1Frac;
  const rightColCenter = rightColStart + (contentWidth * col2Frac) / 2;

  // Responsive image sizing and positioning
  // På mobil: Full bredde minus padding (5vw på hver side = 90%)
  // På desktop: Kolonne 2's bredde
  const imageMaxWidth = isMobileScreen
    ? viewport.width * 0.9 // 90% av viewport (matching 5vw padding i CSS)
    : col2WidthWorld * 0.9;

  // X-posisjon i world units
  // På mobil: sentrert (x = 0), på desktop: høyre kolonne
  const imageX = isMobileScreen ? 0 : (rightColCenter - 0.5) * viewport.width;

  return (
    <>
      {/* Background color */}
      <color attach="background" args={["#050608"]} />

      {/* OPTIMIZED LIGHTING: Reduced from 5 to 3 lights for better performance */}
      <ambientLight intensity={1.0} color="#ffffff" />

      {/* Main key light - bright white from top-right */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={2.8}
        color="#ffffff"
      />

      {/* Single multi-color accent point light for color pop */}
      <pointLight
        position={[0, 0, 10]}
        intensity={3.0}
        color="#a070ff"
        distance={30}
        decay={2}
      />

      {/* Blobs for each section */}
      {sections.map((section, sectionIndex) => {
        const blobs = getBlobsForSection(
          sectionIndex,
          section.accent,
          pageHeight
        );
        return blobs.map((blobProps, blobIndex) => (
          <FloatingBlob
            key={`blob-${section.id}-${blobIndex}`}
            {...blobProps}
          />
        ));
      })}

      {/* Floating images for each section */}
      {sections.map((section, index) => {
        const yPosition = -index * pageHeight;
        const alignment = section.verticalAlign || "center";

        // Beregn Y-offset basert på alignment og skjermstørrelse
        let yOffset = 0;

        if (isMobileScreen) {
          // På mobil: kolonnene stacker vertikalt
          // Bildene må holde seg innenfor rightColumn-området
          switch (alignment) {
            case "top":
              // Bildet øverst i rightColumn (rett under teksten + gap)
              yOffset = -pageHeight * 0.1;
              break;
            case "center":
              // Bildet sentrert i rightColumn
              yOffset = -pageHeight * 0.2;
              break;
            case "bottom":
              // Bildet nederst i rightColumn
              yOffset = -pageHeight * 0.3;
              break;
          }
        } else {
          // På desktop: kolonnene er side-ved-side, bildet er allerede riktig plassert
          // Alignment påvirker kun vertikal posisjon innenfor rightColumn
          switch (alignment) {
            case "top":
              yOffset = pageHeight * 0.2;
              break;
            case "center":
              yOffset = 0; // Standard sentrering
              break;
            case "bottom":
              yOffset = -pageHeight * 0.2;
              break;
          }
        }

        return (
          <FloatingImage
            key={section.id}
            url={section.image.src}
            aspect="16:9"
            maxWidth={imageMaxWidth}
            maxHeight={pageHeight * 0.7}
            position={[imageX, yPosition + yOffset, 2]}
            floatConfig={{
              speed: 1.5,
              rotationIntensity: 0.2,
              floatIntensity: 0.05,
            }}
          />
        );
      })}
    </>
  );
};

export default LandingScene;
