import { Scroll, ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, lazy } from "react";
import LoadingOverlay from "./LoadingOverlay";
import { ScrollSnapHandler } from "./ScrollSnapHandler";
import { ScrollProvider } from "./ScrollContext";
import { SectionIndicatorTracker } from "./SectionIndicatorTracker";
import { SectionIndicatorUI } from "./SectionIndicatorUI";
import { sections, ENABLE_SCROLL_SNAP } from "../consts";
import { useIsMobile } from "../hooks/useIsMobile";

// Lazy load heavy Three.js components for better initial bundle size
const LandingScene = lazy(() => import("./Landing.scene"));
const R3FPowerManager = lazy(() => import("./R3FPowerManager"));

const Landing: React.FC = () => {
  const [isContentRevealed, setIsContentRevealed] = useState(false);
  const [indicatorState, setIndicatorState] = useState({
    blobPosition: 0,
    isNearSnap: true,
    isSnapping: false,
  });
  const isMobile = useIsMobile();

  return (
    <div style={styles.root}>
      {/* Loading overlay with percentage counter and slide animation */}
      <LoadingOverlay onSlideStart={() => setIsContentRevealed(true)} />

      {/* Section indicator UI - fixed overlay outside Canvas */}
      {/* <SectionIndicatorUI
        totalSections={sections.length}
        blobPosition={indicatorState.blobPosition}
        isNearSnap={indicatorState.isNearSnap}
        isSnapping={indicatorState.isSnapping}
      /> */}

      {/* Chiaroscuro vignette overlays - subtle fade to dark at top and bottom */}
      <div style={styles.topVignette} />
      <div style={styles.bottomVignette} />

      <Canvas
        style={
          {
            ...styles.canvas,
            transform: isContentRevealed
              ? "translateY(0)"
              : "translateY(100px)",
            opacity: isContentRevealed ? 1 : 0,
            transition:
              "transform 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 800ms ease-out",
          } as React.CSSProperties
        }
        // Continuous rendering for smooth animations
        frameloop="always"
        // Keep DPR capped so the GPU doesn't burn at native high-dpi all the time
        dpr={[1, 1.5]}
        gl={{
          powerPreference: "low-power",
        }}
        orthographic // Use orthographic camera for a 2D-like scroll effect
        camera={{ zoom: 80, position: [0, 0, 10] }}
        shadows // Enable shadows for professional "web feel" lighting
      >
        {/* Suspense boundary enables useProgress to track asset loading */}
        <Suspense fallback={null}>
          {/* Drei ScrollControls manages both 3D and HTML scrolling */}
          <ScrollControls
            pages={sections.length} // One page per section
            damping={0.2}
          >
            <ScrollProvider>
              {/* Enable scroll snapping between sections */}
              {ENABLE_SCROLL_SNAP && (
                <ScrollSnapHandler pages={sections.length} />
              )}

              {/* 3D background components */}
              <Scroll>
                <color attach="background" args={["#050608"]} />
                {/* Power-saving + WebGL context-lost handling */}
                <R3FPowerManager idleMs={10000} />
                {/* Pass sections to the 3D scene to render the FloatingImages */}
                <LandingScene sections={sections} />
              </Scroll>

              {/* Section indicator tracker - runs inside Canvas to track scroll */}
              <SectionIndicatorTracker
                totalSections={sections.length}
                onUpdate={setIndicatorState}
              />

              {/* HTML content that scrolls on top of the Canvas */}
              <Scroll html>
                <div style={styles.scrollWrapper}>
                  {sections.map((section, index) => (
                    <section
                      key={section.id}
                      style={{
                        ...styles.section(isMobile),
                        ...styles.sectionGradient(section.accent),
                      }}
                    >
                      {/* Animated gradient blob background */}
                      <div className="blob-container">
                        <div
                          className="blob blob-1"
                          style={{
                            background: `radial-gradient(circle, ${section.accent} 0%, transparent 70%)`,
                          }}
                        />
                        <div
                          className="blob blob-2"
                          style={{
                            background: `radial-gradient(circle, ${section.accent}88 0%, transparent 70%)`,
                          }}
                        />
                        <div
                          className="blob blob-3"
                          style={{
                            background: `radial-gradient(circle, ${section.accent}66 0%, transparent 70%)`,
                          }}
                        />
                      </div>

                      {/* Content wrapper with grid layout */}
                      <div style={styles.content(isMobile)}>
                        {/* Left column wrapper - text content */}
                        <div style={styles.leftColumn}>
                          <div style={styles.sectionInner}>
                            <div style={styles.chipRow}>
                              <span style={styles.chip(section.id)}>
                                {section.label}
                              </span>
                              <span style={styles.chipIndex}>
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>

                            <h1 style={styles.title}>{section.title}</h1>
                            <p style={styles.text}>{section.text}</p>

                            <button type="button" style={styles.button}>
                              Se detaljer
                              <span style={{ fontSize: 16, marginLeft: 8 }}>
                                →
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Right column wrapper - image area */}
                        <div style={styles.rightColumn}>
                          <div style={styles.imageWrapper}>
                            {/* FloatingImage component handles the visual element */}
                          </div>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              </Scroll>
            </ScrollProvider>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
};

// --- Helper Functions ---

// Convert hex color to rgba with specified opacity
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Get pastel chip background color based on section ID
const getPastelChipColor = (sectionId: string): string => {
  switch (sectionId) {
    case "hero":
      return "rgba(255, 224, 224, 0.45)"; // Pastel red/pink
    case "street":
      return "rgba(224, 235, 255, 0.45)"; // Pastel blue
    case "studio":
      return "rgba(235, 224, 255, 0.45)"; // Pastel purple
    default:
      return "rgba(255, 224, 224, 0.45)";
  }
};

// --- Styles (Kept for completeness and context) ---

const styles: Record<string, React.CSSProperties | any> = {
  root: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
  },
  canvas: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
  },
  scrollWrapper: {
    width: "100vw",
  },
  section: (isMobile: boolean) => ({
    minHeight: "100vh",
    zIndex: 10, // Ensure HTML is above 3D elements
    position: "relative",
    display: "flex",
    alignItems: "center",
    outline: "2px solid rgba(253,250,236,0.45)",
    outlineOffset: "0px",
    outlineWidth: "2px",
  }),
  sectionGradient: (accent: string) => ({
    background:
      "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.02), transparent 55%), " +
      `radial-gradient(circle at 100% 100%, ${accent}22, transparent 60%)`,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  }),
  content: (isMobile: boolean) => ({
    maxWidth: "1680px",
    margin: "auto",
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(0, 1fr)",
    padding: isMobile ? "0 6vw" : "0 8vw",
    alignItems: "center",
    alignContent: isMobile ? "center" : undefined,
    gap: isMobile ? "2rem" : "4rem",
  }),
  leftColumn: {
    display: "flex",
    alignItems: "center",
    position: "relative" as const,
    zIndex: 1,
  },
  rightColumn: {
    height: "400px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
    zIndex: 1,
  },
  sectionInner: {
    maxWidth: 560,
  },
  chipRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  chip: (sectionId: string) => ({
    fontSize: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: getPastelChipColor(sectionId),
  }),
  chipIndex: {
    fontSize: 12,
    opacity: 0.6,
  },
  title: {
    fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
    lineHeight: 1.1,
    marginBottom: 16,
    color: "#050608",
  },
  text: {
    fontSize: 16,
    opacity: 0.85,
    maxWidth: 460,
    lineHeight: 1.6,
    marginBottom: 24,
    color: "#050608",
  },
  button: {
    marginTop: 8,
    padding: "12px 24px",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.18)",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    color: "#050608",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow:
      "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative" as const,
  },
  // Keep imageWrapper for layout, even if the img tag is removed
  imageWrapper: {
    justifySelf: "center",
    position: "relative",
  },
  wrapper: {
    position: "relative",
    display: "flex",
    fontWeight: 600,
    overflow: "hidden",
    color: "black",
    cursor: "pointer",
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 2.2)",
  },

  effect: {
    position: "absolute",
    zIndex: 0,
    inset: 0,
    backdropFilter: "blur(3px)",
    filter: "url(#glass-distortion)",
    overflow: "hidden",
    isolation: "isolate",
  },
  // The styles.image CSS is no longer used, as the styling is handled by R3F props (scale, rotation)

  // Apple-style liquid glass vignette overlays - ultra subtle scroll fade
  topVignette: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "calc(100vw - 15px)",
    height: "25px",
    background:
      "linear-gradient(180deg, rgba(5, 6, 8, 0.25) 0%, rgba(5, 6, 8, 0.12) 35%, rgba(5, 6, 8, 0.05) 60%, transparent 100%)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    pointerEvents: "none" as const,
    zIndex: 100,
  },
  bottomVignette: {
    position: "fixed" as const,
    bottom: 0,
    left: 0,
    width: "calc(100vw - 15px)",
    height: "25px",
    background:
      "linear-gradient(0deg, rgba(5, 6, 8, 0.25) 0%, rgba(5, 6, 8, 0.12) 35%, rgba(5, 6, 8, 0.05) 60%, transparent 100%)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    pointerEvents: "none" as const,
    zIndex: 100,
  },
};

export default Landing;
