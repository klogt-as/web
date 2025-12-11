import { Image as DreiImage, type ImageProps as DreiImageProps, Float, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
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
    aspect: AspectKey | number;     // "16:9" | 16/9 | etc.
    maxWidth: number;               // world units
    maxHeight: number;              // world units
    floatConfig?: {
        speed?: number;
        rotationIntensity?: number;
        floatIntensity?: number;
        floatingRange?: [number, number];
    };
    smoothScrollConfig?: {
        enabled?: boolean;          // Enable smooth scroll tracking
        smoothness?: number;        // Lerp factor (0.01-0.3, lower = more lag)
        dragStrength?: number;      // How much the image drags behind (default: 2.0)
    };
};

const FloatingImage = React.forwardRef<Mesh, FloatingImageProps>(
    (
        {
            aspect,
            maxWidth,
            maxHeight,
            floatConfig = {},
            smoothScrollConfig = {},
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
            smoothness = 0.06,        // How fast the image catches up (higher = faster)
            dragStrength = 0.8,       // How much the image drags behind (lower = subtler)
        } = smoothScrollConfig;

        // Ref for the group that wraps everything
        const groupRef = useRef<THREE.Group>(null!);
        
        // Store the current smoothed Y position
        const smoothedY = useRef(0);
        
        // Store previous scroll offset and smoothed velocity
        const prevScrollOffset = useRef(0);
        const smoothedVelocity = useRef(0);
        
        // Get scroll data from ScrollControls
        const scroll = useScroll();

        // Extract base position values
        const basePosition = useMemo(() => {
            if (Array.isArray(position)) {
                return { x: position[0] ?? 0, y: position[1] ?? 0, z: position[2] ?? 0 };
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
            const rawVelocity = (currentScrollOffset - prevScrollOffset.current) / Math.max(delta, 0.001);
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
            smoothedY.current = THREE.MathUtils.lerp(smoothedY.current, targetY, positionSmoothFactor);
            
            // Apply the smoothed position
            groupRef.current.position.y = smoothedY.current;
        });

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

        return (
            <group 
                ref={groupRef} 
                position={[basePosition.x, smoothEnabled ? 0 : basePosition.y, basePosition.z]}
            >
                <Float
                    speed={speed}
                    rotationIntensity={rotationIntensity}
                    floatIntensity={floatIntensity}
                    floatingRange={floatingRange}
                >
                    <DreiImage
                        ref={ref}
                        transparent
                        scale={[width, height]}
                        {...imageProps}
                    />
                </Float>
            </group>
        );
    }
);

FloatingImage.displayName = "FloatingImage";

export default FloatingImage;
