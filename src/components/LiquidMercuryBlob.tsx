import { useThree, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ShaderMaterial, Vector2, Vector3, type Mesh } from "three";
import { useIsMobile } from "../hooks/useIsMobile";

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
  speedMultiplier: 1.0,

  // Scatter control: 0 = liquid/merged, 1 = maximally scattered
  scatter: 0.26,

  spheres: [
    {
      radius: 0.4,
      speed: [0.3, 0.25, 0.2],
      phase: [0, 1.5, 3.0],
      trianglePos: [0.0, 1.1, 0.0], // Top of triangle
    },
    {
      radius: 0.35,
      speed: [0.35, 0.28, 0.22],
      phase: [2.0, 4.2, 1.8],
      trianglePos: [-0.6, 0.2, 0.0], // Middle left
    },
    {
      radius: 0.3,
      speed: [0.32, 0.4, 0.27],
      phase: [5.0, 0.5, 2.5],
      trianglePos: [0.6, 0.2, 0.0], // Middle right
    },
    {
      radius: 0.38,
      speed: [0.38, 0.33, 0.29],
      phase: [3.5, 1.0, 4.5],
      trianglePos: [-1.0, -0.7, 0.0], // Bottom left
    },
    {
      radius: 0.32,
      speed: [0.26, 0.42, 0.31],
      phase: [4.8, 2.7, 0.8],
      trianglePos: [0.0, -0.7, 0.0], // Bottom center
    },
    {
      radius: 0.36,
      speed: [0.34, 0.37, 0.24],
      phase: [1.2, 3.9, 5.5],
      trianglePos: [1.0, -0.7, 0.0], // Bottom right
    },
  ],
  globalMovement: {
    speed: [0.15, 0.12, 0.1],
    range: [0.3, 0.25, 0.2],
  },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Calculate values based on scatter (0-1)
const getScatterValues = (scatter: number) => ({
  movementRange: lerp(0.4, 3.5, scatter), // 0.4 = tight, 3.5 = very scattered
  blendFactor: lerp(0.35, 0.001, scatter), // 0.35 = liquid, 0.001 = almost no merge
  globalMovementFactor: lerp(1.0, 0.1, scatter), // reduce global movement when scattered
});

const MAX_SPHERES = 6; // keep in sync with CONFIG.spheres (max)

