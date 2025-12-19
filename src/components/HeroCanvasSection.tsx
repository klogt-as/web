import { useIsMobile } from "../hooks/useIsMobile";
import { ChipRow } from "./ChipRow";

interface HeroCanvasSectionProps {
  label: string;
  index: number;
  title: string;
  text: string;
}

export function HeroCanvasSection({
  label,
  index,
  title,
  text,
}: HeroCanvasSectionProps) {
  const isMobile = useIsMobile();

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
    <section style={styles.heroSection}>
      <div style={styles.content}>
        <div style={styles.textContent}>
          <ChipRow label={label} index={index} />
          <h2 style={titleStyle}>{title}</h2>
          <p style={textStyle}>{text}</p>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heroSection: {
    zIndex: 1000,
  },
  content: {
    position: "absolute",
    inset: "0px",
    maxWidth: "1680px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    maxWidth: 840,
    width: "100%",
  },
};
