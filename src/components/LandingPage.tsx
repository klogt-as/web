import { useRef, useState } from "react";
import LoadingOverlay from "./LoadingOverlay";
import { useIsMobile } from "../hooks/useIsMobile";
import { GlobalCanvas, SmoothScrollbar } from "@14islands/r3f-scroll-rig";
import { ScrollAnimatedSection } from "./ScrollAnimatedSection";
import { ScrollIndicator } from "./ScrollIndicator";
import { StickyBlobScene } from "./StickyBlobScene";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import WebGPUCapabilities from "three/examples/jsm/capabilities/WebGPU.js";
import { WebGPURenderer } from "three/webgpu";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";

// Section content data
const sections = [
  {
    id: "hero",
    label: "Realisering",
    title: "Ideer flyter. Vi gjør dem konkrete.",
    text: "Med riktig teknologi og erfaring former vi visjonene dine til digitale opplevelser som engasjerer, virker og vokser. Din idé fortjener å bli virkeliggjort.",
    accent: "#1d1d1d",
  },
  {
    id: "expertise",
    label: "Verktøy & Ekspertise",
    title: "Fra kaos til klarhet",
    text: "Vi vet at kreativitet starter uorganisert. Med riktig teknologi og erfaring former vi dine visjoner til digitale opplevelser som engasjerer, virker og vokser. Din ide fortjener mer enn å forbli et konsept.",
    accent: "#4d9bff",
  },
  {
    id: "experience",
    label: "Erfaring",
    title: "Erfaring som skaper resultater",
    text: "Med flere års erfaring i bransjen har vi levert løsninger som overgår forventninger. Vi kombinerer teknisk ekspertise med forståelse for brukerens behov.",
    accent: "#6b46c1",
  },
];

// Main LandingPage Component
export default function LandingPage() {
  const isMobile = useIsMobile();
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const totalSections = sections.length + 1; // sections + contact section
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Loading overlay */}
      <LoadingOverlay onSlideStart={() => setIsLoadingComplete(true)} />

      {/* Lenis smooth scrollbar wrapper - disabled on mobile for better performance */}
      {!isMobile ? (
        <SmoothScrollbar>
          {() => (
            <div ref={containerRef} style={styles.root}>
              <ContentWithCanvas
                isMobile={isMobile}
                totalSections={totalSections}
              />
            </div>
          )}
        </SmoothScrollbar>
      ) : (
        <div ref={containerRef} style={styles.root}>
          <ContentWithCanvas
            isMobile={isMobile}
            totalSections={totalSections}
          />
        </div>
      )}
    </>
  );
}

