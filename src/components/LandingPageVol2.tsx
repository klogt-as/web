import {
  GlobalCanvas,
  SmoothScrollbar,
  UseCanvas,
  useTracker,
} from "@14islands/r3f-scroll-rig";
import { StickyScrollScene } from "@14islands/r3f-scroll-rig/powerups";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";
import { useIsMobile } from "../hooks/useIsMobile";

import "./LandingPageVol2.styles.css";
import type { JSX } from "react/jsx-runtime";
import LiquidButton from "./LiquidButton";
import { AnimatedHeroSection } from "./AnimatedHeroSection";
import LoadingOverlay from "./LoadingOverlay";

interface HeroSectionData {
  id: string;
  label: string;
  title: string;
  text: string;
  accent: string;
}

interface HeroSectionProps {
  data: HeroSectionData;
  index: number;
}

function HeroSection({ data, index }: HeroSectionProps) {
  const isMobile = useIsMobile();

  const styles = {
    heroSection: {
      zIndex: 1000,
    },
    content: {
      position: "absolute" as const,
      inset: "0px",
      maxWidth: "1680px",
      width: "100%",
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
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
    chip: {
      fontSize: 12,
      textTransform: "uppercase" as const,
      letterSpacing: 2,
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(0, 0, 0, 0.2)",
      color: "#fdfeec",
    },
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
  };

  return (
    <section style={styles.heroSection}>
      <div style={styles.content}>
        <div style={styles.textContent}>
          {/* Chip Row */}
          <div style={styles.chipRow}>
            <span style={styles.chip}>{data.label}</span>
            <span style={styles.chipIndex}>
              {String(index).padStart(2, "0")}
            </span>
          </div>

          {/* Title */}
          <h1 style={styles.title(isMobile)}>{data.title}</h1>

          {/* Text */}
          <p style={styles.text(isMobile)}>{data.text}</p>

          {/* Button */}
          {/* <LiquidButton label="Se detaljer" /> */}
        </div>
      </div>
    </section>
  );
}

function ScrollProgressUpdater({
  scrollState,
  progressRef,
  onProgressChange,
}: {
  scrollState: any;
  progressRef: React.MutableRefObject<number>;
  onProgressChange: (progress: number) => void;
}) {
  useFrame(() => {
    const progress = scrollState.progress;
    progressRef.current = progress; // Update ref for R3F components
    onProgressChange(progress); // Update state for React components
  });
  return null;
}

function StickySection() {
  const el = useRef<HTMLDivElement>(null);

  // Use ref instead of state to avoid re-render issues with R3F
  const scrollProgressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const heroSection1Data: HeroSectionData = {
    id: "hero-1",
    label: "Realisering",
    title: "Ideer flyter. Vi gjør dem konkrete.",
    text: "Med riktig teknologi og erfaring former vi visjonene dine til digitale opplevelser som engasjerer, virker og vokser. Din idé fortjener å bli virkeliggjort.",
    accent: "#1d1d1d",
  };

  const heroSection2Data: HeroSectionData = {
    id: "hero-2",
    label: "Transformasjon",
    title: "Fra visjon til virkelighet.",
    text: "Vi former digitale løsninger som vokser med din ambisjon. Gjennom innovativ teknologi og gjennomtenkt design skaper vi opplevelser som holder.",
    accent: "#1d1d1d",
  };

  return (
    <section>
      <div className="StickyContainer" style={{ height: "500vh" }}>
        <div ref={el} className="SomeStickyContent Debug">
          <AnimatedHeroSection
            scrollProgress={scrollProgress}
            visibleFrom={0}
            visibleTo={0.5}
          >
            <HeroSection data={heroSection1Data} index={1} />
          </AnimatedHeroSection>
          <AnimatedHeroSection
            scrollProgress={scrollProgress}
            visibleFrom={0.5}
            visibleTo={1.0}
          >
            <HeroSection data={heroSection2Data} index={2} />
          </AnimatedHeroSection>
        </div>
      </div>
      <UseCanvas>
        <StickyScrollScene track={el}>
          {(
            props: JSX.IntrinsicAttributes & {
              scale: any;
              scrollState: any;
              inViewport: any;
            }
          ) => (
            <>
              <ScrollProgressUpdater
                scrollState={props.scrollState}
                progressRef={scrollProgressRef}
                onProgressChange={setScrollProgress}
              />
              <LiquidMercuryBlob scrollProgressRef={scrollProgressRef} />
            </>
          )}
        </StickyScrollScene>
      </UseCanvas>
    </section>
  );
}

function ContactSection() {
  const isMobile = useIsMobile();

  const styles = {
    contactSection: (isMobile: boolean) => ({
      minHeight: "100vh",
      position: "relative" as const,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#050608",
      padding: isMobile ? "4rem 6vw" : "6rem 8vw",
      zIndex: 1000,
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
  return (
    <section style={styles.contactSection(isMobile)}>
      <div style={styles.contactContent(isMobile)}>
        <h2 style={styles.contactTitle(isMobile)}>
          Klar til å realisere din visjon?
        </h2>
        {/* <a
        href="mailto:markus.remmen@klogt.no"
        style={styles.contactButton(isMobile)}
      >
        Kontakt oss
        <span style={{ fontSize: 16, marginLeft: 8 }}>→</span>
      </a> */}
        <LiquidButton label="Kontakt oss" />
      </div>
    </section>
  );
}

type Props = {};

export default function LandingPageVol2({}: Props) {
  const [isTouch, setTouch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setTouch(isTouch);
  }, []);

  return (
    <>
      <LoadingOverlay
        onComplete={() => setIsLoading(false)}
        minDisplayTime={1500}
        slideDelay={400}
        slideDuration={800}
      />
      <GlobalCanvas style={{ zIndex: -1 }} dpr={isMobile ? [1, 1.5] : [1, 2]}>
        <Suspense fallback={null}>
          {/* UseCanvas children will be inserted here */}
        </Suspense>
      </GlobalCanvas>
      <SmoothScrollbar>
        {(bind) => (
          <article {...bind}>
            <StickySection />
            <ContactSection />
          </article>
        )}
      </SmoothScrollbar>
    </>
  );
}
