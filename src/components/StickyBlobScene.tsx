import { useRef, useState } from "react";
import { UseCanvas } from "@14islands/r3f-scroll-rig";
import { StickyScrollScene } from "@14islands/r3f-scroll-rig/powerups";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";

interface StickyBlobSceneProps {
  onScrollProgress?: (progress: number) => void;
}

export function StickyBlobScene({ onScrollProgress }: StickyBlobSceneProps) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  return (
    <section style={styles.section}>
      {/* This is the sticky element that will be tracked */}
      <div ref={stickyRef} style={styles.stickyContainer}>
        <div style={styles.stickyContent}>
          {/* Hero text that fades in during scroll */}
          <div
            style={{
              ...styles.heroText,
            }}
          >
            <div style={styles.chipRow}>
              <span style={styles.chip}>Realisering</span>
              <span style={styles.chipIndex}>01</span>
            </div>
            <h1 style={styles.title}>Ideer flyter. Vi gjør dem konkrete.</h1>
            <p style={styles.text}>
              Med riktig teknologi og erfaring former vi visjonene dine til
              digitale opplevelser som engasjerer, virker og vokser. Din idé
              fortjener å bli virkeliggjort.
            </p>
            <button type="button" style={styles.button}>
              Se detaljer
              <span style={{ fontSize: 16, marginLeft: 8 }}>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Track scroll progress without rendering in UseCanvas */}
      <UseCanvas>
        <StickyScrollScene track={stickyRef}>
          {({ scrollState }) => {
            // Get local scroll progress (0 to 1 within the sticky section)
            const localProgress = scrollState.progress;

            // Fade in hero text after 25% progress
            if (localProgress > 0.25 && !heroVisible) {
              setHeroVisible(true);
            } else if (localProgress <= 0.25 && heroVisible) {
              setHeroVisible(false);
            }

            // Pass progress to parent if needed
            if (onScrollProgress) {
              onScrollProgress(localProgress);
            }

            // Return null - we don't render anything here
            // The blob is rendered separately in its own WebGPU canvas
            return null;
          }}
        </StickyScrollScene>
      </UseCanvas>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    position: "relative",
    height: "300vh", // Makes the section scrollable for sticky effect
  },
  stickyContainer: {
    position: "sticky",
    top: 0,
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stickyContent: {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    maxWidth: "720px",
    width: "90%",
    textAlign: "left",
    zIndex: 10,
    padding: "0 2rem",
    transition: "opacity 0.8s ease, transform 0.8s ease",
  },
  chipRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  chip: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255, 224, 224, 0.45)",
    color: "#050608",
  },
  chipIndex: {
    fontSize: 12,
    opacity: 0.6,
    color: "#fdfeec",
  },
  title: {
    fontSize: "clamp(2.4rem, 4vw, 3.8rem)",
    lineHeight: 1.1,
    marginBottom: 16,
    color: "#fdfeec",
    fontWeight: 600,
  },
  text: {
    fontSize: 17,
    opacity: 0.85,
    lineHeight: 1.7,
    marginBottom: 24,
    color: "#fdfeec",
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
    textTransform: "uppercase",
    letterSpacing: 1,
  },
};
