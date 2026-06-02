'use client';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────── Constants ─────────────────────────── */
const LAYER_COUNT = 6;
const MONOLITH_HEIGHT = 4.8;
const MONOLITH_WIDTH = 1.6;
const MONOLITH_DEPTH = 0.9;
const LAYER_HEIGHT = MONOLITH_HEIGHT / LAYER_COUNT;
const AMETHYST = new THREE.Color('#a855f7');
const OBSIDIAN = new THREE.Color('#09090b');
const MAX_SPREAD = 0.55;
const MAX_LAYER_ROTATION = 0.12;

/* ─────────────────── Scroll-tracking hook ──────────────────────── */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;
      setProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return progress;
}

/* ──────────────────── Mouse-tracking hook ──────────────────────── */
function usePointerPosition() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return pointer;
}

/* ─────────────────── Single monolith layer ─────────────────────── */
interface MonolithLayerProps {
  index: number;
  scrollProgress: number;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}

function MonolithLayer({ index, scrollProgress, pointer }: MonolithLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(MONOLITH_WIDTH, LAYER_HEIGHT, MONOLITH_DEPTH, 1, 1, 1);
    return geo;
  }, []);

  const edgesGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(geometry, 15);
  }, [geometry]);

  const baseY = useMemo(() => {
    const bottomY = -MONOLITH_HEIGHT / 2;
    return bottomY + LAYER_HEIGHT / 2 + index * LAYER_HEIGHT;
  }, [index]);

  const smoothScroll = useRef(0);
  const smoothPointerX = useRef(0);
  const smoothPointerY = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current || !edgesRef.current) return;

    const dt = Math.min(delta, 0.05);

    /* Smooth scroll interpolation */
    smoothScroll.current = THREE.MathUtils.lerp(smoothScroll.current, scrollProgress, dt * 3);

    /* Smooth pointer */
    smoothPointerX.current = THREE.MathUtils.lerp(smoothPointerX.current, pointer.current.x, dt * 2);
    smoothPointerY.current = THREE.MathUtils.lerp(smoothPointerY.current, pointer.current.y, dt * 2);

    /* Spread factor: maps early scroll (0–0.5) to full spread */
    const spreadFactor = Math.min(smoothScroll.current / 0.45, 1);
    const eased = spreadFactor * spreadFactor * (3 - 2 * spreadFactor); // smoothstep

    /* Center-out offset: layers further from center spread more */
    const center = (LAYER_COUNT - 1) / 2;
    const distFromCenter = index - center;
    const yOffset = distFromCenter * MAX_SPREAD * eased;

    /* Layer rotation on spread */
    const layerRot = distFromCenter * MAX_LAYER_ROTATION * eased;

    /* Position */
    meshRef.current.position.y = baseY + yOffset;
    meshRef.current.position.x = 0;
    meshRef.current.position.z = 0;

    /* Rotation from mouse + spread */
    meshRef.current.rotation.y = smoothPointerX.current * 0.15 + layerRot * 0.5;
    meshRef.current.rotation.x = smoothPointerY.current * 0.08;
    meshRef.current.rotation.z = layerRot * 0.3;

    /* Sync edges */
    edgesRef.current.position.copy(meshRef.current.position);
    edgesRef.current.rotation.copy(meshRef.current.rotation);

    /* Edge glow intensity: increases with spread */
    const edgeMat = edgesRef.current.material as THREE.LineBasicMaterial;
    edgeMat.opacity = 0.25 + eased * 0.7;
  });

  return (
    <>
      <mesh ref={meshRef} geometry={geometry} position={[0, baseY, 0]}>
        <meshStandardMaterial
          color={OBSIDIAN}
          roughness={0.4}
          metalness={0.8}
          envMapIntensity={0.5}
        />
      </mesh>
      <lineSegments ref={edgesRef} geometry={edgesGeometry} position={[0, baseY, 0]}>
        <lineBasicMaterial color={AMETHYST} transparent opacity={0.25} linewidth={1} />
      </lineSegments>
    </>
  );
}

/* ──────────────────── Full monolith scene ──────────────────────── */
interface MonolithSceneProps {
  scrollProgress: number;
}

function MonolithScene({ scrollProgress }: MonolithSceneProps) {
  const pointer = usePointerPosition();
  const groupRef = useRef<THREE.Group>(null);
  const smoothBaseRot = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;
    smoothBaseRot.current += 0.0008;
    groupRef.current.rotation.y = smoothBaseRot.current;
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[3, 5, 4]} intensity={0.6} color="#a855f7" distance={20} decay={2} />
      <pointLight position={[-4, -3, 2]} intensity={0.25} color="#7c3aed" distance={15} decay={2} />
      <pointLight position={[0, 0, 5]} intensity={0.15} color="#c084fc" distance={12} decay={2} />

      {/* Monolith layers */}
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.15}>
        <group ref={groupRef}>
          {Array.from({ length: LAYER_COUNT }).map((_, i) => (
            <MonolithLayer
              key={i}
              index={i}
              scrollProgress={scrollProgress}
              pointer={pointer}
            />
          ))}
        </group>
      </Float>
    </>
  );
}

/* ──────────────────── Exported canvas wrapper ──────────────────── */
export default function DataMonolith() {
  const scrollProgress = useScrollProgress();

  return (
    <div className="absolute inset-0 z-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <MonolithScene scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
