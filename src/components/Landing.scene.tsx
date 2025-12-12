import { useFBO, useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";
import { isMobile } from "../utils";
import FloatingImage from "./FloatingImage";

interface SectionData {
  id: string;
  label: string;
  title: string;
  text: string;
  image: { src: string };
  accent: string;
}

interface LandingSceneProps {
  sections: SectionData[];
}

// Blob with velocity-based scroll drag (like FloatingImage) and minimal floating
type BlobProps = {
  position: [number, number, number];
  radius?: number;
  color: string;
  dragStrength?: number; // How much it drags behind on scroll (default: 0.5)
  sectionIndex: number;
  pageHeight: number;
};

const Blob: React.FC<BlobProps> = ({
  position,
  radius = 1,
  color,
  dragStrength = 0.5,
  sectionIndex,
  pageHeight,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const scroll = useScroll();

  // Store previous scroll offset and smoothed values
  const prevScrollOffset = useRef(0);
  const smoothedVelocity = useRef(0);
  const smoothedY = useRef(position[1] - sectionIndex * pageHeight);
  const smoothedX = useRef(position[0]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const currentScrollOffset = scroll.offset;

    // Calculate raw velocity (how fast we're scrolling)
    const rawVelocity =
      (currentScrollOffset - prevScrollOffset.current) / Math.max(delta, 0.001);
    prevScrollOffset.current = currentScrollOffset;

    // Smooth the velocity for butter-smooth motion
    const velocitySmoothFactor = 1 - Math.pow(0.03, delta);
    smoothedVelocity.current = THREE.MathUtils.lerp(
      smoothedVelocity.current,
      rawVelocity,
      velocitySmoothFactor
    );

    // Base Y position (section-based)
    const baseY = position[1] - sectionIndex * pageHeight;

    // Velocity-based drag offset (like FloatingImage)
    const dragOffset = -smoothedVelocity.current * dragStrength;

    // Very subtle floating animation (much smaller than before)
    const floatY = Math.sin(time * 0.3 + position[0]) * 0.05;
    const floatX = Math.cos(time * 0.2 + position[1]) * 0.03;

    // Target positions
    const targetY = baseY + dragOffset + floatY;
    const targetX = position[0] + floatX;

    // Smooth lerp towards target (responsive but smooth)
    const positionSmoothFactor = 1 - Math.pow(1 - 0.08, delta * 60);
    smoothedY.current = THREE.MathUtils.lerp(
      smoothedY.current,
      targetY,
      positionSmoothFactor
    );
    smoothedX.current = THREE.MathUtils.lerp(
      smoothedX.current,
      targetX,
      positionSmoothFactor
    );

    // Apply smoothed positions
    meshRef.current.position.x = smoothedX.current;
    meshRef.current.position.y = smoothedY.current;

    // Very subtle rotation
    meshRef.current.rotation.z = Math.sin(time * 0.15) * 0.02;

    // OPTIMIZED: Animate only transmission for liquid glass effect (reduced from 3 properties)
    if (meshRef.current.material instanceof THREE.MeshPhysicalMaterial) {
      // Liquid-like pulsing transmission (more transparent when it pulses)
      const baseTrans = 0.7;
      meshRef.current.material.transmission =
        baseTrans + Math.sin(time * 0.4 + position[0]) * 0.15;
    }
  });

  // Calculate render order based on Z position (further back = lower order = renders first)
  const renderOrder = Math.round(-position[2]);

  // Create liquid-like displacement for organic depth
  // OPTIMIZED: Reduced segments based on device capability and LOD
  const geometry = React.useMemo(() => {
    // LOD: Use fewer segments for blobs far from camera (z-depth)
    const isDistant = position[2] < -7;
    let segments: number;

    if (isMobile) {
      segments = isDistant ? 12 : 16; // Mobile: very low poly
    } else {
      segments = isDistant ? 24 : 32; // Desktop: reduced from 64
    }

    const geo = new THREE.SphereGeometry(radius, segments, segments);
    const positionAttribute = geo.attributes.position;

    // Add organic displacement to vertices for liquid glass effect
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      // Create organic displacement using noise-like pattern
      const displacement =
        Math.sin(x * 2 + position[0]) * 0.08 +
        Math.cos(y * 2 + position[1]) * 0.08 +
        Math.sin(z * 1.5 + position[2]) * 0.06;

      positionAttribute.setXYZ(
        i,
        x * (1 + displacement),
        y * (1 + displacement),
        z * (1 + displacement)
      );
    }

    geo.computeVertexNormals();
    return geo;
  }, [radius, position]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      renderOrder={renderOrder}
      geometry={geometry}
    >
      <meshPhysicalMaterial
        color={color}
        emissive={color} // Make it glow with its own color
        emissiveIntensity={0.5} // Slightly stronger glow
        transparent
        opacity={0.75} // Balanced opacity
        transmission={0.7} // High transmission for liquid glass
        thickness={2.5} // Much thicker for depth and refraction
        roughness={0.05} // Very smooth, liquid surface
        metalness={0.0} // Not metallic (glass)
        clearcoat={1.0} // Glossy coating
        clearcoatRoughness={0.05} // Very smooth coating
        ior={1.52} // Higher IOR (like water/glass) for better refraction
        envMapIntensity={2.0} // Reduced from 2.5
        reflectivity={0.8} // Reduced from 0.9
        // REMOVED: iridescence (expensive!)
        // REMOVED: sheen (expensive!)
        attenuationDistance={1.0} // Light absorption distance
        attenuationColor={new THREE.Color(color)} // Color tint through glass
        depthWrite={false} // Don't write to depth buffer - allows proper layering
      />
    </mesh>
  );
};

