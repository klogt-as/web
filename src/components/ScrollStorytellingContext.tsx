import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useScroll } from "@react-three/drei";

interface ScrollStorytellingState {
  scrollOffset: number; // 0 to 1 across all pages
  currentSection: number; // 0, 1, 2...
  sectionProgress: number; // 0 to 1 within current section
}

const ScrollStorytellingContext = createContext<ScrollStorytellingState>({
  scrollOffset: 0,
  currentSection: 0,
  sectionProgress: 0,
});

export function ScrollStorytellingProvider({
  children,
  totalSections = 3,
}: {
  children: ReactNode;
  totalSections?: number;
}) {
  const scroll = useScroll();

  // We'll track the state in a ref and update it in useFrame
  // This allows 3D components to access scroll state efficiently
  const state: ScrollStorytellingState = {
    scrollOffset: scroll.offset,
    currentSection: Math.floor(scroll.offset * totalSections),
    sectionProgress: (scroll.offset * totalSections) % 1,
  };

  return (
    <ScrollStorytellingContext.Provider value={state}>
      {children}
    </ScrollStorytellingContext.Provider>
  );
}

export function useScrollStorytelling() {
  const context = useContext(ScrollStorytellingContext);
  if (!context) {
    throw new Error(
      "useScrollStorytelling must be used within ScrollStorytellingProvider"
    );
  }
  return context;
}
