// @ts-nocheck - three/tsl doesn't have complete TypeScript definitions yet
import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useScroll } from "@react-three/drei";
import {
  float,
  Loop,
  If,
  Break,
  Fn,
  uv,
  vec3,
  sin,
  cos,
  min,
  max,
  abs,
  mix,
  normalize,
  dot,
  reflect,
  vec2,
  screenSize,
  uniform,
} from "three/tsl";
import { MeshBasicNodeMaterial } from "three/webgpu";
import type { Mesh } from "three";

// ========================================
// CONFIGURATION - Adjust these values easily!
// ========================================
const CONFIG = {
  // Movement settings
  speedMultiplier: 1.0, // Global speed control: 0.5 = half speed, 2.0 = double speed
  movementRange: 0.6, // Distance spheres move: 0.5 = tight, 1.5 = wide, 2.0 = very wide

  // Blending settings
  blendFactor: 0.3, // Sphere blending: 0.1 = separate spheres, 0.5 = smooth liquid

  // Sphere settings - Add or remove spheres here!
  // Each sphere has: radius, speed[x,y,z], phase[x,y,z]
  // - radius: Size of sphere (0.2-0.5 recommended)
  // - speed: How fast it moves on each axis (0.2-0.5 recommended)
  // - phase: Starting offset (0-6, makes spheres move differently)
  spheres: [
    { radius: 0.4, speed: [0.3, 0.25, 0.2], phase: [0, 1.5, 3.0] },
    { radius: 0.35, speed: [0.35, 0.28, 0.22], phase: [2.0, 4.2, 1.8] },
    { radius: 0.3, speed: [0.32, 0.4, 0.27], phase: [5.0, 0.5, 2.5] },
    { radius: 0.38, speed: [0.38, 0.33, 0.29], phase: [3.5, 1.0, 4.5] },
    { radius: 0.32, speed: [0.26, 0.42, 0.31], phase: [4.8, 2.7, 0.8] },
    { radius: 0.36, speed: [0.34, 0.37, 0.24], phase: [1.2, 3.9, 5.5] },
    // Add more spheres by copying a line above and changing the values!
    // Example: { radius: 0.3, speed: [0.3, 0.3, 0.2], phase: [1.0, 2.0, 4.0] },
  ],

  // Global movement - slow drift for the entire scene
  globalMovement: {
    speed: [0.15, 0.12, 0.1], // Speed on each axis
    range: [0.3, 0.25, 0.2], // Distance of global drift
  },
};
// ========================================
// HOW TO USE:
// 1. Want faster movement? Increase speedMultiplier to 1.5 or 2.0
// 2. Want spheres further apart? Increase movementRange to 1.5 or 2.0
// 3. Want more separate spheres? Decrease blendFactor to 0.15 or 0.2
// 4. Want more spheres? Copy a sphere line and add it to the array!
// 5. Want fewer spheres? Delete a sphere line from the array
// ========================================

const sdSphere = Fn(([p, r]) => {
  return p.length().sub(r);
});

const smin = Fn(([a, b, k]) => {
  const h = max(k.sub(abs(a.sub(b))), 0).div(k);
  return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
});

// Helper function for linear interpolation
const lerp = (start: number, end: number, t: number) => {
  return start + (end - start) * t;
};

