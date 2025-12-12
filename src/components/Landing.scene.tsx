import { useFBO, Environment, ContactShadows } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React from "react";
import * as THREE from "three";
import { isMobile } from "../utils";
import { useIsMobile } from "../hooks/useIsMobile";
import FloatingBlob, { getBlobsForSection } from "./FloatingBlob";
import { BlobMergeProvider, type BlobState } from "./BlobMergeContext";

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

  // Callback when all blobs in a section are merged
  const handleSectionComplete = (
    sectionIndex: number,
    finalBlob: BlobState
  ) => {
    console.log(`🎉 Section ${sectionIndex} complete! All blobs merged.`, {
      position: finalBlob.position,
      radius: finalBlob.radius,
      color: finalBlob.color,
    });
    // TODO: Transform blob to new object here
    // This is where you can trigger the transformation animation
  };

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

      {/* IBL (Image-Based Lighting) */}
      <Environment preset="studio" />

      {/* Key light - hovedlyset fra skrått ovenfra, gir form og dybde */}
      <directionalLight
        position={[3, 5, 2]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Fill light - myk fylling som reduserer harde skygger */}
      <hemisphereLight intensity={0.35} groundColor="#050608" color="#ffffff" />

      {/* Rim/back light - subtilt kantlys bakfra for separasjon */}
      <directionalLight position={[-4, 2, -3]} intensity={0.35} />

      {/* Contact shadows - myke skygger som "grunder" 3D-objekter i layouten */}
      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.35}
        scale={12}
        blur={2.5}
        far={6}
      />

      {/* DEBUG: Boundary visualization for each section */}
      {/* {sections.map((section, sectionIndex) => (
        <BoundaryDebug
          key={`boundary-${section.id}`}
          sectionIndex={sectionIndex}
          pageHeight={pageHeight}
          zPosition={-2}
        />
      ))} */}

      {/* Blobs for each section - Wrapped with merge context */}
      <BlobMergeProvider onSectionComplete={handleSectionComplete}>
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
      </BlobMergeProvider>

      {/* Floating images for each section */}
      {/* {sections.map((section, index) => {
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
            maxDomHeight={600}
            position={[imageX, yPosition + yOffset, 2]}
            floatConfig={{
              speed: 1.5,
              rotationIntensity: 0.2,
              floatIntensity: 0.05,
            }}
            tiltConfig={{
              shineEnabled: false, // Disable intense shine effect
              intensity: 0.3, // Reduce tilt intensity for more subtle effect
            }}
          />
        );
      })} */}
    </>
  );
};

export default LandingScene;
