import { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";

interface ScrollState {
  isSnapping: React.MutableRefObject<boolean>;
  snapTargetSection: React.MutableRefObject<number>;
  snapProgress: React.MutableRefObject<number>; // 0 to 1 during snap animation
  isDraggingScrollbar: React.MutableRefObject<boolean>;
}

const ScrollContext = createContext<ScrollState | null>(null);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const isSnapping = useRef(false);
  const snapTargetSection = useRef(0);
  const snapProgress = useRef(0);
  const isDraggingScrollbar = useRef(false);

  return (
    <ScrollContext.Provider
      value={{
        isSnapping,
        snapTargetSection,
        snapProgress,
        isDraggingScrollbar,
      }}
    >
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollState() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error("useScrollState must be used within ScrollProvider");
  }
  return context;
}
