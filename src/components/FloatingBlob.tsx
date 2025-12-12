import { useScroll } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { isMobile } from "../utils";
import { useBlobMerge } from "./BlobMergeContext";

// Easing function for smooth animations
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

type BlobProps = {
  position: [number, number, number];
  radius?: number;
  color: string;
  dragStrength?: number; // How much it drags behind on scroll (default: 0.5)
  sectionIndex: number;
  pageHeight: number;
  springConfig?: {
    enabled?: boolean; // Enable spring pull effect (default: true)
    pullStrength?: number; // How much the blob pulls toward mouse (default: 0.3)
    springStiffness?: number; // Spring stiffness (default: 150)
    springDamping?: number; // Spring damping/friction (default: 20)
  };
};

const FloatingBlob: React.FC<BlobProps> = ({
  position,
  radius = 1,
  color,
  dragStrength = 0.5,
  sectionIndex,
  pageHeight,
  springConfig = {},
}) => {
  const {
    enabled: springEnabled = true,
    pullStrength = 0.3,
    springStiffness = 150,
    springDamping = 20,
  } = springConfig;

  const meshRef = useRef<THREE.Mesh>(null!);
  const scroll = useScroll();
  const { viewport } = useThree();

  // Merge context
  const blobMerge = useBlobMerge();

  // Generate unique ID for this blob
  const blobId = useMemo(
    () => `blob-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // Merge state
  const mergeState = useRef({
    isMerging: false,
    targetBlobId: "",
    targetPosition: new THREE.Vector3(),
    targetRadius: 0,
    targetColor: new THREE.Color(),
    progress: 0, // 0 - 1
    springScale: 1,
    springVelocity: 0,
    startPosition: new THREE.Vector3(),
    startRadius: radius,
    startColor: new THREE.Color(color),
  });

  // Current blob properties (can change during merge)
  const currentRadius = useRef(radius);
  const currentColor = useRef(new THREE.Color(color));

  // Store previous scroll offset and smoothed values
  const prevScrollOffset = useRef(0);
  const smoothedVelocity = useRef(0);
  const smoothedY = useRef(position[1] - sectionIndex * pageHeight);
  const smoothedX = useRef(position[0]);

  // Spring state: mouse position, hover state, spring position & velocity
  const mousePos = useRef({ x: 0, y: 0 });
  const isHovered = useRef(false);
  const springPosition = useRef({ x: 0, y: 0 });
  const springVelocity = useRef({ x: 0, y: 0 });

  // Drag state: track if currently dragging and drag offset
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Store permanent position offset from dragging (persists after drag ends)
  const permanentOffset = useRef({ x: 0, y: 0 });

  // Physics: velocity and momentum tracking
  const velocity = useRef({ x: 0, y: 0 });
  const lastDragPos = useRef({ x: 0, y: 0 });
  const lastDragTime = useRef(0);

  // Handle pointer down - start dragging
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!springEnabled) return;
    event.stopPropagation();
    isDragging.current = true;

    // Store the start position for drag offset calculation
    dragStartPos.current = {
      x: event.point.x,
      y: event.point.y,
    };

    // Reset velocity and tracking for new drag
    velocity.current = { x: 0, y: 0 };
    lastDragPos.current = { x: event.point.x, y: event.point.y };
    lastDragTime.current = performance.now();

    // Change cursor to grabbing and prevent text selection
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };

  // Handle pointer move - update drag position or spring effect
  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!springEnabled || !meshRef.current) return;

    if (isDragging.current) {
      // Calculate drag offset from start position
      const currentX = event.point.x;
      const currentY = event.point.y;
      const currentTime = performance.now();

      // Track velocity for momentum
      const timeDelta = (currentTime - lastDragTime.current) / 1000; // Convert to seconds
      if (timeDelta > 0) {
        const velX = (currentX - lastDragPos.current.x) / timeDelta;
        const velY = (currentY - lastDragPos.current.y) / timeDelta;

        // Smooth velocity tracking
        velocity.current.x = velX * 0.3 + velocity.current.x * 0.7;
        velocity.current.y = velY * 0.3 + velocity.current.y * 0.7;
      }

      lastDragPos.current = { x: currentX, y: currentY };
      lastDragTime.current = currentTime;

      // Apply drag offset directly (no mass resistance)
      dragOffset.current.x = currentX - dragStartPos.current.x;
      dragOffset.current.y = currentY - dragStartPos.current.y;

      // Update start position for continuous dragging
      dragStartPos.current.x = currentX;
      dragStartPos.current.y = currentY;
    } else {
      // Spring effect when not dragging
      const intersectionPoint = event.point;
      const blobCenter = meshRef.current.position;

      // Calculate offset from blob center
      const offsetX = intersectionPoint.x - blobCenter.x;
      const offsetY = intersectionPoint.y - blobCenter.y;

      // Normalize to -1 to 1 range based on radius
      const normalizeScale = 1 / (radius * 1.5);
      mousePos.current.x = THREE.MathUtils.clamp(
        offsetX * normalizeScale,
        -1,
        1
      );
      mousePos.current.y = THREE.MathUtils.clamp(
        offsetY * normalizeScale,
        -1,
        1
      );
    }
  };

  // Handle pointer up - stop dragging and apply momentum
  const handlePointerUp = () => {
    if (!springEnabled) return;

    // Save the drag offset to permanent offset
    permanentOffset.current.x += dragOffset.current.x;
    permanentOffset.current.y += dragOffset.current.y;

    // Apply momentum based on drag velocity (subtle, 50% transfer)
    velocity.current.x = velocity.current.x * 0.5;
    velocity.current.y = velocity.current.y * 0.5;

    // Reset drag offset
    dragOffset.current = { x: 0, y: 0 };

    isDragging.current = false;
    document.body.style.cursor = "grab";
    document.body.style.userSelect = "auto";
  };

  // Handle pointer enter
  const handlePointerEnter = () => {
    if (!springEnabled) return;
    isHovered.current = true;
    document.body.style.cursor = "grab";
  };

  // Handle pointer leave
  const handlePointerLeave = () => {
    if (!springEnabled) return;
    isHovered.current = false;
    mousePos.current = { x: 0, y: 0 };
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  // Register blob with merge context
  useEffect(() => {
    blobMerge.registerBlob(blobId, {
      id: blobId,
      position: new THREE.Vector3(
        position[0],
        position[1] - sectionIndex * pageHeight,
        position[2]
      ),
      radius: currentRadius.current,
      color: color,
      sectionIndex,
      isBeingMerged: false,
      meshRef,
    });

    return () => {
      blobMerge.unregisterBlob(blobId);
    };
  }, [blobId, sectionIndex, blobMerge, position, pageHeight, color]);

  // Helper: Calculate volume-weighted color blend
  const blendColors = (
    color1: THREE.Color,
    radius1: number,
    color2: THREE.Color,
    radius2: number
  ): THREE.Color => {
    const volume1 = (4 / 3) * Math.PI * Math.pow(radius1, 3);
    const volume2 = (4 / 3) * Math.PI * Math.pow(radius2, 3);
    const totalVolume = volume1 + volume2;
    const weight1 = volume1 / totalVolume;

    return new THREE.Color().lerpColors(color1, color2, 1 - weight1);
  };

  // Helper: Check for collisions and trigger merge
  const checkCollisions = () => {
    if (mergeState.current.isMerging) return;

    const currentPos = meshRef.current.position;
    const blobs = blobMerge.getBlobsInSection(sectionIndex);

    for (const otherBlob of blobs) {
      if (otherBlob.id === blobId || otherBlob.isBeingMerged) continue;

      const distance = currentPos.distanceTo(otherBlob.position);
      const combinedRadius = currentRadius.current + otherBlob.radius;

      // Auto-attract force only when VERY close (1.3x combined radius)
      const attractionRadius = combinedRadius * 1.3;
      if (distance < attractionRadius && distance > 0.1) {
        const attractionForce = 1.2 / (distance * distance);
        const direction = new THREE.Vector3()
          .subVectors(otherBlob.position, currentPos)
          .normalize();

        // Apply attraction to permanent offset
        permanentOffset.current.x += direction.x * attractionForce * 0.05;
        permanentOffset.current.y += direction.y * attractionForce * 0.05;
      }

      // Check for merge threshold (70% overlap)
      const mergeThreshold = combinedRadius * 0.7;
      if (distance < mergeThreshold) {
        // Determine which blob is smaller (this one merges into the larger)
        const isThisBlobSmaller = currentRadius.current < otherBlob.radius;

        if (isThisBlobSmaller) {
          // THIS blob is smaller - it merges INTO the other blob
          const newRadius = Math.sqrt(
            Math.pow(currentRadius.current, 2) + Math.pow(otherBlob.radius, 2)
          );
          const newColor = blendColors(
            new THREE.Color(otherBlob.color),
            otherBlob.radius,
            currentColor.current,
            currentRadius.current
          );

          // Set merge state - move to other blob's position
          mergeState.current = {
            isMerging: true,
            targetBlobId: otherBlob.id,
            targetPosition: otherBlob.position.clone(),
            targetRadius: newRadius,
            targetColor: newColor,
            progress: 0,
            springScale: 1,
            springVelocity: 0,
            startPosition: currentPos.clone(),
            startRadius: currentRadius.current,
            startColor: currentColor.current.clone(),
          };

          // Mark both blobs as merging in context
          blobMerge.markBlobAsMerging(blobId, true);
          blobMerge.markBlobAsMerging(otherBlob.id, true);
          blobMerge.requestMerge(blobId, otherBlob.id);
        } else {
          // The OTHER blob is smaller - it will merge into THIS one
          // We don't initiate merge here, let the other blob handle it
          // But we need to prepare to grow
          const newRadius = Math.sqrt(
            Math.pow(currentRadius.current, 2) + Math.pow(otherBlob.radius, 2)
          );
          const newColor = blendColors(
            currentColor.current,
            currentRadius.current,
            new THREE.Color(otherBlob.color),
            otherBlob.radius
          );

          // This blob stays in place but grows
          mergeState.current = {
            isMerging: true,
            targetBlobId: otherBlob.id,
            targetPosition: currentPos.clone(), // Stay at current position
            targetRadius: newRadius,
            targetColor: newColor,
            progress: 0,
            springScale: 1,
            springVelocity: 0,
            startPosition: currentPos.clone(),
            startRadius: currentRadius.current,
            startColor: currentColor.current.clone(),
          };

          // Mark both blobs as merging in context
          blobMerge.markBlobAsMerging(blobId, true);
          blobMerge.markBlobAsMerging(otherBlob.id, true);
          blobMerge.requestMerge(blobId, otherBlob.id);
        }

        break;
      }
    }
  };

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

    // Velocity-based scroll drag offset (like FloatingImage)
    const scrollDragOffset = -smoothedVelocity.current * dragStrength;

    // Moderate floating animation with multiple frequencies for organic movement
    const floatY = Math.sin(time * 0.3 + position[0]) * 0.12;
    const floatX = Math.cos(time * 0.2 + position[1]) * 0.08;

    // Secondary movement with different frequency for more natural drift
    const floatY2 = Math.sin(time * 0.5 + position[1]) * 0.06;
    const floatX2 = Math.cos(time * 0.4 + position[0]) * 0.05;

    // Target positions
    const targetY = baseY + scrollDragOffset + floatY + floatY2;
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

    // === COLLISION DETECTION & AUTO-ATTRACT ===
    if (!mergeState.current.isMerging) {
      checkCollisions();
    }

    // === MERGE ANIMATION ===
    if (mergeState.current.isMerging) {
      const merge = mergeState.current;

      // Liquid merge progress (0.8s duration)
      merge.progress += delta * 1.25;

      if (merge.progress < 1) {
        // Phase 1: Liquid merge movement
        const easedProgress = easeInOutCubic(merge.progress);

        // Interpolate position
        meshRef.current.position.lerpVectors(
          merge.startPosition,
          merge.targetPosition,
          easedProgress
        );

        // Animate transmission & thickness for liquid depth effect
        if (meshRef.current.material instanceof THREE.MeshPhysicalMaterial) {
          meshRef.current.material.transmission =
            0.7 + Math.sin(merge.progress * Math.PI) * 0.25;
          meshRef.current.material.thickness =
            2.5 + Math.sin(merge.progress * Math.PI) * 1.2;
        }

        // Animate color blend
        currentColor.current.lerpColors(
          merge.startColor,
          merge.targetColor,
          easedProgress
        );

        // Scale up gradually during merge
        const scaleProgress = Math.min(merge.progress * 1.5, 1);
        const radiusLerp = THREE.MathUtils.lerp(
          merge.startRadius,
          merge.targetRadius,
          scaleProgress
        );
        currentRadius.current = radiusLerp;
        meshRef.current.scale.setScalar(radiusLerp / radius);

        // Update position in context
        blobMerge.updateBlobPosition(blobId, meshRef.current.position);
      } else if (merge.progress < 2) {
        // Phase 2: Spring scale animation (bouncy growth)
        const springProgress = merge.progress - 1; // 0-1 for spring phase

        if (springProgress < 0.01) {
          // Initialize spring with target radius
          merge.springScale = merge.startRadius / radius;
          merge.springVelocity = 0;
        }

        // Spring physics (bouncy!)
        const targetScale = merge.targetRadius / radius;
        const stiffness = 280; // Higher = bouncier
        const damping = 18; // Lower = more bouncy
        const deltaTime = Math.min(delta, 0.1);

        const springForce = (targetScale - merge.springScale) * stiffness;
        const dampingForce = merge.springVelocity * damping;

        merge.springVelocity += (springForce - dampingForce) * deltaTime;
        merge.springScale += merge.springVelocity * deltaTime;

        meshRef.current.scale.setScalar(merge.springScale);
        currentRadius.current = merge.springScale * radius;

        // Keep position at target
        meshRef.current.position.copy(merge.targetPosition);

        // Check if spring settled (very small oscillations)
        if (springProgress > 0.5 && Math.abs(merge.springVelocity) < 0.01) {
          merge.progress = 2; // Force end
        }
      } else {
        // Merge complete!
        const isThisBlobSmaller = merge.startRadius < merge.targetRadius;

        if (isThisBlobSmaller) {
          // This blob was the smaller one - it gets absorbed and disappears
          if (meshRef.current) {
            meshRef.current.visible = false;
          }
          blobMerge.unregisterBlob(blobId);
          return; // Stop updating this blob
        } else {
          // This blob was the larger one - it stays visible and grows
          // Reset merge state and continue as the final blob
          mergeState.current.isMerging = false;
          currentRadius.current = merge.targetRadius;
          currentColor.current.copy(merge.targetColor);

          // Update blob state in context with new properties
          const blob = blobMerge.getBlob(blobId);
          if (blob) {
            blob.radius = currentRadius.current;
            blob.color = `#${merge.targetColor.getHexString()}`;
            blob.isBeingMerged = false;
          }

          // Continue normal movement
        }
      }

      // Skip normal movement during merge
      return;
    }

    // Update position in context for collision detection
    blobMerge.updateBlobPosition(
      blobId,
      new THREE.Vector3(
        smoothedX.current +
          permanentOffset.current.x +
          springPosition.current.x,
        smoothedY.current +
          permanentOffset.current.y +
          springPosition.current.y,
        meshRef.current.position.z
      )
    );

    // === SPRING PULL EFFECT ===
    if (springEnabled && !isDragging.current) {
      // Calculate target position based on mouse position and hover state
      const springTargetX = isHovered.current
        ? mousePos.current.x * pullStrength
        : 0;
      const springTargetY = isHovered.current
        ? mousePos.current.y * pullStrength
        : 0;

      // Spring physics - smooth elastic motion
      // acceleration = -stiffness * (currentPos - targetPos) - damping * velocity
      const deltaTime = Math.min(delta, 0.1); // Clamp delta to avoid huge jumps

      // X axis spring
      const accelX =
        -springStiffness * (springPosition.current.x - springTargetX) -
        springDamping * springVelocity.current.x;
      springVelocity.current.x += accelX * deltaTime;
      springPosition.current.x += springVelocity.current.x * deltaTime;

      // Y axis spring
      const accelY =
        -springStiffness * (springPosition.current.y - springTargetY) -
        springDamping * springVelocity.current.y;
      springVelocity.current.y += accelY * deltaTime;
      springPosition.current.y += springVelocity.current.y * deltaTime;
    }

    // === DRAG POSITION UPDATE ===
    if (isDragging.current) {
      // Apply drag offset
      const newPermanentX = permanentOffset.current.x + dragOffset.current.x;
      const newPermanentY = permanentOffset.current.y + dragOffset.current.y;

      // Define section-specific bounds - FULL SECTION SIZE
      // Each section has its own Y-space, offset by sectionIndex * pageHeight
      const sectionCenterY = -sectionIndex * pageHeight;
      const sectionLeft = -viewport.width / 2;
      const sectionRight = viewport.width / 2;
      const sectionTop = sectionCenterY + pageHeight / 2;
      const sectionBottom = sectionCenterY - pageHeight / 2;

      // Calculate target position
      const targetX = smoothedX.current + newPermanentX;
      const targetY = smoothedY.current + newPermanentY;

      // Clamp position to section-specific boundaries
      // This allows dragging BACK INTO bounds, but not further OUT
      const clampedX = THREE.MathUtils.clamp(
        targetX,
        sectionLeft + radius,
        sectionRight - radius
      );
      const clampedY = THREE.MathUtils.clamp(
        targetY,
        sectionBottom + radius,
        sectionTop - radius
      );

      // Calculate the clamped permanent offset
      permanentOffset.current.x = clampedX - smoothedX.current;
      permanentOffset.current.y = clampedY - smoothedY.current;
      dragOffset.current = { x: 0, y: 0 };
    }

    // === SPRING-BASED MOMENTUM/GLIDE AFTER RELEASE ===
    if (!isDragging.current && !isHovered.current) {
      const velMagnitude = Math.sqrt(
        velocity.current.x ** 2 + velocity.current.y ** 2
      );

      // Apply spring-based momentum if velocity is significant
      if (velMagnitude > 0.01) {
        // Smooth exponential decay for glide effect (butter smooth!)
        const decayFactor = Math.exp(-8 * delta); // Smooth exponential decay
        velocity.current.x *= decayFactor;
        velocity.current.y *= decayFactor;

        // Apply velocity to permanent offset with boundary checking
        const momentumX =
          permanentOffset.current.x + velocity.current.x * delta;
        const momentumY =
          permanentOffset.current.y + velocity.current.y * delta;

        // Define section-specific bounds - FULL SECTION SIZE (same as drag bounds)
        const sectionCenterY = -sectionIndex * pageHeight;
        const sectionLeft = -viewport.width / 2;
        const sectionRight = viewport.width / 2;
        const sectionTop = sectionCenterY + pageHeight / 2;
        const sectionBottom = sectionCenterY - pageHeight / 2;

        const finalX = smoothedX.current + momentumX;
        const finalY = smoothedY.current + momentumY;

        // Check boundaries and apply or bounce with spring
        if (finalX >= sectionLeft + radius && finalX <= sectionRight - radius) {
          permanentOffset.current.x = momentumX;
        } else {
          // Spring bounce at boundaries
          velocity.current.x *= -0.6; // More elastic bounce
        }

        if (finalY >= sectionBottom + radius && finalY <= sectionTop - radius) {
          permanentOffset.current.y = momentumY;
        } else {
          // Spring bounce at boundaries
          velocity.current.y *= -0.6; // More elastic bounce
        }
      } else {
        // Stop momentum when velocity is negligible
        velocity.current = { x: 0, y: 0 };
      }
    }

    // Apply smoothed positions + permanent offset + spring offset
    meshRef.current.position.x =
      smoothedX.current + permanentOffset.current.x + springPosition.current.x;
    meshRef.current.position.y =
      smoothedY.current + permanentOffset.current.y + springPosition.current.y;

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
      position={[
        position[0],
        position[1] - sectionIndex * pageHeight,
        position[2],
      ]}
      renderOrder={renderOrder}
      geometry={geometry}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
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
        position: [-3, -3, -4],
        radius: 1.6,
        color: "#4dc3ff",
        dragStrength: 0.55,
        sectionIndex: 1,
        pageHeight,
      },
      {
        position: [3, 6, -5],
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
