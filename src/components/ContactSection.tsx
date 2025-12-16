import { useIsMobile } from "../hooks/useIsMobile";

export function ContactSection() {
  const isMobile = useIsMobile();
  const today = new Date();

  const sectionStyle: React.CSSProperties = {
    minHeight: "100vh",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#050608",
    zIndex: 1000,
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: isMobile ? 380 : 720,
    width: "100%",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
  };

  return (
    <section style={sectionStyle}>
      <div style={contentStyle}>
        <h2 style={titleStyle}>Klar til å realisere din visjon?</h2>
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

const styles: Record<string, React.CSSProperties> = {
  contactFooter: {
    position: "absolute",
    bottom: "1rem",
    textTransform: "uppercase",
    fontSize: "12px",
    color: "var(--font-color-subtile)",
  },
};
