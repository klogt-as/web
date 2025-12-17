import { useRef } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useScrollProgress } from "../hooks/useScrollProgress";
import { ChipRow } from "./ChipRow";

interface Company {
  name: string;
  strength: number;
}

export function ExperienceSection() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { section: sectionProgress } = useScrollProgress(sectionRef);

  const companies: Company[] = [
    { name: "BRØNNØYSUNDREGISTRENE", strength: 0.2 },
    { name: "RØDE KORS", strength: 0.1 },
    { name: "FREELANCE", strength: 0.1 },
    { name: "SOS-BARNEBYER", strength: 0.1 },
    { name: "NORSK HELSENETT", strength: 0.15 },
    { name: "HELSEDIREKTORATET", strength: 0.25 },
    { name: "NO ISOLATION", strength: 0.25 },
    { name: "SKATTEETATEN", strength: 0.35 },
  ];

  const getOffsetCompanies = (offset: number) => {
    const rotated = [...companies.slice(offset), ...companies.slice(0, offset)];
    return [...rotated, ...rotated, ...rotated];
  };

  const row1Companies = getOffsetCompanies(0);
  const row2Companies = getOffsetCompanies(2);
  const row3Companies = getOffsetCompanies(4);

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    width: "100%",
    height: "100%",
  };

  const diagonalRowStyle: React.CSSProperties = {
    display: "flex",
    gap: isMobile ? "4rem" : "6rem",
    whiteSpace: "nowrap",
    justifyContent: "center",
    transform: `translateX(${sectionProgress * -200}%)`,
  };

  const companyNameStyle = (opacity: number): React.CSSProperties => ({
    fontSize: isMobile ? "3rem" : "5rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    textTransform: "uppercase",
    opacity,
  });

  const rightColumnStyle: React.CSSProperties = {
    position: "relative",
    overflow: isMobile ? "visible" : "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const diagonalScrollContainerStyle: React.CSSProperties = {
    position: "absolute",
    top: isMobile ? "-100%" : "-50%",
    right: "-50%",
    width: "200%",
    height: isMobile ? "160%" : "200%",
    transform: "rotate(-35deg)",
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? "0" : "2rem",
    justifyContent: "center",
    pointerEvents: "none",
    transition: "transform 0.1s linear",
  };

  const titleStyle: React.CSSProperties = {
    marginTop: "1rem",
    marginBottom: "1rem",
    fontWeight: 600,
    fontSize: isMobile ? "2rem" : "clamp(2rem, 5vw, 3.8rem)",
  };

  const textStyle: React.CSSProperties = {
    opacity: 0.85,
    marginBottom: 24,
    fontSize: isMobile ? "0.9rem" : "1rem",
  };

  return (
    <section style={styles.experienceSection}>
      <div ref={sectionRef} style={styles.stickyContainer}>
        <div style={styles.stickyContent}>
          <div style={gridStyle}>
            {/* Left: Sticky text */}
            <div style={styles.leftColumn}>
              <div style={styles.textContent}>
                <ChipRow label="Erfaring" index={3} />
                <h2 style={titleStyle}>Over ti års erfaring</h2>
                <p style={textStyle}>
                  Med over ti års praktisk erfaring har jeg jobbet på tvers av
                  både offentlig og privat sektor &mdash; og hjulpet
                  virksomheter med å gjøre komplekse behov om til tydelige,
                  funksjonelle og sikre digitale løsninger.
                </p>
                <p style={textStyle}>
                  Jeg har hatt sentrale roller i prosjekter for store norske
                  virksomheter, der jeg har bidratt til å bygge kritisk digital
                  infrastruktur og brukersentrerte løsninger som gir målbar
                  verdi.
                </p>
              </div>
            </div>

            {/* Right: Diagonal scrolling text */}
            <div style={rightColumnStyle} aria-hidden="true">
              <div style={diagonalScrollContainerStyle}>
                <div style={diagonalRowStyle}>
                  {row1Companies.map((company, idx) => (
                    <span
                      key={`row1-${idx}`}
                      style={companyNameStyle(company.strength)}
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
                <div style={diagonalRowStyle}>
                  {row2Companies.map((company, idx) => (
                    <span
                      key={`row2-${idx}`}
                      style={companyNameStyle(company.strength)}
                    >
                      {company.name}
                    </span>
                  ))}
                </div>
                <div style={diagonalRowStyle}>
                  {row3Companies.map((company, idx) => (
                    <span
                      key={`row3-${idx}`}
                      style={companyNameStyle(company.strength)}
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

const styles: Record<string, React.CSSProperties> = {
  experienceSection: {
    padding: "unset",
    borderTop: "1px solid var(--font-color-light-dark)",
  },
  stickyContainer: {
    position: "relative",
    height: "300vh",
  },
  stickyContent: {
    position: "sticky",
    top: 0,
    height: "100vh",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
};