export const LiquidMercuryBlob = () => {
  const { width, height } = useThree((state) => state.viewport);
  const meshRef = useRef<Mesh>(null);
  const isMobile = useIsMobile();
  const scroll = useScroll();

  // Track dynamic movement range and blend factor
  const dynamicMovementRange = useRef(CONFIG.movementRange);
  const dynamicBlendFactor = useRef(CONFIG.blendFactor);

  // Use fewer spheres on mobile for better performance
  const activeSpheres = useMemo(() => {
    return isMobile ? CONFIG.spheres.slice(0, 3) : CONFIG.spheres;
  }, [isMobile]);

  const material = useMemo(() => {
    const timer = uniform(0);

    const sdf = Fn(([pos]) => {
      // Global offset - slow gentle movement for the entire scene
      const globalOffset = vec3(
        sin(
          timer.mul(CONFIG.globalMovement.speed[0] * CONFIG.speedMultiplier)
        ).mul(CONFIG.globalMovement.range[0]),
        sin(
          timer.mul(CONFIG.globalMovement.speed[1] * CONFIG.speedMultiplier)
        ).mul(CONFIG.globalMovement.range[1]),
        sin(
          timer.mul(CONFIG.globalMovement.speed[2] * CONFIG.speedMultiplier)
        ).mul(CONFIG.globalMovement.range[2])
      );

      // Generate sphere positions dynamically from activeSpheres
      const sphereDistances = activeSpheres.map((sphere, i) => {
        const posOffset = pos.add(
          vec3(
            sin(
              timer
                .mul(sphere.speed[0] * CONFIG.speedMultiplier)
                .add(sphere.phase[0])
            ).mul(CONFIG.movementRange),
            sin(
              timer
                .mul(sphere.speed[1] * CONFIG.speedMultiplier)
                .add(sphere.phase[1])
            ).mul(CONFIG.movementRange),
            sin(
              timer
                .mul(sphere.speed[2] * CONFIG.speedMultiplier)
                .add(sphere.phase[2])
            ).mul(CONFIG.movementRange * 0.6)
          ).add(globalOffset)
        );
        return sdSphere(posOffset, sphere.radius);
      });

      // Blend all spheres together
      let result = sphereDistances[0].toVar();
      for (let i = 1; i < sphereDistances.length; i++) {
        result.assign(smin(result, sphereDistances[i], CONFIG.blendFactor));
      }

      return result;
    });

    const calcNormal = Fn(([p]) => {
      const eps = float(0.0001);
      const h = vec2(eps, 0);
      return normalize(
        vec3(
          sdf(p.add(h.xyy)).sub(sdf(p.sub(h.xyy))),
          sdf(p.add(h.yxy)).sub(sdf(p.sub(h.yxy))),
          sdf(p.add(h.yyx)).sub(sdf(p.sub(h.yyx)))
        )
      );
    });

    const lighting = Fn(([ro, r]) => {
      const normal = calcNormal(r);
      const viewDir = normalize(ro.sub(r));

      // Step 1: Ambient light
      const ambient = vec3(0.2);

      // Step 2: Diffuse lighting - gives our shape a 3D look by simulating how light reflects in all directions
      const lightDir = normalize(vec3(1, 1, 1));
      const lightColor = vec3(1, 1, 0.9);
      const dp = max(0, dot(lightDir, normal));

      const diffuse = dp.mul(lightColor);

      // Step 3: Hemisphere light - a mix between a sky and ground colour based on normals
      const skyColor = vec3(0, 0.3, 0.6);
      const groundColor = vec3(0.6, 0.3, 0.1);

      const hemiMix = normal.y.mul(0.5).add(0.5);
      const hemi = mix(groundColor, skyColor, hemiMix);

      // Step 4: Phong specular - Reflective light and highlights
      const ph = normalize(reflect(lightDir.negate(), normal));
      const phongValue = max(0, dot(viewDir, ph)).pow(32);

      const specular = vec3(phongValue).toVar();

      // Step 5: Fresnel effect - makes our specular highlight more pronounced at different viewing angles
      const fresnel = float(1)
        .sub(max(0, dot(viewDir, normal)))
        .pow(2);

      specular.mulAssign(fresnel);

      // Lighting is a mix of ambient, hemi, diffuse, then specular added at the end
      // We're multiplying these all by different values to control their intensity

      // Step 1
      const lighting = ambient.mul(0.1);

      // Step 2
      lighting.addAssign(diffuse.mul(0.5));

      // Step 3
      lighting.addAssign(hemi.mul(0.2));

      const finalColor = vec3(0.1).mul(lighting).toVar();

      // Step 4 & 5
      finalColor.addAssign(specular);

      return finalColor;
    });

    const raymarch = Fn(() => {
      // Use frag coordinates to get an aspect-fixed UV
      const _uv = uv()
        .mul(screenSize.xy)
        .mul(2)
        .sub(screenSize.xy)
        .div(screenSize.y);

      // Initialize the ray and its direction - zoom out on mobile for better overview
      const cameraDistance = isMobile ? -5 : -3;
      const rayOrigin = vec3(0, 0, cameraDistance);
      const rayDirection = vec3(_uv, 1).normalize();

      // Total distance travelled - note that toVar is important here so we can assign to this variable
      const t = float(0).toVar();

      // Calculate the initial position of the ray - this var is declared here so we can use it in lighting calculations later
      const ray = rayOrigin.add(rayDirection.mul(t)).toVar();

      Loop({ start: 1, end: 80 }, () => {
        const d = sdf(ray); // current distance to the scene

        t.addAssign(d.mul(0.8)); // slightly reduce the marching step

        ray.assign(rayOrigin.add(rayDirection.mul(t))); // position along the ray

        // If we're close enough, it's a hit, so we can do an early return
        If(d.lessThan(0.005), () => {
          // increase threshold
          Break();
        });

        // If we've travelled too far, we can return now and consider that this ray didn't hit anything
        If(t.greaterThan(50), () => {
          // reduce maximum distance
          Break();
        });
      });

      return lighting(rayOrigin, ray);
    })();

    const raymarchMaterial = new MeshBasicNodeMaterial();
    raymarchMaterial.colorNode = raymarch;

    return { material: raymarchMaterial, timer };
  }, [activeSpheres, isMobile]);

  useFrame((state) => {
    const scrollOffset = scroll.offset; // 0 to 1 across all pages

    // Dynamically adjust movement range based on scroll position
    // Hero (0): compact (0.4)
    // Expertise (0.5): medium spreading (0.95)
    // Contact (1.0): maximum spread (1.5)
    const targetMovementRange = lerp(0.4, 1.5, scrollOffset);

    // Smoothly interpolate to target value
    dynamicMovementRange.current = lerp(
      dynamicMovementRange.current,
      targetMovementRange,
      0.05 // Smoothing factor
    );

    // Dynamically adjust blend factor to make spheres more separate as we scroll
    // Hero (0): smooth liquid (0.3)
    // Contact (1.0): more separate (0.15)
    const targetBlendFactor = lerp(0.3, 0.15, scrollOffset);

    dynamicBlendFactor.current = lerp(
      dynamicBlendFactor.current,
      targetBlendFactor,
      0.05
    );

    // Update CONFIG values that the shader uses
    CONFIG.movementRange = dynamicMovementRange.current;
    CONFIG.blendFactor = dynamicBlendFactor.current;

    // Update the timer uniform using the clock
    material.timer.value = state.clock.getElapsedTime();
  });

  return (
    <mesh ref={meshRef} scale={[width, height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material.material} attach="material" />
    </mesh>
  );
};
