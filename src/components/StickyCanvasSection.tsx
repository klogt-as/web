import { UseCanvas } from "@14islands/r3f-scroll-rig";
import { StickyScrollScene } from "@14islands/r3f-scroll-rig/powerups";
import { useRef, useState } from "react";
import { AnimatedSection } from "./AnimatedSection";
import { HeroCanvasSection } from "./HeroCanvasSection";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";
import Logo from "./Logo";
import ScrollIndicator from "./ScrollIndicator";
import { ScrollProgressUpdater } from "./ScrollProgressUpdater";

interface ScrollSceneProps {
  scale: number;
  scrollState: {
    progress: number;
  };
  inViewport: boolean;
}

export function StickyCanvasSection() {
  const el = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  return (
    <section>
      <div className="stickyContainer" style={{ height: "300vh" }}>
        <div ref={el} className="stickyContent">
          <header>
            <Logo />
          </header>
          <AnimatedSection
            scrollProgress={scrollProgress}
            visibleFrom={0}
            visibleTo={0.5}
          >
            <HeroCanvasSection
              label="Realisering"
              index={1}
              title="Ideer flyter. Vi gjør dem konkrete."
              text="Med riktig teknologi og erfaring former vi visjonene dine til digitale opplevelser som engasjerer, virker og vokser. Din idé fortjener å bli virkeliggjort."
            />
          </AnimatedSection>
          <AnimatedSection
            scrollProgress={scrollProgress}
            visibleFrom={0.5}
            visibleTo={1.0}
          >
            <HeroCanvasSection
              label="Transformasjon"
              index={2}
              title="Fra visjon til virkelighet."
              text="Vi former digitale løsninger som vokser med din ambisjon. Gjennom innovativ teknologi og gjennomtenkt design skaper vi opplevelser som holder."
            />
          </AnimatedSection>
          <ScrollIndicator />
        </div>
      </div>
      <UseCanvas>
        <StickyScrollScene track={el}>
          {(props: ScrollSceneProps) => (
            <>
              <ScrollProgressUpdater
                scrollState={props.scrollState}
                progressRef={scrollProgressRef}
                onProgressChange={setScrollProgress}
              />
              <LiquidMercuryBlob scrollProgressRef={scrollProgressRef} />
            </>
          )}
        </StickyScrollScene>
      </UseCanvas>
    </section>
  );
}
