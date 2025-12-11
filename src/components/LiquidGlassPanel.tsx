import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { createLiquidGlassMaterial } from "./LiquidGlassShader";

interface LiquidGlassPanelProps {
    position: [number, number, number];
    width: number;
    height: number;
    tint?: string;
    sceneTexture: THREE.Texture | null;
    sectionIndex: number;
    totalSections: number;
    parallaxStrength?: number;
    borderRadius?: number;
}

const LiquidGlassPanel: React.FC<LiquidGlassPanelProps> = ({
    position,
    width,
    height,
    tint = "#ffffff",
    sceneTexture,
    sectionIndex,
    totalSections,
    parallaxStrength = 0.2,
    borderRadius = 0.3,
}) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const scroll = useScroll();
    const { viewport } = useThree();

    // Create the shader material
    const material = useMemo(() => {
        return createLiquidGlassMaterial({
            tint,
            refractionStrength: 0.025,
            chromaticAberration: 0.004,
            glassOpacity: 0.7,
            edgeGlow: 0.4,
            distortionAmount: 0.012,
        });
    }, [tint]);

    // Create rounded rectangle geometry
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const w = width;
        const h = height;
        const r = Math.min(borderRadius, Math.min(w, h) / 2);

        // Start at top-left corner after the radius
        shape.moveTo(-w / 2 + r, h / 2);

        // Top edge
        shape.lineTo(w / 2 - r, h / 2);
        // Top-right corner
        shape.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - r);

        // Right edge
        shape.lineTo(w / 2, -h / 2 + r);
        // Bottom-right corner
        shape.quadraticCurveTo(w / 2, -h / 2, w / 2 - r, -h / 2);

        // Bottom edge
        shape.lineTo(-w / 2 + r, -h / 2);
        // Bottom-left corner
        shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2, -h / 2 + r);

        // Left edge
        shape.lineTo(-w / 2, h / 2 - r);
        // Top-left corner
        shape.quadraticCurveTo(-w / 2, h / 2, -w / 2 + r, h / 2);

        const geometry = new THREE.ShapeGeometry(shape, 32);
        
        // Generate proper UVs
        const positions = geometry.attributes.position;
        const uvs = new Float32Array(positions.count * 2);
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            uvs[i * 2] = (x + w / 2) / w;
            uvs[i * 2 + 1] = (y + h / 2) / h;
        }
        
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();
        
        return geometry;
    }, [width, height, borderRadius]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();
        const scrollProgress = scroll.offset;

        // Update shader uniforms
        if (material.uniforms) {
            material.uniforms.uTime.value = time;
            material.uniforms.uSceneTexture.value = sceneTexture;
            material.uniforms.uResolution.value.set(
                state.gl.domElement.width,
                state.gl.domElement.height
            );
        }

        // Calculate section visibility (0 to 1 as section comes into view)
        const sectionStart = sectionIndex / totalSections;
        const sectionEnd = (sectionIndex + 1) / totalSections;
        const sectionProgress = THREE.MathUtils.clamp(
            (scrollProgress - sectionStart) / (sectionEnd - sectionStart),
            0,
            1
        );

        // Parallax movement based on scroll
        const parallaxOffset = (scrollProgress - sectionStart) * viewport.height * parallaxStrength;
        meshRef.current.position.y = position[1] + parallaxOffset;

        // Enhanced rotation based on scroll for added depth
        meshRef.current.rotation.x = (scrollProgress - 0.5) * 0.15 + Math.sin(time * 0.3) * 0.02;
        meshRef.current.rotation.y = Math.sin(scrollProgress * Math.PI * 2) * 0.08 + Math.cos(time * 0.4) * 0.03;
        meshRef.current.rotation.z = Math.sin(time * 0.25) * 0.01;

        // Enhanced scale animation with breathing effect
        const breathe = 1 + Math.sin(time * 0.5) * 0.015 + Math.cos(time * 0.7) * 0.008;
        meshRef.current.scale.setScalar(breathe);

        // Fade in/out based on section visibility
        const fadeIn = THREE.MathUtils.smoothstep(sectionProgress, 0, 0.2);
        const fadeOut = THREE.MathUtils.smoothstep(sectionProgress, 0.8, 1);
        const opacity = fadeIn * (1 - fadeOut * 0.3);
        
        if (material.uniforms) {
            material.uniforms.uGlassOpacity.value = 0.7 * opacity;
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={position}
            geometry={geometry}
            material={material}
        />
    );
};

export default LiquidGlassPanel;
