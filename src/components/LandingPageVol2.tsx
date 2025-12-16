import {
  GlobalCanvas,
  SmoothScrollbar,
  UseCanvas,
} from "@14islands/r3f-scroll-rig";
import { StickyScrollScene } from "@14islands/r3f-scroll-rig/powerups";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import type { JSX } from "react/jsx-runtime";
import { useIsMobile } from "../hooks/useIsMobile";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { AnimatedHeroSection } from "./AnimatedHeroSection";
import LiquidButton from "./LiquidButton";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";
import LoadingOverlay from "./LoadingOverlay";
import Logo from "./Logo";
import ScrollIndicator from "./ScrollIndicator";

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

function ExperienceSection() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Get section-specific scroll progress using the ref
  const { section: sectionProgress } = useScrollProgress(sectionRef);

  const companies = [
    { name: "BRØNNØYSUNDREGISTRENE", strength: 0.2 },
    { name: "RØDE KORS", strength: 0.1 },
    { name: "FREELANCE", strength: 0.1 },
    { name: "SOS-BARNEBYER", strength: 0.1 },
    { name: "NORSK HELSENETT", strength: 0.15 },
    { name: "HELSEDIREKTORATET", strength: 0.25 },
    { name: "NO ISOLATION", strength: 0.25 },
    { name: "SKATTEETATEN", strength: 0.35 },
  ];

  // Create offset arrays for each row so different companies appear vertically
  const getOffsetCompanies = (offset: number) => {
    const rotated = [...companies.slice(offset), ...companies.slice(0, offset)];
    return [...rotated, ...rotated, ...rotated];
  };

  const row1Companies = getOffsetCompanies(0);
  const row2Companies = getOffsetCompanies(2);
  const row3Companies = getOffsetCompanies(4);

  const styles: Record<string, React.CSSProperties | any> = {
    experienceSection: {
      padding: "unset",
      borderTop: "1px solid var(--font-color-light-dark)",
    },
    stickyContainer: {
      position: "relative" as const,
      height: "500vh",
    },
    stickyContent: {
      position: "sticky" as const,
      top: 0,
      height: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      width: "100%",
      height: "100%",
    },
    leftColumn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 var(--pad-x)",
      borderRight: "1px solid var(--font-color-light-dark)",
    },
    textContent: {
      maxWidth: 600,
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
    },
    chipIndex: {
      fontSize: 12,
      color: "var(--font-color-subtile)",
    },
    title: {
      marginTop: "1rem",
      marginBottom: "1rem",
      fontWeight: 600,
      fontSize: isMobile ? "2rem" : "clamp(2rem, 5vw, 3.8rem)",
    },
    text: {
      opacity: 0.85,
      marginBottom: 24,
      fontSize: isMobile ? "0.9rem" : "1rem",
    },
    rightColumn: {
      position: "relative" as const,
      overflow: isMobile ? "visible" : "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    diagonalScrollContainer: {
      position: "absolute" as const,
      top: "-50%",
      right: "-50%",
      width: "200%",
      height: isMobile ? "160%" : "200%",
      transform: "rotate(-35deg)",
      display: "flex",
      flexDirection: "column" as const,
      gap: isMobile ? "2rem" : "3rem",
      justifyContent: "center",
      pointerEvents: "none" as const,
      transition: "transform 0.1s linear",
    },
    diagonalRow: {
      display: "flex",
      gap: isMobile ? "4rem" : "6rem",
      whiteSpace: "nowrap" as const,
      justifyContent: "center",
      transform: `translateX(${sectionProgress * -200}%)`,
    },
    companyName: {
      fontSize: isMobile ? "3rem" : "5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      textTransform: "uppercase" as const,
    },
  };

  return (
    <section style={styles.experienceSection}>
      <div ref={sectionRef} style={styles.stickyContainer}>
        <div style={styles.stickyContent}>
          <div style={styles.grid}>
            {/* Left: Sticky text */}
            <div style={styles.leftColumn}>
              <div style={styles.textContent}>
                {/* Chip Row */}
                <div style={styles.textContent}>
                  {/* Chip Row */}
                  <div style={styles.chipRow}>
                    <span style={styles.chip}>Erfaring</span>
                    <span style={styles.chipIndex}>03</span>
                  </div>

                  {/* Title */}
                  <h2 style={styles.title}>Over ti års erfaring</h2>

                  {/* Text */}
                  <p style={styles.text}>
                    Med over ti års praktisk erfaring har jeg jobbet på tvers av
                    både offentlig og privat sektor &mdash; og hjulpet
                    virksomheter med å gjøre komplekse behov om til tydelige,
                    funksjonelle og sikre digitale løsninger.
                  </p>
                  <p style={styles.text}>
                    Jeg har hatt sentrale roller i prosjekter for store norske
                    institusjoner og innovative selskaper, der jeg har bidratt
                    til å bygge kritisk digital infrastruktur og brukersentrerte
                    løsninger som gir målbar verdi.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Diagonal scrolling text */}
            <div style={styles.rightColumn}>
              <div style={styles.diagonalScrollContainer}>
                <div style={styles.diagonalRow}>
                  {row1Companies.map((company, idx) => (
                    <span
                      key={`row1-${idx}`}
                      style={{
                        ...styles.companyName,
                        opacity: company.strength,
                      }}
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
                <div style={styles.diagonalRow}>
                  {row2Companies.map((company, idx) => (
                    <span
                      key={`row2-${idx}`}
                      style={{
                        ...styles.companyName,
                        opacity: company.strength,
                      }}
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
                <div style={styles.diagonalRow}>
                  {row3Companies.map((company, idx) => (
                    <span
                      key={`row3-${idx}`}
                      style={{
                        ...styles.companyName,
                        opacity: company.strength,
                      }}
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSection({ data, index }: HeroSectionProps) {
  const isMobile = useIsMobile();

  const styles: Record<string, React.CSSProperties | any> = {
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
    },
    chipIndex: {
      fontSize: 12,
      color: "var(--font-color-subtile)",
    },
    title: (isMobile: boolean) => ({
      marginTop: "1rem",
      marginBottom: "1rem",
      fontWeight: 600,
    }),
    text: (isMobile: boolean) => ({
      opacity: 0.85,
      marginBottom: 24,
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
          <h2 style={styles.title(isMobile)}>{data.title}</h2>

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
  progressRef: React.RefObject<number>;
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
      <div className="stickyContainer" style={{ height: "500vh" }}>
        <div ref={el} className="stickyContent">
          <header>
            <Logo />
          </header>
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
          <ScrollIndicator />
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

  const styles: Record<string, React.CSSProperties | any> = {
    contactSection: (isMobile: boolean) => ({
      minHeight: "100vh",
      position: "relative" as const,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#050608",
      zIndex: 1000,
    }),
    contactContent: (isMobile: boolean) => ({
      maxWidth: isMobile ? 380 : 720,
      width: "100%",
      textAlign: "center" as const,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
    }),
    contactTitle: (isMobile: boolean) => ({
      margin: 0,
    }),
    contactSubtitle: (isMobile: boolean) => ({
      margin: 0,
    }),
    contactEmail: (isMobile: boolean) => ({
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
    contactFooter: {
      position: "absolute" as const,
      bottom: "1rem",
      textTransform: "uppercase",
      fontSize: "12px",
      color: "var(--font-color-subtile)",
    },
  };

  const today = new Date();

  return (
    <section style={styles.contactSection(isMobile)}>
      <div style={styles.contactContent(isMobile)}>
        <h2 style={styles.contactTitle(isMobile)}>
          Klar til å realisere din visjon?
        </h2>
        <h2>
          <a href="mailto:hei@klogt.no">hei@klogt.no</a>
        </h2>
      </div>
      <footer style={styles.contactFooter}>
        &copy; {today.getFullYear()} Klogt AS
      </footer>
    </section>
  );
}

export default function LandingPageVol2() {
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
          <main {...bind}>
            <StickySection />
            <ExperienceSection />
            <ContactSection />
          </main>
        )}
      </SmoothScrollbar>
    </>
  );
}
