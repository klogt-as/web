import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import WebGPUCanvas from "./Canvas/Canvas";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";
import LoadingOverlay from "./LoadingOverlay";
import { useIsMobile } from "../hooks/useIsMobile";

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

// Animated Section Component
function AnimatedSection({
  section,
  index,
  isMobile,
  isLoadingComplete,
}: {
  section: (typeof sections)[0];
  index: number;
  isMobile: boolean;
  isLoadingComplete: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  // Only animate when both in view AND loading is complete
  const shouldAnimate = isInView && isLoadingComplete;

  return (
    <section ref={ref} style={styles.section(isMobile, section.accent)}>
      {/* Animated gradient blob background */}
      {/* <div className="blob-container">
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
      </div> */}

      {/* Content wrapper */}
      <div style={styles.content(isMobile)}>
        <div style={styles.textContent}>
          {/* Chip Row - slides in first */}
          <motion.div
            style={styles.chipRow}
            initial={{ y: 40, opacity: 0 }}
            animate={
              shouldAnimate ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }
            }
            transition={{ duration: 0.8, ease: "easeOut", delay: 0 }}
          >
            <span style={styles.chip(section.id)}>{section.label}</span>
            <span style={styles.chipIndex}>
              {String(index + 1).padStart(2, "0")}
            </span>
          </motion.div>

          {/* Title - slides in second */}
          <motion.h1
            style={styles.title(isMobile)}
            initial={{ y: 40, opacity: 0 }}
            animate={
              shouldAnimate ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }
            }
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          >
            {section.title}
          </motion.h1>

          {/* Text - slides in third */}
          <motion.p
            style={styles.text(isMobile)}
            initial={{ y: 40, opacity: 0 }}
            animate={
              shouldAnimate ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }
            }
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            {section.text}
          </motion.p>

          {/* Button - slides in last */}
          <motion.button
            type="button"
            style={styles.button}
            initial={{ y: 40, opacity: 0 }}
            animate={
              shouldAnimate ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }
            }
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
          >
            Se detaljer
            <span style={{ fontSize: 16, marginLeft: 8 }}>→</span>
          </motion.button>
        </div>
      </div>
    </section>
  );
}

// Contact Section Component
function ContactSection({
  isMobile,
  isLoadingComplete,
}: {
  isMobile: boolean;
  isLoadingComplete: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  // Only animate when both in view AND loading is complete
  const shouldAnimate = isInView && isLoadingComplete;

  return (
    <section ref={ref} style={styles.contactSection(isMobile)}>
      <div style={styles.contactContent(isMobile)}>
        {/* Large Title */}
        <motion.h1
          style={styles.contactTitle(isMobile)}
          initial={{ y: 40, opacity: 0 }}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0 }}
        >
          Klar til å realisere din visjon?
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          style={styles.contactSubtitle(isMobile)}
          initial={{ y: 40, opacity: 0 }}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        >
          La oss starte en samtale
        </motion.p>

        {/* Email */}
        <motion.a
          href="mailto:post@klogt.no"
          style={styles.contactEmail(isMobile)}
          initial={{ y: 40, opacity: 0 }}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          post@klogt.no
        </motion.a>

        {/* CTA Button */}
        <motion.a
          href="mailto:post@klogt.no"
          style={styles.contactButton(isMobile)}
          initial={{ y: 40, opacity: 0 }}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        >
          Kontakt oss
          <span style={{ fontSize: 16, marginLeft: 8 }}>→</span>
        </motion.a>
      </div>
    </section>
  );
}

// Main LandingPage Component
export default function LandingPage() {
  const isMobile = useIsMobile();
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  return (
    <div style={styles.root}>
      <LoadingOverlay onSlideStart={() => setIsLoadingComplete(true)} />

      {/* Fixed WebGPU Canvas Background */}
      <div style={styles.canvasWrapper}>
        <WebGPUCanvas style={{ width: "100%", height: "100%" }}>
          <LiquidMercuryBlob />
        </WebGPUCanvas>
      </div>

      {/* Scrollable HTML Content Overlay */}
      <div style={styles.scrollContainer}>
        {sections.map((section, index) => (
          <AnimatedSection
            key={section.id}
            section={section}
            index={index}
            isMobile={isMobile}
            isLoadingComplete={isLoadingComplete}
          />
        ))}
        <ContactSection
          isMobile={isMobile}
          isLoadingComplete={isLoadingComplete}
        />
      </div>
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
    minHeight: "100vh",
    overflow: "hidden",
  },
  canvasWrapper: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 0,
  },
  scrollContainer: {
    position: "relative" as const,
    zIndex: 1,
    width: "100%",
    height: "auto",
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
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