export const LiquidMercuryBlob = ({
  scrollProgressRef,
}: {
  scrollProgressRef: React.RefObject<number>;
}) => {
  const { viewport, size } = useThree((s) => ({
    viewport: s.viewport,
    size: s.size,
  }));
  const { width: viewportWidth, height: viewportHeight } = viewport;
  const meshRef = useRef<Mesh>(null);

  // Initialize refs with base values - will be updated in useFrame
  const dynamicMovementRange = useRef(0.4); // Start with tight movement
  const dynamicBlendFactor = useRef(0.35); // Start with liquid blend
  const currentMorphFactor = useRef(0); // 0 = floating, 1 = triangle formation

  const activeCount = Math.min(CONFIG.spheres.length, MAX_SPHERES);

  const material = useMemo(() => {
    // Pack data into uniforms (fixed length, WebGL-friendly)
    const radii = new Float32Array(MAX_SPHERES);
    const speed = new Float32Array(MAX_SPHERES * 3);
    const phase = new Float32Array(MAX_SPHERES * 3);
    const trianglePos = new Float32Array(MAX_SPHERES * 3);

    for (let i = 0; i < MAX_SPHERES; i++) {
      const s = CONFIG.spheres[i] ?? CONFIG.spheres[0];
      radii[i] = s.radius;
      speed[i * 3 + 0] = s.speed[0];
      speed[i * 3 + 1] = s.speed[1];
      speed[i * 3 + 2] = s.speed[2];
      phase[i * 3 + 0] = s.phase[0];
      phase[i * 3 + 1] = s.phase[1];
      phase[i * 3 + 2] = s.phase[2];
      trianglePos[i * 3 + 0] = s.trianglePos[0];
      trianglePos[i * 3 + 1] = s.trianglePos[1];
      trianglePos[i * 3 + 2] = s.trianglePos[2];
    }

    const vertexShader = /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      precision highp float;

      varying vec2 vUv;

      uniform float uTime;
      uniform vec2  uResolution;     // (pixel width,height) * DPR
      uniform float uMovementRange;
      uniform float uBlendFactor;
      uniform float uSpeedMultiplier;
      uniform int   uSphereCount;

      uniform float uRadii[${MAX_SPHERES}];
      uniform float uSpeed[${MAX_SPHERES * 3}];
      uniform float uPhase[${MAX_SPHERES * 3}];
      uniform float uTrianglePos[${MAX_SPHERES * 3}];
      uniform float uMorphFactor;

      uniform vec3 uGlobalSpeed;
      uniform vec3 uGlobalRange;

      float sdSphere(vec3 p, float r) {
        return length(p) - r;
      }

      float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * k * 0.25;
      }

      vec3 globalOffset(float t) {
        return vec3(
          sin(t * uGlobalSpeed.x * uSpeedMultiplier) * uGlobalRange.x,
          sin(t * uGlobalSpeed.y * uSpeedMultiplier) * uGlobalRange.y,
          sin(t * uGlobalSpeed.z * uSpeedMultiplier) * uGlobalRange.z
        );
      }

      float sdf(vec3 pos) {
        vec3 go = globalOffset(uTime);

        // Calculate sphere metaballs
        float d = 1e9;
        
        // Reduce individual movement as we morph to triangle
        float movementFactor = 1.0 - uMorphFactor;
        
        for (int i = 0; i < ${MAX_SPHERES}; i++) {
          if (i >= uSphereCount) break;

          // Individual floating movement
          float sx = sin(uTime * uSpeed[i*3+0] * uSpeedMultiplier + uPhase[i*3+0]) * uMovementRange * movementFactor;
          float sy = sin(uTime * uSpeed[i*3+1] * uSpeedMultiplier + uPhase[i*3+1]) * uMovementRange * movementFactor;
          float sz = sin(uTime * uSpeed[i*3+2] * uSpeedMultiplier + uPhase[i*3+2]) * (uMovementRange * 0.6) * movementFactor;
          vec3 floatPos = vec3(sx, sy, sz);
          
          // Target triangle position
          vec3 targetPos = vec3(uTrianglePos[i*3+0], uTrianglePos[i*3+1], uTrianglePos[i*3+2]);
          
          // Interpolate between floating and triangle position
          vec3 finalPos = mix(floatPos, targetPos, uMorphFactor);

          vec3 p = pos + finalPos + go;
          float di = sdSphere(p, uRadii[i]);

          if (i == 0) d = di;
          else d = smin(d, di, uBlendFactor);
        }
        
        return d;
      }

      vec3 calcNormal(vec3 p) {
        // Smaller eps gives sharper highlights - matches TSL version (0.0001)
        float eps = 0.0001;
        vec2 h = vec2(eps, 0.0);
        float dx = sdf(p + vec3(h.x, h.y, h.y)) - sdf(p - vec3(h.x, h.y, h.y));
        float dy = sdf(p + vec3(h.y, h.x, h.y)) - sdf(p - vec3(h.y, h.x, h.y));
        float dz = sdf(p + vec3(h.y, h.y, h.x)) - sdf(p - vec3(h.y, h.y, h.x));
        return normalize(vec3(dx, dy, dz));
      }

      vec3 lighting(vec3 ro, vec3 p) {
        vec3 n = calcNormal(p);
        vec3 v = normalize(ro - p);

        vec3 ambient = vec3(0.2);
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        vec3 lightColor = vec3(1.0, 1.0, 0.9);
        float dp = max(0.0, dot(lightDir, n));
        vec3 diffuse = dp * lightColor;

        vec3 skyColor = vec3(0.0, 0.3, 0.6);
        vec3 groundColor = vec3(0.0, 0.0, 0.0);  // Changed to black to remove red glow
        float hemiMix = n.y * 0.5 + 0.5;
        vec3 hemi = mix(groundColor, skyColor, hemiMix);

        vec3 r = reflect(-lightDir, n);
        float phongValue = pow(max(0.0, dot(v, normalize(r))), 32.0);
        float fresnel = pow(1.0 - max(0.0, dot(v, n)), 2.0);
        vec3 specular = vec3(phongValue) * fresnel;

        vec3 lit = ambient * 0.1 + diffuse * 0.5 + hemi * 0.2;
        vec3 col = vec3(0.1) * lit + specular;

        return col;
      }

      void main() {
        // Aspect-corrected uv: [-aspect..aspect] x [-1..1]
        vec2 uv = (vUv * uResolution) * 2.0 - uResolution;
        uv /= uResolution.y;

        float cameraDistance = (uSphereCount <= 3) ? -5.0 : -3.0;
        vec3 ro = vec3(0.0, 0.0, cameraDistance);
        vec3 rd = normalize(vec3(uv, 1.0));

        float t = 0.0;
        vec3 p = ro;

        // Raymarch - higher quality for sharper results
        for (int i = 0; i < 100; i++) {
          float d = sdf(p);
          t += d * 0.8;
          p = ro + rd * t;

          if (d < 0.003) break;  // Lower threshold = sharper
          if (t > 50.0) break;
        }

        vec3 col = lighting(ro, p);
        
        // Uncharted 2 tone mapping (better than simple ACES for our use case)
        vec3 x = max(vec3(0.0), col - 0.004);
        col = (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
        
        // col is now in sRGB space (Uncharted 2 does this implicitly)
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(size.width, size.height) }, // Set in useFrame (incl DPR)
        uMovementRange: { value: 0.4 }, // Start with tight movement
        uBlendFactor: { value: 0.35 }, // Start with liquid blend
        uSpeedMultiplier: { value: CONFIG.speedMultiplier },
        uSphereCount: { value: activeCount },

        uRadii: { value: radii },
        uSpeed: { value: speed },
        uPhase: { value: phase },
        uTrianglePos: { value: trianglePos },
        uMorphFactor: { value: 0 },

        uGlobalSpeed: {
          value: new Vector3(
            CONFIG.globalMovement.speed[0],
            CONFIG.globalMovement.speed[1],
            CONFIG.globalMovement.speed[2]
          ),
        },
        uGlobalRange: {
          value: new Vector3(
            CONFIG.globalMovement.range[0],
            CONFIG.globalMovement.range[1],
            CONFIG.globalMovement.range[2]
          ),
        },
      },
    });

    // We do tone mapping manually in the shader, so disable Three.js's
    mat.toneMapped = false;
    mat.dithering = true;

    return mat;
  }, [activeCount, size.width, size.height]);

  useFrame((state) => {
    // Read scrollProgress from ref - this updates every frame
    const scrollProgress = scrollProgressRef.current;

    // Calculate dynamic scatter based on scrollProgress
    // Starts immediately at 0% scroll
    const targetScatter = Math.max(0, CONFIG.scatter * (1 - scrollProgress));

    const currentScatterValues = getScatterValues(targetScatter);

    // Smooth transition to target values
    dynamicMovementRange.current = lerp(
      dynamicMovementRange.current,
      currentScatterValues.movementRange,
      0.05
    );

    dynamicBlendFactor.current = lerp(
      dynamicBlendFactor.current,
      currentScatterValues.blendFactor,
      0.05
    );

    // Morph factor: starts immediately, complete at 0.6 (60% scroll)
    const targetMorph = Math.min(1, scrollProgress / 0.6);
    currentMorphFactor.current = lerp(
      currentMorphFactor.current,
      targetMorph,
      0.05
    );

    material.uniforms.uTime.value = state.clock.getElapsedTime();
    material.uniforms.uMovementRange.value = dynamicMovementRange.current;
    material.uniforms.uBlendFactor.value = dynamicBlendFactor.current;
    material.uniforms.uSphereCount.value = activeCount;
    material.uniforms.uMorphFactor.value = currentMorphFactor.current;

    // Update speed multiplier from CONFIG
    material.uniforms.uSpeedMultiplier.value = CONFIG.speedMultiplier;

    // Update sphere properties from CONFIG (radius, speed, phase)
    const radiiArray = material.uniforms.uRadii.value as Float32Array;
    const speedArray = material.uniforms.uSpeed.value as Float32Array;
    const phaseArray = material.uniforms.uPhase.value as Float32Array;

    for (let i = 0; i < MAX_SPHERES; i++) {
      const s = CONFIG.spheres[i] ?? CONFIG.spheres[0];
      radiiArray[i] = s.radius;
      speedArray[i * 3 + 0] = s.speed[0];
      speedArray[i * 3 + 1] = s.speed[1];
      speedArray[i * 3 + 2] = s.speed[2];
      phaseArray[i * 3 + 0] = s.phase[0];
      phaseArray[i * 3 + 1] = s.phase[1];
      phaseArray[i * 3 + 2] = s.phase[2];
    }

    // Update global movement from CONFIG
    const globalSpeed = material.uniforms.uGlobalSpeed.value as Vector3;
    const globalRange = material.uniforms.uGlobalRange.value as Vector3;

    globalSpeed.set(
      CONFIG.globalMovement.speed[0],
      CONFIG.globalMovement.speed[1],
      CONFIG.globalMovement.speed[2]
    );
    globalRange.set(
      CONFIG.globalMovement.range[0] *
        currentScatterValues.globalMovementFactor,
      CONFIG.globalMovement.range[1] *
        currentScatterValues.globalMovementFactor,
      CONFIG.globalMovement.range[2] * currentScatterValues.globalMovementFactor
    );

    // size is in CSS pixels, and we must multiply with DPR to match TSL's `screenSize`
    const dpr = state.gl.getPixelRatio();
    const pxW = state.size.width * dpr;
    const pxH = state.size.height * dpr;
    (material.uniforms.uResolution.value as Vector2).set(pxW, pxH);
  });

  return (
    <mesh
      ref={meshRef}
      scale={[viewportWidth, viewportHeight, 1]}
      material={material}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};