// Blob configuration per section
const getBlobsForSection = (
  sectionIndex: number,
  accent: string,
  pageHeight: number
) => {
  const configs: BlobProps[][] = [
    // Section 0 (Hero) - #ff4d62
    [
      {
        position: [-5, 3, -1],
        radius: 2.5,
        color: "#ff4d62",
        dragStrength: 0.4,
        sectionIndex: 0,
        pageHeight,
      },
      {
        position: [4, -2, -4],
        radius: 1.8,
        color: "#ff7b4d",
        dragStrength: 0.6,
        sectionIndex: 0,
        pageHeight,
      },
      {
        position: [-2, -4, -6],
        radius: 1.2,
        color: "#ff4d8a",
        dragStrength: 0.5,
        sectionIndex: 0,
        pageHeight,
      },
      {
        position: [6, 4, -7],
        radius: 2.5,
        color: "#ff4d62",
        dragStrength: 0.3,
        sectionIndex: 0,
        pageHeight,
      },
    ],
    // Section 1 (Street) - #4d9bff
    [
      {
        position: [5, 2, -5],
        radius: 2.2,
        color: "#4d9bff",
        dragStrength: 0.5,
        sectionIndex: 1,
        pageHeight,
      },
      {
        position: [-4, -3, -7],
        radius: 1.6,
        color: "#4dc3ff",
        dragStrength: 0.55,
        sectionIndex: 1,
        pageHeight,
      },
      {
        position: [-1, 5, -4],
        radius: 2.8,
        color: "#4d7bff",
        dragStrength: 0.35,
        sectionIndex: 1,
        pageHeight,
      },
      {
        position: [-6, 2, -6],
        radius: 1.4,
        color: "#6d9bff",
        dragStrength: 0.7,
        sectionIndex: 1,
        pageHeight,
      },
    ],
    // Section 2 (Studio) - #9b5bff
    [
      {
        position: [-3, 4, -5],
        radius: 2.0,
        color: "#9b5bff",
        dragStrength: 0.45,
        sectionIndex: 2,
        pageHeight,
      },
      {
        position: [5, -1, -3],
        radius: 2.4,
        color: "#b55bff",
        dragStrength: 0.5,
        sectionIndex: 2,
        pageHeight,
      },
      {
        position: [-5, -2, -4],
        radius: 1.5,
        color: "#7b5bff",
        dragStrength: 0.6,
        sectionIndex: 2,
        pageHeight,
      },
      {
        position: [0, -4, -6],
        radius: 2.5,
        color: "#9b5bff",
        dragStrength: 0.25,
        sectionIndex: 2,
        pageHeight,
      },
    ],
  ];

  return configs[sectionIndex] || configs[0];
};

