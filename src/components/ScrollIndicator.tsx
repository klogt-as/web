import { useRef, useEffect } from "react";
import { useScrollProgress } from "../hooks/useScrollProgress";

export default function ScrollIndicator() {
  const ref = useRef<HTMLDivElement>(null);
  const { global: scrollOffset } = useScrollProgress();

  useEffect(() => {
    if (!ref.current) return;

    // Fade out as user starts scrolling
    // Fully visible at 0, start fading at 0.05, fully hidden at 0.15
    let opacity = 1;
    if (scrollOffset > 0.05) {
      opacity = Math.max(0, 1 - (scrollOffset - 0.05) / 0.1);
    }

    ref.current.style.opacity = opacity.toString();
  }, [scrollOffset]);

  return (
    <div ref={ref} style={styles.container}>
      <div style={styles.content}>
        {/* Mouse Icon */}
        <svg
          width="30"
          height="45"
          viewBox="0 0 30 45"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={styles.mouse}
        >
          {/* Mouse body */}
          <rect
            x="1"
            y="1"
            width="28"
            height="43"
            rx="14"
            stroke="rgba(253, 254, 236, 0.6)"
            strokeWidth="2"
            fill="none"
          />
          {/* Scroll wheel - animated */}
          <circle
            cx="15"
            cy="12"
            r="3"
            fill="rgba(253, 254, 236, 0.6)"
            style={styles.wheel}
          />
        </svg>

        {/* Animated Arrow */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={styles.arrow}
        >
          <path
            d="M10 3L10 14M10 14L5 9M10 14L15 9"
            stroke="rgba(253, 254, 236, 0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Text */}
        {/* <p style={styles.text}>Scroll ned</p> */}
      </div>

      {/* Add CSS animation keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }

        @keyframes wheelScroll {
          0%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(8px);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed" as const,
    bottom: 40,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 100,
    pointerEvents: "none" as const,
    transition: "opacity 0.3s ease",
  },
  content: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
  },
  mouse: {
    filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
  },
  wheel: {
    animation: "wheelScroll 2s ease-in-out infinite",
  },
  arrow: {
    animation: "bounce 2s ease-in-out infinite",
    filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
  },
  text: {
    color: "rgba(253, 254, 236, 0.6)",
    fontSize: 14,
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    margin: 0,
    textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  },
};
