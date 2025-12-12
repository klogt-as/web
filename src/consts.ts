// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.
import Image1 from "./assets/blog-placeholder-1.jpg";
import Image2 from "./assets/blog-placeholder-2.jpg";
import Image3 from "./assets/blog-placeholder-3.jpg";

export const SITE_TITLE = "klogt";
export const SITE_DESCRIPTION = "Welcome to my website!";

// Scroll snapping configuration
export const ENABLE_SCROLL_SNAP = true; // Set to false to disable scroll snapping

export const sections = [
  {
    id: "hero",
    label: "New Drop",
    title: "New Drop // Night Runner V3",
    text: "Lett, responsiv og bygget for nattløp i byen. Glow-in-the-dark detaljer og ultramykt skum.",
    image: Image1,
    accent: "#ff4d62",
    verticalAlign: "center" as const, // "top" | "center" | "bottom"
  },
  {
    id: "street",
    label: "Street Edition",
    title: "Urban Pulse 2.0",
    text: "Chunky silhuett, reflektive paneler og premium lær. Laget for streetwear – ikke bare løping.",
    image: Image2,
    accent: "#4d9bff",
    verticalAlign: "center" as const,
  },
  {
    id: "studio",
    label: "Limited",
    title: "Studio Pack // Neon Dust",
    text: "Håndnummerert collab – kun 500 par globalt. Mesh, semsket og subtil speilfinish.",
    image: Image3,
    accent: "#9b5bff",
    verticalAlign: "center" as const,
  },
];
