import React from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

type BoundaryDebugProps = {
  sectionIndex: number;
  pageHeight: number;
  zPosition?: number; // Z position for the debug box
};

export const BoundaryDebug: React.FC<BoundaryDebugProps> = ({
  sectionIndex,
  pageHeight,
  zPosition = -3,
}) => {
  const { viewport } = useThree();

  // Calculate full section boundaries
  const yPosition = -sectionIndex * pageHeight;
  const boundaryWidth = viewport.width;
  const boundaryHeight = pageHeight;

  // Calculate corner positions
  const halfWidth = viewport.width / 2;
  const halfHeight = pageHeight / 2;

  return (
    <>
      {/* DEBUG: Boundary visualization box - FULL SECTION SIZE */}
      <mesh position={[0, yPosition, zPosition]}>
        <boxGeometry args={[boundaryWidth, boundaryHeight, 0.1]} />
        <meshBasicMaterial
          color="#00ff00"
          transparent
          opacity={0.15}
          wireframe={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe outline of boundaries */}
      <lineSegments position={[0, yPosition, zPosition]}>
        <edgesGeometry
          args={[new THREE.BoxGeometry(boundaryWidth, boundaryHeight, 0.1)]}
        />
        <lineBasicMaterial
          color="#00ff00"
          transparent
          opacity={0.5}
          linewidth={2}
        />
      </lineSegments>

      {/* Corner markers at section boundaries */}
      {[
        [-halfWidth, halfHeight], // Top left
        [halfWidth, halfHeight], // Top right
        [-halfWidth, -halfHeight], // Bottom left
        [halfWidth, -halfHeight], // Bottom right
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, yPosition + y, zPosition + 0.05]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  );
};

export default BoundaryDebug;
