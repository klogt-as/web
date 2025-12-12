import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";
import { isMobile } from "../utils";

type BlobProps = {
  position: [number, number, number];
  radius?: number;
  color: string;
  dragStrength?: number; // How much it drags behind on scroll (default: 0.5)
  sectionIndex: number;
  pageHeight: number;
};

const FloatingBlob: React.FC<BlobProps> = ({
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

    // Moderate floating animation with multiple frequencies for organic movement
    const floatY = Math.sin(time * 0.3 + position[0]) * 0.12;
    const floatX = Math.cos(time * 0.2 + position[1]) * 0.08;

    // Secondary movement with different frequency for more natural drift
    const floatY2 = Math.sin(time * 0.5 + position[1]) * 0.06;
    const floatX2 = Math.cos(time * 0.4 + position[0]) * 0.05;

    // Target positions
    const targetY = baseY + dragOffset + floatY + floatY2;
    const targetX = position[0] + floatX + floatX2;

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

    // Moderate rotation for more dynamic movement
    meshRef.current.rotation.z = Math.sin(time * 0.15) * 0.04;
    meshRef.current.rotation.y = Math.cos(time * 0.12) * 0.03;

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
export const getBlobsForSection = (
  sectionIndex: number,
  accent: string,
  pageHeight: number
): BlobProps[] => {
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
      // {
      //   position: [6, 4, -7],
      //   radius: 2.5,
      //   color: "#ff4d62",
      //   dragStrength: 0.3,
      //   sectionIndex: 0,
      //   pageHeight,
      // },
    ],
    // Section 1 (Street) - #4d9bff
    [
      {
        position: [5, -2, -5],
        radius: 2.2,
        color: "#4d9bff",
        dragStrength: 0.5,
        sectionIndex: 1,
        pageHeight,
      },
      {
        position: [-4, -3, -4],
        radius: 1.6,
        color: "#4dc3ff",
        dragStrength: 0.55,
        sectionIndex: 1,
        pageHeight,
      },
      {
        position: [3, 4, -5],
        radius: 2.8,
        color: "#4dc3ff",
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
        position: [3, 5, -4],
        radius: 2.0,
        color: "#7b5bff",
        dragStrength: 0.45,
        sectionIndex: 2,
        pageHeight,
      },
      {
        position: [5, -2, -4],
        radius: 2.4,
        color: "#b55bff",
        dragStrength: 0.5,
        sectionIndex: 2,
        pageHeight,
      },
      {
        position: [-4, -3, -4],
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

export default FloatingBlob;
