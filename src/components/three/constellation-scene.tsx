"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { buildConstellation, CLUSTERS } from "./constellation-data";
import type { RenderStrategy } from "./render-strategy";

const vertex = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.25 + aPhase) * 0.06;
    p.y += cos(uTime * 0.2 + aPhase * 1.3) * 0.06;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (7.0 / -mv.z);
    vColor = aColor;
    vAlpha = 0.55 + 0.45 * sin(uTime * 0.8 + aPhase);
  }
`;

const fragment = /* glsl */ `
  uniform float uLight;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 c = mix(vColor, vColor * 0.35, uLight);
    gl_FragColor = vec4(c, a * vAlpha);
  }
`;

function Field({ strategy, light, labels }: { strategy: RenderStrategy; light: boolean; labels: RefObject<(HTMLAnchorElement | null)[]> }) {
  const data = useMemo(() => buildConstellation(strategy.particles, strategy.dust, strategy.lines), [strategy]);
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { gl, camera, size } = useThree();
  const projected = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPixelRatio: { value: gl.getPixelRatio() }, uLight: { value: 0 } }), [gl]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scroll.current = Math.min(1, window.scrollY / window.innerHeight);
    };
    onScroll();
    if (strategy.pointerParallax) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [strategy.pointerParallax]);

  useEffect(() => {
    uniforms.uLight.value = light ? 1 : 0;
  }, [light, uniforms]);

  useFrame((state, delta) => {
    uniforms.uTime.value += Math.min(delta, 0.05);
    const g = group.current;
    if (!g) return;
    // Slow drift + pointer parallax; scrolling dollies the camera through the field.
    g.rotation.y += delta * 0.025;
    const targetX = pointer.current.y * 0.12;
    g.rotation.x += (targetX - g.rotation.x) * 0.04;
    camera.position.x += (pointer.current.x * 0.6 - camera.position.x) * 0.03;
    camera.position.y += (-pointer.current.y * 0.35 + scroll.current * 1.2 - camera.position.y) * 0.03;
    camera.position.z += (9 - scroll.current * 3.5 - camera.position.z) * 0.05;
    camera.lookAt(0, scroll.current * 0.6, 0);
    // Project region centres to screen space and move the DOM labels there.
    g.updateMatrixWorld();
    CLUSTERS.forEach((c, i) => {
      const el = labels.current?.[i];
      if (!el) return;
      projected.set(c.position[0], c.position[1] + 0.38, c.position[2]).applyMatrix4(g.matrixWorld).project(camera);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = projected.z < 1 ? "1" : "0";
    });
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} blending={light ? THREE.NormalBlending : THREE.AdditiveBlending} />
      </points>
      {strategy.lines && data.segments.length ? (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.segments, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={light ? "#1a1c20" : "#cfd3da"} transparent opacity={light ? 0.12 : 0.09} depthWrite={false} />
        </lineSegments>
      ) : null}
    </group>
  );
}

export default function ConstellationScene({ strategy, onReady }: { strategy: RenderStrategy; onReady?: () => void }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [light, setLight] = useState(false);
  const labels = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    setLight(document.documentElement.dataset.theme === "light");
    const onTheme = (e: Event) => setLight((e as CustomEvent).detail === "light");
    window.addEventListener("studio:theme", onTheme);
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { rootMargin: "100px" });
    if (wrapper.current) io.observe(wrapper.current);
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("studio:theme", onTheme);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={wrapper} className="absolute inset-0">
      <Canvas
        dpr={strategy.dpr}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0, 9], fov: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => onReady?.()}
        aria-hidden
      >
        <Field strategy={strategy} light={light} labels={labels} />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {CLUSTERS.map((c, i) => (
          <Link
            key={c.key}
            href={c.href}
            tabIndex={-1}
            ref={(el) => {
              labels.current[i] = el;
            }}
            className="pointer-events-auto absolute left-0 top-0 whitespace-nowrap rounded-full border border-line bg-bg/40 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-muted opacity-0 backdrop-blur-sm transition-[color,border-color] hover:border-accent/50 hover:text-fg"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
