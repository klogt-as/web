import * as THREE from "three";

// Detect mobile device for performance optimization
const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Liquid Glass Shader - Apple-inspired glass effect with refraction and reflections
// Optimized for mobile performance following WebGL best practices
export const liquidGlassShader = {
    uniforms: {
        uSceneTexture: { value: null as THREE.Texture | null },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uRefractionStrength: { value: 0.02 },
        uChromaticAberration: { value: isMobile ? 0.002 : 0.003 },
        uFresnelPower: { value: 2.5 },
        uFresnelBias: { value: 0.1 },
        uTint: { value: new THREE.Color("#ffffff") },
        uTintStrength: { value: 0.15 },
        uBlurStrength: { value: isMobile ? 0.3 : 0.5 },
        uGlassOpacity: { value: 0.85 },
        uEdgeGlow: { value: 0.3 },
        uNoiseScale: { value: 3.0 },
        uNoiseSpeed: { value: 1.2 },
        uDistortionAmount: { value: isMobile ? 0.025 : 0.035 },
        uIsMobile: { value: isMobile ? 1.0 : 0.0 },
    },

    vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
        }
    `,

    fragmentShader: /* glsl */ `
        uniform sampler2D uSceneTexture;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uRefractionStrength;
        uniform float uChromaticAberration;
        uniform float uFresnelPower;
        uniform float uFresnelBias;
        uniform vec3 uTint;
        uniform float uTintStrength;
        uniform float uBlurStrength;
        uniform float uGlassOpacity;
        uniform float uEdgeGlow;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        uniform float uDistortionAmount;
        uniform float uIsMobile;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vWorldPosition;
        
        // Simplex noise for liquid distortion
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            
            i = mod289(i);
            vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;
            
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        // Fractal brownian motion - optimized with 2 iterations for mobile
        float fbm(vec3 p) {
            // Use 2 octaves on mobile, 3 on desktop for better performance
            float value = snoise(p) * 0.6;
            value += snoise(p * 2.0) * 0.3;
            // Only add third octave on desktop (when uIsMobile is 0)
            value += snoise(p * 4.0) * 0.1 * (1.0 - uIsMobile);
            return value;
        }
        
        // Fresnel effect calculation
        float fresnel(vec3 viewDir, vec3 normal, float power, float bias) {
            return bias + (1.0 - bias) * pow(1.0 - abs(dot(viewDir, normal)), power);
        }
        
        // Optimized 5-tap blur (instead of 25-tap)
        // Much better performance on mobile while still looking good
        vec3 blur5(sampler2D tex, vec2 uv, float strength) {
            vec2 texelSize = 1.0 / uResolution * strength * 2.0;
            
            // Center sample with highest weight
            vec3 result = texture2D(tex, uv).rgb * 0.4;
            
            // 4 directional samples
            result += texture2D(tex, uv + vec2(texelSize.x, 0.0)).rgb * 0.15;
            result += texture2D(tex, uv - vec2(texelSize.x, 0.0)).rgb * 0.15;
            result += texture2D(tex, uv + vec2(0.0, texelSize.y)).rgb * 0.15;
            result += texture2D(tex, uv - vec2(0.0, texelSize.y)).rgb * 0.15;
            
            return result;
        }
        
        // Higher quality 9-tap blur for desktop
        vec3 blur9(sampler2D tex, vec2 uv, float strength) {
            vec2 texelSize = 1.0 / uResolution * strength * 2.0;
            
            vec3 result = texture2D(tex, uv).rgb * 0.25;
            
            // Cardinal directions
            result += texture2D(tex, uv + vec2(texelSize.x, 0.0)).rgb * 0.125;
            result += texture2D(tex, uv - vec2(texelSize.x, 0.0)).rgb * 0.125;
            result += texture2D(tex, uv + vec2(0.0, texelSize.y)).rgb * 0.125;
            result += texture2D(tex, uv - vec2(0.0, texelSize.y)).rgb * 0.125;
            
            // Diagonal directions
            result += texture2D(tex, uv + vec2(texelSize.x, texelSize.y)).rgb * 0.0625;
            result += texture2D(tex, uv - vec2(texelSize.x, texelSize.y)).rgb * 0.0625;
            result += texture2D(tex, uv + vec2(texelSize.x, -texelSize.y)).rgb * 0.0625;
            result += texture2D(tex, uv - vec2(texelSize.x, -texelSize.y)).rgb * 0.0625;
            
            return result;
        }
        
        // Adaptive blur - uses 5-tap on mobile, 9-tap on desktop
        vec3 blur(sampler2D tex, vec2 uv, float strength) {
            if (uIsMobile > 0.5) {
                return blur5(tex, uv, strength);
            }
            return blur9(tex, uv, strength);
        }
        
        void main() {
            vec3 viewDir = normalize(vViewPosition);
            vec3 normal = normalize(vNormal);
            
            // Create liquid distortion using animated noise
            float time = uTime * uNoiseSpeed;
            vec3 noiseCoord = vec3(vUv * uNoiseScale, time * 0.5);
            
            float noise1 = fbm(noiseCoord);
            float noise2 = fbm(noiseCoord + vec3(5.2, 1.3, 2.8));
            
            vec2 distortion = vec2(noise1, noise2) * uDistortionAmount;
            
            // Apply normal-based refraction
            vec2 refractOffset = normal.xy * uRefractionStrength;
            
            // Final UV with distortion and refraction
            vec2 distortedUv = vUv + distortion + refractOffset;
            
            // Chromatic aberration - separate RGB channels slightly
            float chromaticOffset = uChromaticAberration;
            vec3 color;
            color.r = blur(uSceneTexture, distortedUv + vec2(chromaticOffset, 0.0), uBlurStrength).r;
            color.g = blur(uSceneTexture, distortedUv, uBlurStrength).g;
            color.b = blur(uSceneTexture, distortedUv - vec2(chromaticOffset, 0.0), uBlurStrength).b;
            
            // Calculate fresnel for edge glow
            float fresnelFactor = fresnel(viewDir, normal, uFresnelPower, uFresnelBias);
            
            // Glass tint
            vec3 tintedColor = mix(color, color * uTint, uTintStrength);
            
            // Add edge glow/highlight
            vec3 highlight = vec3(1.0) * fresnelFactor * uEdgeGlow;
            
            // Add subtle specular highlight at top
            float topLight = smoothstep(0.3, 0.7, vUv.y) * 0.15;
            vec3 specular = vec3(1.0) * topLight * (1.0 - fresnelFactor * 0.5);
            
            // Inner glow with tint color
            vec3 innerGlow = uTint * fresnelFactor * 0.2;
            
            // Combine all effects
            vec3 finalColor = tintedColor + highlight + specular + innerGlow;
            
            // Glass opacity with fresnel (edges more visible)
            float alpha = mix(uGlassOpacity, 1.0, fresnelFactor * 0.3);
            
            // Subtle vignette for depth
            float vignette = 1.0 - length(vUv - 0.5) * 0.3;
            finalColor *= vignette;
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `,
};

// Create a shader material instance
export const createLiquidGlassMaterial = (options?: {
    tint?: THREE.Color | string;
    refractionStrength?: number;
    chromaticAberration?: number;
    glassOpacity?: number;
    edgeGlow?: number;
    distortionAmount?: number;
}) => {
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uSceneTexture: { value: null },
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uRefractionStrength: { value: options?.refractionStrength ?? 0.02 },
            uChromaticAberration: { value: options?.chromaticAberration ?? (isMobile ? 0.002 : 0.003) },
            uFresnelPower: { value: 2.5 },
            uFresnelBias: { value: 0.1 },
            uTint: { value: options?.tint instanceof THREE.Color ? options.tint : new THREE.Color(options?.tint ?? "#ffffff") },
            uTintStrength: { value: 0.15 },
            uBlurStrength: { value: isMobile ? 0.3 : 0.5 },
            uGlassOpacity: { value: options?.glassOpacity ?? 0.85 },
            uEdgeGlow: { value: options?.edgeGlow ?? 0.3 },
            uNoiseScale: { value: 3.0 },
            uNoiseSpeed: { value: 1.2 },
            uDistortionAmount: { value: options?.distortionAmount ?? (isMobile ? 0.025 : 0.035) },
            uIsMobile: { value: isMobile ? 1.0 : 0.0 },
        },
        vertexShader: liquidGlassShader.vertexShader,
        fragmentShader: liquidGlassShader.fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    return material;
};

// Export isMobile for use in other components (e.g., FBO resolution)
export { isMobile };
