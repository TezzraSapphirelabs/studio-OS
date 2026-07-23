"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------
// Premium Shader for Monochrome Liquid / Aurora
// ----------------------------------------------------------------------

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

// Classic 3D simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

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
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// FBM for layered complexity
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  
  // Calculate aspect-corrected UVs for noise
  vec2 noiseUv = uv;
  noiseUv.x *= uResolution.x / uResolution.y;
  
  // Add extremely subtle mouse parallax to the noise field
  noiseUv += uMouse * 0.05;

  // Time scaled down for slow, calming movement
  float time = uTime * 0.15;
  
  // Create a swirling distortion field
  float q1 = fbm(vec3(noiseUv * 1.5, time));
  float q2 = fbm(vec3(noiseUv * 1.5 + vec2(q1), time * 1.2));
  
  // Final noise field
  float noise = fbm(vec3(noiseUv * 2.0 + vec2(q2 * 2.0), time * 0.8));
  
  // Map noise to a beautiful monochrome palette (dark grey to soft white)
  // We want it to be mostly dark, with smooth glowing highlights
  
  // Normalize noise to [0, 1] approximately
  noise = (noise + 1.0) * 0.5;
  
  // Create a vignette to darken the edges
  float dist = distance(uv, vec2(0.5));
  float vignette = smoothstep(0.8, 0.2, dist);
  
  // Base colors
  vec3 colorBlack = vec3(0.01, 0.01, 0.01);
  vec3 colorGrey = vec3(0.08, 0.08, 0.09);
  vec3 colorWhite = vec3(0.7, 0.7, 0.75); // Soft cool white
  
  // Blend colors based on the non-linear noise
  vec3 color = mix(colorBlack, colorGrey, smoothstep(0.1, 0.5, noise));
  color = mix(color, colorWhite, smoothstep(0.6, 0.9, noise));
  
  // Apply vignette
  color *= vignette * 1.5;
  
  // Add premium film grain
  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233)) + time * 10.0) * 43758.5453);
  color += grain * 0.02; // Very subtle noise
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const AuroraMesh = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // Mouse tracking state
  const mouse = useRef(new THREE.Vector2(0, 0));
  const targetMouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates to [-1, 1]
      targetMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) }
    }),
    []
  );

  useEffect(() => {
    // Handle resize
    const handleResize = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value.set(
          window.innerWidth,
          window.innerHeight
        );
      }
    };
    
    handleResize(); // Init
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      
      // Smoothly interpolate mouse for elegant, liquid transitions
      mouse.current.lerp(targetMouse.current, 0.02);
      materialRef.current.uniforms.uMouse.value.copy(mouse.current);
    }
  });

  return (
    <mesh ref={meshRef}>
      {/* Plane that covers the entire camera view */}
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
};

export const AuroraBackground = ({ children, className }: { children?: React.ReactNode, className?: string }) => {
  return (
    <div className={cn("relative min-h-screen w-full bg-[#000] overflow-hidden", className)}>
      
      {/* WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas 
          orthographic 
          camera={{ position: [0, 0, 1], left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10 }}
          dpr={[1, 2]} // Support retina displays for crispness
        >
          <AuroraMesh />
        </Canvas>
      </div>
      
      {/* UI Content Layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
