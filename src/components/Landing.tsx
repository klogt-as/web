import { Scroll, ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
// Assuming image imports work in your environment (e.g., Vite/Webpack/Next.js)
import Image1 from "../assets/blog-placeholder-1.jpg";
import Image2 from "../assets/blog-placeholder-2.jpg";
import Image3 from "../assets/blog-placeholder-3.jpg";
import LandingScene from "./Landing.scene";
import LoadingOverlay from "./LoadingOverlay";
import { ScrollSnapHandler } from "./ScrollSnapHandler";

const sections = [
    {
        id: "hero",
        label: "New Drop",
        title: "New Drop // Night Runner V3",
        text: "Lett, responsiv og bygget for nattløp i byen. Glow-in-the-dark detaljer og ultramykt skum.",
        image: Image1,
        accent: "#ff4d62",
    },
    {
        id: "street",
        label: "Street Edition",
        title: "Urban Pulse 2.0",
        text: "Chunky silhuett, reflektive paneler og premium lær. Laget for streetwear – ikke bare løping.",
        image: Image2,
        accent: "#4d9bff",
    },
    {
        id: "studio",
        label: "Limited",
        title: "Studio Pack // Neon Dust",
        text: "Håndnummerert collab – kun 500 par globalt. Mesh, semsket og subtil speilfinish.",
        image: Image3,
        accent: "#9b5bff",
    },
];

const Landing: React.FC = () => {
    const [isContentRevealed, setIsContentRevealed] = useState(false);

    return (
        <div style={styles.root}>
            {/* Loading overlay with percentage counter and slide animation */}
            <LoadingOverlay onSlideStart={() => setIsContentRevealed(true)} />
            
            <Canvas
                style={{
                    ...styles.canvas,
                    transform: isContentRevealed ? "translateY(0)" : "translateY(100px)",
                    opacity: isContentRevealed ? 1 : 0,
                    transition: "transform 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 800ms ease-out",
                } as React.CSSProperties}
                orthographic // Use orthographic camera for a 2D-like scroll effect
                camera={{ zoom: 80, position: [0, 0, 10] }}
            >
                {/* Suspense boundary enables useProgress to track asset loading */}
                <Suspense fallback={null}>
                    {/* Drei ScrollControls manages both 3D and HTML scrolling */}
                    <ScrollControls
                        pages={sections.length} // One page per section
                        damping={0.2}
                    >
                        {/* Enable scroll snapping between sections */}
                        <ScrollSnapHandler pages={sections.length} />
                        
                        {/* 3D background components */}
                        <Scroll>
                            <color attach="background" args={["#050608"]} />
                            {/* Pass sections to the 3D scene to render the FloatingImages */}
                            <LandingScene sections={sections} /> 
                        </Scroll>

                        {/* HTML content that scrolls on top of the Canvas */}
                        <Scroll html>
                            <div style={styles.scrollWrapper}>
                                {sections.map((section, index) => (
                                    <section
                                        key={section.id}
                                        style={{
                                            ...styles.section,
                                            ...styles.sectionGradient(section.accent),
                                        }}
                                    >
                                        {/* Animated gradient blob background */}
                                        <div className="blob-container">
                                            <div 
                                                className="blob blob-1" 
                                                style={{ background: `radial-gradient(circle, ${section.accent} 0%, transparent 70%)` }}
                                            />
                                            <div 
                                                className="blob blob-2" 
                                                style={{ background: `radial-gradient(circle, ${section.accent}88 0%, transparent 70%)` }}
                                            />
                                            <div 
                                                className="blob blob-3" 
                                                style={{ background: `radial-gradient(circle, ${section.accent}66 0%, transparent 70%)` }}
                                            />
                                        </div>

                                        {/* <div style={styles.wrapper}>
                                            <div style={styles.effect}></div>
                                            <div>New file</div>
                                            <div>Open file</div>
                                            <div>Settings</div>
                                            <div>Repository</div>
                                        </div> */}

                                        <div style={styles.sectionInner}>
                                            <div style={styles.chipRow}>
                                                <span style={styles.chip}>{section.label}</span>
                                                <span style={styles.chipIndex}>
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                            </div>

                                            <h1 style={styles.title}>{section.title}</h1>
                                            <p style={styles.text}>{section.text}</p>

                                            <button type="button" style={styles.button}>
                                                Se detaljer
                                                <span style={{ fontSize: 16, marginLeft: 8 }}>→</span>
                                            </button>
                                        </div>

                                        {/* *** IMPORTANT FIX ***
                                            The HTML <img> tag must be removed 
                                            as the FloatingImage component now handles the visual element.
                                        */}
                                        <div style={styles.imageWrapper}>
                                            {/* <img src={...} /> IS REMOVED HERE */}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </Scroll>
                    </ScrollControls>
                </Suspense>
            </Canvas>
        </div>
    );
};

// --- Styles (Kept for completeness and context) ---

const styles: Record<string, React.CSSProperties | any> = {
    root: {
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        color: 'white', // Ensure text is visible
        fontFamily: 'sans-serif', // Best practice
    },
    canvas: {
        position: "fixed",
        inset: 0,
        zIndex: 0,
    },
    scrollWrapper: {
        width: "100vw",
    },
    section: {
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
        padding: "0 8vw",
        alignItems: "center",
        gap: "4rem",
        zIndex: 10, // Ensure HTML is above 3D elements
        position: 'relative',
    },
    sectionGradient: (accent: string) => ({
        background:
            "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.02), transparent 55%), " +
            `radial-gradient(circle at 100% 100%, ${accent}22, transparent 60%)`,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
    }),
    sectionInner: {
        maxWidth: 560,
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
        background: "rgba(0,0,0,0.4)",
    },
    chipIndex: {
        fontSize: 11,
        opacity: 0.6,
    },
    title: {
        fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
        lineHeight: 1.1,
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        opacity: 0.85,
        maxWidth: 460,
        lineHeight: 1.6,
        marginBottom: 24,
        color: "#050608",
    },
    button: {
        marginTop: 8,
        padding: "10px 18px",
        borderRadius: 999,
        border: "none",
        background: "linear-gradient(135deg, #ff4d62, #ff7b4d, #ffd14d, #ff4d62)",
        backgroundSize: "200% 200%",
        color: "#050608",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        boxShadow: "0 12px 30px rgba(0,0,0,0.32)",
    },
    // Keep imageWrapper for layout, even if the img tag is removed
    imageWrapper: { 
        justifySelf: "center",
        position: "relative",
    },
    wrapper: {
    position: "relative",
    display: "flex",
    fontWeight: 600,
    overflow: "hidden",
    color: "black",
    cursor: "pointer",
    boxShadow:
      "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 2.2)",
  },

  effect: {
    position: "absolute",
    zIndex: 0,
    inset: 0,
    backdropFilter: "blur(3px)",
    filter: "url(#glass-distortion)",
    overflow: "hidden",
    isolation: "isolate",
  },
    // The styles.image CSS is no longer used, as the styling is handled by R3F props (scale, rotation)
};

export default Landing;
