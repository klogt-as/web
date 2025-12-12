import {
  Image as DreiImage,
  type ImageProps as DreiImageProps,
  Float,
  useScroll,
} from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Mesh } from "three";
import { containAspectSize } from "./FloatingImage.utils";

export const AspectPresets = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "1:1": 1 / 1,
  "9:16": 9 / 16,
  "2:3": 2 / 3,
} as const;

type AspectKey = keyof typeof AspectPresets;

export type FloatingImageProps = DreiImageProps & {
  aspect: AspectKey | number; // "16:9" | 16/9 | etc.
  maxWidth: number; // world units
  maxHeight: number; // world units
  thickness?: number; // Depth of the image plate (default: 0.15)
  floatConfig?: {
    speed?: number;
    rotationIntensity?: number;
    floatIntensity?: number;
    floatingRange?: [number, number];
  };
  smoothScrollConfig?: {
    enabled?: boolean; // Enable smooth scroll tracking
    smoothness?: number; // Lerp factor (0.01-0.3, lower = more lag)
    dragStrength?: number; // How much the image drags behind (default: 2.0)
  };
  tiltConfig?: {
    enabled?: boolean; // Enable 3D tilt on hover (default: true)
    intensity?: number; // Tilt intensity in radians (default: 0.5)
    smoothness?: number; // Lerp factor for damping (default: 0.1)
    resetOnLeave?: boolean; // Reset rotation when pointer leaves (default: true)
    shineEnabled?: boolean; // Enable shine/reflection effect (default: true)
    shineIntensity?: number; // Shine opacity (default: 0.4)
  };
  frameConfig?: {
    enabled?: boolean; // Enable 3D frame (default: true)
    color?: string; // Frame color (default: "#2a2a2a")
    padding?: number; // Frame padding in world units (default: 0.08)
    roughness?: number; // Material roughness (default: 0.7)
    metalness?: number; // Material metalness (default: 0.0)
  };
};

