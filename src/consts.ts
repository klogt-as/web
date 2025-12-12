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
    label: "Nye Blobs",
    title: "Blob Drop // Flytende Form",
    text: "Myke, organiske blobs som flyter sømløst over skjermen. Designet for bevegelse, dybde og visuell ro.",
    image: Image1,
    accent: "#ff4d62",
    verticalAlign: "center" as const, // "top" | "center" | "bottom"
  },
  {
    id: "street",
    label: "Interaktive Blobs",
    title: "Urban Blobs",
    text: "Dynamiske blobs som responderer på scroll og interaksjon. Perfekt for moderne, levende grensesnitt.",
    image: Image2,
    accent: "#4d9bff",
    verticalAlign: "center" as const,
  },
  {
    id: "studio",
    label: "Eksperimentelt",
    title: "Studio Blobs // Neon Flow",
    text: "Eksperimentelle blob-former med lag, gradienter og subtil glød. Skapt for å utforske det abstrakte.",
    image: Image3,
    accent: "#9b5bff",
    verticalAlign: "center" as const,
  },
];