const LandingScene: React.FC<LandingSceneProps> = ({ sections }) => {
  const { viewport } = useThree();

  // Høyden til én "side" i ScrollControls == 100vh i world units
  const pageHeight = viewport.height;

  /**
   * IMPORTANT PERF NOTE
   * Never call React setState inside useFrame.
   * It triggers a React re-render every frame and will eventually kill performance.
   *
   * The glass/FBO path is currently disabled in JSX below; keep this OFF unless needed.
   * If/when you enable LiquidGlassPanel, set this to true.
   */
  const ENABLE_GLASS_FBO = false;

  // FBO resolution - lower on mobile for better performance
  const fboSize = isMobile ? 512 : 1024;

  // Create FBO for rendering scene to texture (for glass refraction)
  const renderTarget = useFBO(fboSize, fboSize, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
  });

  const sceneTexture: THREE.Texture | null = ENABLE_GLASS_FBO
    ? renderTarget.texture
    : null;

  // Render scene to FBO for glass effect (only if enabled)
  useFrame((state) => {
    if (!ENABLE_GLASS_FBO) return;
    state.gl.setRenderTarget(renderTarget);
    state.gl.clear();
    state.gl.render(state.scene, state.camera);
    state.gl.setRenderTarget(null);
  }, -1); // Run before main render

  // --- Match CSS-layouten horisontalt ---
  const leftPadding = 0.08;
  const rightPadding = 0.08;
  const contentWidth = 1 - leftPadding - rightPadding;

  const col1Fr = 1.2;
  const col2Fr = 1;
  const totalFr = col1Fr + col2Fr;

  const col1Frac = col1Fr / totalFr;
  const col2Frac = col2Fr / totalFr;

  // Bredde på kolonne 2 (i skjerm-fraksjon)
  const col2WidthFrac = contentWidth * col2Frac;

  // Kolonne 2 i world units:
  const col2WidthWorld = col2WidthFrac * viewport.width;

  // Senterposisjon til høyre kolonne:
  const rightColStart = leftPadding + contentWidth * col1Frac;
  const rightColCenter = rightColStart + (contentWidth * col2Frac) / 2;

  // X-posisjon i world units
  const imageX = (rightColCenter - 0.5) * viewport.width;

  // Full-screen glass panel positioning for ice block effect
  // Each section has a full-width, full-height glass panel creating stacked ice blocks
  const glassX = 0; // Centered horizontally
  const glassWidth = viewport.width; // Full viewport width
  const glassHeight = pageHeight; // Full section height

  return (
    <>
      {/* Background color */}
      <color attach="background" args={["#050608"]} />

      {/* OPTIMIZED LIGHTING: Reduced from 5 to 3 lights for better performance */}
      <ambientLight intensity={1.0} color="#ffffff" />

      {/* Main key light - bright white from top-right */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={2.8}
        color="#ffffff"
      />

      {/* Single multi-color accent point light for color pop */}
      <pointLight
        position={[0, 0, 10]}
        intensity={3.0}
        color="#a070ff"
        distance={30}
        decay={2}
      />

      {/* Blobs for each section */}
      {sections.map((section, sectionIndex) => {
        const blobs = getBlobsForSection(
          sectionIndex,
          section.accent,
          pageHeight
        );
        return blobs.map((blobProps, blobIndex) => (
          <Blob key={`blob-${section.id}-${blobIndex}`} {...blobProps} />
        ));
      })}

      {/* Floating images for each section */}
      {sections.map((section, index) => {
        const yPosition = -index * pageHeight;

        return (
          <FloatingImage
            key={section.id}
            url={section.image.src}
            aspect="16:9"
            maxWidth={col2WidthWorld * 0.9}
            maxHeight={pageHeight * 0.7}
            position={[imageX, yPosition, 2]}
            floatConfig={{
              speed: 1.5,
              rotationIntensity: 0.2,
              floatIntensity: 0.05,
            }}
          />
        );
      })}
    </>
  );
};

export default LandingScene;