// Separate component for canvas and content to reduce duplication
function ContentWithCanvas({
  isMobile,
  totalSections,
}: {
  isMobile: boolean;
  totalSections: number;
}) {
  return (
    <>
      {/* WebGPU Canvas for blob rendering */}
      <Canvas
        style={styles.canvas}
        gl={async (canvas: any) => {
          const webGPUAvailable = WebGPUCapabilities.isAvailable();
          const renderer = new WebGPURenderer({
            canvas: canvas.canvas as HTMLCanvasElement,
            antialias: !isMobile,
            alpha: true,
            forceWebGL: !webGPUAvailable,
          });
          renderer.toneMapping = ACESFilmicToneMapping;
          renderer.outputColorSpace = SRGBColorSpace;

          const pixelRatio = isMobile
            ? Math.min(window.devicePixelRatio, 1.5)
            : Math.min(window.devicePixelRatio, 2);
          renderer.setPixelRatio(pixelRatio);

          await renderer.init();
          return renderer;
        }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <AdaptiveDpr pixelated={isMobile} />
        <LiquidMercuryBlob />
      </Canvas>

      {/* GlobalCanvas for r3f-scroll-rig (scroll tracking only) */}
      <GlobalCanvas style={styles.canvas} dpr={isMobile ? [1, 1.5] : [1, 2]}>
        {/* Empty - only used for scroll tracking */}
      </GlobalCanvas>

      {/* Scroll Indicator - fades out on scroll */}
      <ScrollIndicator />

      <div style={styles.scrollWrapper}>
        {/* Sticky Blob Scene - Hero Section */}
        <StickyBlobScene />

        {/* Regular sections after sticky section */}
        {sections.slice(1).map((section, index) => (
          <ScrollAnimatedSection
            key={section.id}
            index={index + 1}
            totalSections={totalSections}
            style={styles.section(isMobile, section.accent)}
          >
            <div style={styles.content(isMobile)}>
              <div style={styles.textContent}>
                {/* Chip Row */}
                <div style={styles.chipRow}>
                  <span style={styles.chip(section.id)}>{section.label}</span>
                  <span style={styles.chipIndex}>
                    {String(index + 2).padStart(2, "0")}
                  </span>
                </div>

                {/* Title */}
                <h1 style={styles.title(isMobile)}>{section.title}</h1>

                {/* Text */}
                <p style={styles.text(isMobile)}>{section.text}</p>

                {/* Button */}
                <button type="button" style={styles.button}>
                  Se detaljer
                  <span style={{ fontSize: 16, marginLeft: 8 }}>→</span>
                </button>
              </div>
            </div>
          </ScrollAnimatedSection>
        ))}

        {/* Contact Section */}
        <ScrollAnimatedSection
          index={sections.length}
          totalSections={totalSections}
          style={styles.contactSection(isMobile)}
        >
          <div style={styles.contactContent(isMobile)}>
            <h2 style={styles.contactTitle(isMobile)}>
              Klar til å realisere din visjon?
            </h2>
            <a
              href="mailto:markus.remmen@klogt.no"
              style={styles.contactButton(isMobile)}
            >
              Kontakt oss
              <span style={{ fontSize: 16, marginLeft: 8 }}>→</span>
            </a>
          </div>
        </ScrollAnimatedSection>
      </div>
    </>
  );
}

// Get pastel chip background color based on section ID
const getPastelChipColor = (sectionId: string): string => {
  switch (sectionId) {
    case "hero":
      return "rgba(255, 224, 224, 0.45)";
    case "expertise":
      return "rgba(224, 235, 255, 0.45)";
    case "experience":
      return "rgba(235, 224, 255, 0.45)";
    default:
      return "rgba(255, 224, 224, 0.45)";
  }
};

// Styles with responsive design
const styles: Record<string, any> = {
  root: {
    position: "relative" as const,
    width: "100%",
  },
  canvasContainer: {
    position: "fixed",
    margin: "200px",
  },
  canvas: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 0,
    pointerEvents: "none" as const,
  },
  scrollWrapper: {
    position: "relative" as const,
    zIndex: 1,
    width: "100vw",
  },
  section: (isMobile: boolean, accent: string) => ({
    minHeight: "100vh",
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "2px solid rgba(253,250,236,0.45)",
    outlineOffset: "0px",
    background:
      "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.02), transparent 55%), " +
      `radial-gradient(circle at 100% 100%, ${accent}22, transparent 60%)`,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    padding: isMobile ? "4rem 6vw" : "6rem 8vw",
  }),
  content: (isMobile: boolean) => ({
    maxWidth: "1680px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  textContent: {
    maxWidth: 720,
    width: "100%",
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
    color: "#050608",
  }),
  chipIndex: {
    fontSize: 12,
    opacity: 0.6,
    color: "#fdfeec",
  },
  title: (isMobile: boolean) => ({
    fontSize: isMobile
      ? "clamp(2rem, 8vw, 2.8rem)"
      : "clamp(2.4rem, 4vw, 3.8rem)",
    lineHeight: 1.1,
    marginBottom: 16,
    color: "#fdfeec",
    fontWeight: 600,
  }),
  text: (isMobile: boolean) => ({
    fontSize: isMobile ? 15 : 17,
    opacity: 0.85,
    lineHeight: 1.7,
    marginBottom: 24,
    color: "#fdfeec",
  }),
  button: {
    marginTop: 8,
    padding: "12px 24px",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.18)",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    color: "#fdfeec",
    fontWeight: 400,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow:
      "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
    transition:
      "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
    fontSize: 14,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  // Contact Section Styles
  contactSection: (isMobile: boolean) => ({
    minHeight: "100vh",
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050608",
    padding: isMobile ? "4rem 6vw" : "6rem 8vw",
  }),
  contactContent: (isMobile: boolean) => ({
    maxWidth: isMobile ? "100%" : 800,
    width: "100%",
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: isMobile ? 24 : 32,
  }),
  contactTitle: (isMobile: boolean) => ({
    fontSize: isMobile ? "clamp(2rem, 8vw, 3rem)" : "clamp(3rem, 6vw, 5rem)",
    lineHeight: 1.1,
    color: "#fdfeec",
    fontWeight: 600,
    margin: 0,
  }),
  contactSubtitle: (isMobile: boolean) => ({
    fontSize: isMobile ? 18 : 22,
    color: "rgba(253, 254, 236, 0.7)",
    lineHeight: 1.5,
    margin: 0,
  }),
  contactEmail: (isMobile: boolean) => ({
    fontSize: isMobile ? 20 : 28,
    color: "#4d9bff",
    textDecoration: "none",
    fontWeight: 500,
    transition: "all 0.3s ease",
    cursor: "pointer",
    ":hover": {
      color: "#7eb4ff",
    },
  }),
  contactButton: (isMobile: boolean) => ({
    marginTop: isMobile ? 8 : 16,
    padding: isMobile ? "14px 28px" : "16px 36px",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.18)",
    background:
      "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    color: "#fdfeec",
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow:
      "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
    transition:
      "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
    fontSize: isMobile ? 14 : 16,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    textDecoration: "none",
  }),
};