const FloatingImage = React.forwardRef<Mesh, FloatingImageProps>(
  (
    {
      aspect,
      maxWidth,
      maxHeight,
      thickness = 0.15,
      floatConfig = {},
      smoothScrollConfig = {},
      tiltConfig = {},
      frameConfig = {},
      position,
      ...imageProps
    },
    ref
  ) => {
    const {
      speed = 2,
      rotationIntensity = 0.4,
      floatIntensity = 1,
      floatingRange = [-0.1, 0.1],
    } = floatConfig;

    const {
      enabled: smoothEnabled = true,
      smoothness = 0.06, // How fast the image catches up (higher = faster)
      dragStrength = 0.8, // How much the image drags behind (lower = subtler)
    } = smoothScrollConfig;

    const {
      enabled: tiltEnabled = true,
      intensity: tiltIntensity = 0.5,
      smoothness: tiltSmoothness = 0.1,
      resetOnLeave = true,
      shineEnabled = true,
      shineIntensity = 0.4,
    } = tiltConfig;

    const {
      enabled: frameEnabled = true,
      color: frameColor = "#2a2a2a",
      padding: framePadding = 0.08,
      roughness: frameRoughness = 0.7,
      metalness: frameMetalness = 0.0,
    } = frameConfig;

    // Ref for the group that wraps everything
    const groupRef = useRef<THREE.Group>(null!);

    // Ref for the tilt group (inside Float) to access rotation
    const tiltRef = useRef<THREE.Group>(null!);

    // Ref for the shine mesh material to update uniforms
    const shineMaterialRef = useRef<THREE.ShaderMaterial>(null!);

    // Store the current smoothed Y position
    const smoothedY = useRef(0);

    // Store previous scroll offset and smoothed velocity
    const prevScrollOffset = useRef(0);
    const smoothedVelocity = useRef(0);

    // Tilt state: normalized mouse position (-1 to 1) and smoothed rotation
    const mousePos = useRef({ x: 0, y: 0 });
    const isHovered = useRef(false);
    const currentTiltRotation = useRef({ x: 0, y: 0 });

    // Get scroll data from ScrollControls
    const scroll = useScroll();

    // Extract base position values
    const basePosition = useMemo(() => {
      if (Array.isArray(position)) {
        return {
          x: position[0] ?? 0,
          y: position[1] ?? 0,
          z: position[2] ?? 0,
        };
      }
      return { x: 0, y: 0, z: 0 };
    }, [position]);

    // Initialize smoothedY with the base Y position
    useMemo(() => {
      smoothedY.current = basePosition.y;
    }, [basePosition.y]);

    // Animate smooth scroll tracking with velocity-based drag
    useFrame((_, delta) => {
      if (!groupRef.current || !smoothEnabled) return;

      const currentScrollOffset = scroll.offset;

      // Calculate raw velocity (how fast we're scrolling)
      const rawVelocity =
        (currentScrollOffset - prevScrollOffset.current) /
        Math.max(delta, 0.001);
      prevScrollOffset.current = currentScrollOffset;

      // Heavily smooth the velocity for butter-smooth motion
      const velocitySmoothFactor = 1 - Math.pow(0.05, delta);
      smoothedVelocity.current = THREE.MathUtils.lerp(
        smoothedVelocity.current,
        rawVelocity,
        velocitySmoothFactor
      );

      // The drag offset - based on smoothed velocity
      // Negative because scrolling down (positive velocity) should push image up slightly
      const dragOffset = -smoothedVelocity.current * dragStrength;

      // Target Y is base position plus the drag offset
      const targetY = basePosition.y + dragOffset;

      // Smooth lerp towards target position
      const positionSmoothFactor = 1 - Math.pow(1 - smoothness, delta * 60);
      smoothedY.current = THREE.MathUtils.lerp(
        smoothedY.current,
        targetY,
        positionSmoothFactor
      );

      // Apply the smoothed position
      groupRef.current.position.y = smoothedY.current;
    });

    // Animate 3D tilt based on mouse position
    useFrame((_, delta) => {
      if (!tiltRef.current || !tiltEnabled) return;

      // Calculate target rotation based on mouse position and hover state
      // PHYSICS: Image tilts as if mouse is a heavy ball pressing down at that position
      // The side where the mouse is should tilt DOWN (closer to camera)
      // The opposite side should tilt UP (away from camera)
      const targetRotX = isHovered.current
        ? -mousePos.current.y * tiltIntensity // Mouse up = top tilts down (negative rotation)
        : 0;
      const targetRotY = isHovered.current
        ? mousePos.current.x * tiltIntensity // Mouse right = right tilts down (positive rotation)
        : 0;

      // Smooth lerp towards target rotation
      const tiltSmoothFactor = 1 - Math.pow(1 - tiltSmoothness, delta * 60);
      currentTiltRotation.current.x = THREE.MathUtils.lerp(
        currentTiltRotation.current.x,
        targetRotX,
        tiltSmoothFactor
      );
      currentTiltRotation.current.y = THREE.MathUtils.lerp(
        currentTiltRotation.current.y,
        targetRotY,
        tiltSmoothFactor
      );

      // Apply tilt rotation
      tiltRef.current.rotation.x = currentTiltRotation.current.x;
      tiltRef.current.rotation.y = currentTiltRotation.current.y;

      // Update shine effect based on rotation (not mouse position)
      if (shineMaterialRef.current && shineEnabled) {
        shineMaterialRef.current.uniforms.uRotation.value.set(
          currentTiltRotation.current.x,
          currentTiltRotation.current.y
        );
        shineMaterialRef.current.uniforms.uHovered.value = isHovered.current
          ? 1.0
          : 0.0;
      }
    });

    // Handle mouse move to calculate normalized position
    const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
      if (!tiltEnabled) return;

      // Get the UV coordinates from the event (0 to 1)
      if (!event.uv) return;

      // Convert UV (0 to 1) to normalized coordinates (-1 to 1)
      // UV origin is bottom-left, we need to center it
      mousePos.current.x = (event.uv.x - 0.5) * 2;
      mousePos.current.y = (event.uv.y - 0.5) * 2;

      // Clamp to -1 to 1 range
      mousePos.current.x = THREE.MathUtils.clamp(mousePos.current.x, -1, 1);
      mousePos.current.y = THREE.MathUtils.clamp(mousePos.current.y, -1, 1);
    };

    // Handle pointer enter
    const handlePointerEnter = () => {
      if (!tiltEnabled) return;
      isHovered.current = true;
    };

    // Handle pointer leave
    const handlePointerLeave = () => {
      if (!tiltEnabled) return;
      isHovered.current = false;
      if (resetOnLeave) {
        mousePos.current = { x: 0, y: 0 };
      }
    };

    // Parse aspect ratio (string → number)
    const aspectRatio = useMemo(() => {
      return typeof aspect === "string"
        ? AspectPresets[aspect as AspectKey]
        : aspect;
    }, [aspect]);

    // Compute contained image size
    const { width, height } = useMemo(() => {
      return containAspectSize(aspectRatio, maxWidth, maxHeight);
    }, [aspectRatio, maxWidth, maxHeight]);

    // Shine shader - creates a realistic reflection based on surface rotation
    const shineShader = useMemo(
      () => ({
        uniforms: {
          uRotation: { value: new THREE.Vector2(0, 0) },
          uHovered: { value: 0.0 },
          uIntensity: { value: shineIntensity },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec2 uRotation; // Current tilt rotation (rotX, rotY)
          uniform float uHovered;
          uniform float uIntensity;
          varying vec2 vUv;
          
          void main() {
            // Convert UV to centered coordinates (-1 to 1)
            vec2 centeredUV = (vUv - 0.5) * 2.0;
            
            // Fixed light source position (upper-left, slightly forward)
            vec3 lightDir = normalize(vec3(-0.6, 0.6, 1.0));
            
            // Calculate surface normal based on tilt rotation
            // When tilted, the normal changes which affects where light reflects
            vec3 surfaceNormal = normalize(vec3(
              -uRotation.y * 0.8, // X tilt affects normal in X
              uRotation.x * 0.8,  // Y tilt affects normal in Y
              1.0
            ));
            
            // View direction (camera looking at surface)
            vec3 viewDir = vec3(0.0, 0.0, 1.0);
            
            // Calculate reflection vector
            vec3 reflectDir = reflect(-lightDir, surfaceNormal);
            
            // How much the reflection points toward viewer
            float reflection = max(0.0, dot(reflectDir, viewDir));
            reflection = pow(reflection, 8.0); // Sharper highlight
            
            // Add a subtle gradient based on UV position
            vec2 gradientPos = centeredUV + uRotation * 0.5;
            float gradient = 1.0 - length(gradientPos) * 0.5;
            gradient = smoothstep(0.0, 1.0, gradient);
            
            // Combine reflection and gradient
            float finalShine = (reflection * 0.7 + gradient * 0.3) * uHovered * uIntensity;
            
            // Ice/glass-like color with subtle iridescence
            // Changes hue slightly based on angle
            float hueShift = dot(surfaceNormal.xy, vec2(0.5, 0.5)) * 0.15;
            vec3 shineColor = vec3(0.7 + hueShift, 0.9 + hueShift, 1.0);
            
            gl_FragColor = vec4(shineColor, finalShine);
          }
        `,
      }),
      [shineIntensity]
    );

    return (
      <group
        ref={groupRef}
        position={[
          basePosition.x,
          smoothEnabled ? 0 : basePosition.y,
          basePosition.z,
        ]}
      >
        <Float
          speed={speed}
          rotationIntensity={rotationIntensity}
          floatIntensity={floatIntensity}
          floatingRange={floatingRange}
        >
          {/* Invisible interaction plane - OUTSIDE tiltRef so it doesn't rotate */}
          {/* This prevents flickering when the image tilts */}
          <mesh
            position={[0, 0, thickness / 2 + 0.03]}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            visible={false}
          >
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial />
          </mesh>

          {/* Tilt group - separate from Float's animation */}
          <group ref={tiltRef}>
            {/* Museum-style 3D frame with real depth */}
            {frameEnabled && (
              <mesh position={[0, 0, -thickness / 2]} castShadow receiveShadow>
                <boxGeometry
                  args={[
                    width + framePadding,
                    height + framePadding,
                    thickness,
                  ]}
                />
                <meshStandardMaterial
                  color={frameColor}
                  roughness={frameRoughness}
                  metalness={frameMetalness}
                />
              </mesh>
            )}

            {/* The actual image on the front */}
            <DreiImage
              ref={ref}
              transparent
              scale={[width, height]}
              position={[0, 0, 0.001]}
              receiveShadow
              {...imageProps}
            />

            {/* Shine overlay - ice/glass reflection effect */}
            {shineEnabled && (
              <mesh position={[0, 0, 0.002]}>
                <planeGeometry args={[width, height]} />
                <shaderMaterial
                  ref={shineMaterialRef}
                  vertexShader={shineShader.vertexShader}
                  fragmentShader={shineShader.fragmentShader}
                  uniforms={shineShader.uniforms}
                  transparent
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            )}
          </group>
        </Float>
      </group>
    );
  }
);

FloatingImage.displayName = "FloatingImage";

export default FloatingImage;
