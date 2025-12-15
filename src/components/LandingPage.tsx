import { useRef, useState } from "react";
import WebGPUCanvas from "./Canvas/Canvas";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";
import LoadingOverlay from "./LoadingOverlay";
import { useIsMobile } from "../hooks/useIsMobile";
import { ScrollControls, Scroll } from "@react-three/drei";
import { ScrollAnimatedSection } from "./ScrollAnimatedSection";
import { ScrollStorytellingProvider } from "./ScrollStorytellingContext";
import { ScrollIndicator } from "./ScrollIndicator";

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
];

// Main LandingPage Component
export default function LandingPage() {
  const isMobile = useIsMobile();
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const totalSections = sections.length + 1; // sections + contact section

  return (
    <div style={styles.root}>
      <LoadingOverlay onSlideStart={() => setIsLoadingComplete(true)} />

      {/* WebGPU Canvas with ScrollControls */}
      <WebGPUCanvas style={styles.canvas}>
        <ScrollControls pages={totalSections} damping={0.2}>
          <ScrollStorytellingProvider totalSections={totalSections}>
            {/* 3D Scene - synced with scroll */}
            <Scroll>
              <LiquidMercuryBlob />
            </Scroll>

            {/* HTML Content - scroll-animated sections */}
            <Scroll html>
              {/* Scroll Indicator - fades out on scroll */}
              <ScrollIndicator />

              <div style={styles.scrollWrapper}>
                {sections.map((section, index) => (
                  <ScrollAnimatedSection
                    key={section.id}
                    index={index}
                    totalSections={totalSections}
                    style={styles.section(isMobile, section.accent)}
                  >
                    <div style={styles.content(isMobile)}>
                      <div style={styles.textContent}>
                        {/* Chip Row */}
                        <div style={styles.chipRow}>
                          <span style={styles.chip(section.id)}>
                            {section.label}
                          </span>
                          <span style={styles.chipIndex}>
                            {String(index + 1).padStart(2, "0")}
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
                    {/* <a
                      href="mailto:markus.remmen@klogt.no"
                      style={styles.contactEmail(isMobile)}
                    >
                      markus.remmen@klogt.no
                    </a> */}
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
            </Scroll>
          </ScrollStorytellingProvider>
        </ScrollControls>
      </WebGPUCanvas>
    </div>
  );
}

// Get pastel chip background color based on section ID
const getPastelChipColor = (sectionId: string): string => {
  switch (sectionId) {
    case "hero":
      return "rgba(255, 224, 224, 0.45)";
    case "expertise":
      return "rgba(224, 235, 255, 0.45)";
    default:
      return "rgba(255, 224, 224, 0.45)";
  }
};

// Styles with responsive design
const styles: Record<string, any> = {
  root: {
    position: "relative" as const,
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
  },
  canvas: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 0,
  },
  scrollWrapper: {
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
    // Only transition hover effects, not transform/opacity (Motion handles those)
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
    // Only transition hover effects, not transform/opacity (Motion handles those)
    transition:
      "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
    fontSize: isMobile ? 14 : 16,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    textDecoration: "none",
  }),
};
