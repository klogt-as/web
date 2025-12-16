import { GlobalCanvas, SmoothScrollbar } from "@14islands/r3f-scroll-rig";
import { Suspense, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { ContactSection } from "./ContactSection";
import { ExperienceSection } from "./ExperienceSection";
import LoadingOverlay from "./LoadingOverlay";
import { StickyCanvasSection } from "./StickyCanvasSection";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  return (
    <>
      <LoadingOverlay
        onComplete={() => setIsLoading(false)}
        minDisplayTime={1500}
        slideDelay={400}
        slideDuration={800}
      />
      <GlobalCanvas style={{ zIndex: -1 }} dpr={isMobile ? [1, 1.5] : [1, 2]}>
        <Suspense fallback={null}>
          {/* UseCanvas children will be inserted here */}
        </Suspense>
      </GlobalCanvas>
      <SmoothScrollbar>
        {(bind) => (
          <main {...bind}>
            <StickyCanvasSection />
            <ExperienceSection />
            <ContactSection />
          </main>
        )}
      </SmoothScrollbar>
    </>
  );
}
