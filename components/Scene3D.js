"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/* ─── Particle network: gold nodes + connecting lines ─── */
function ParticleNetwork({ count = 80, mouse }) {
  const mesh = useRef();
  const linesRef = useRef();

  const { positions, velocities, basePositions } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 8 - 2;
      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;
      base[i3] = x;
      base[i3 + 1] = y;
      base[i3 + 2] = z;
      vel[i3] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.003;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return { positions: pos, velocities: vel, basePositions: base };
  }, [count]);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry(), []);

  useFrame((state) => {
    if (!mesh.current) return;
    const geo = mesh.current.geometry;
    const posAttr = geo.attributes.position;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posAttr.array[i3] = basePositions[i3] + Math.sin(time * 0.3 + i * 0.5) * 0.4 + velocities[i3] * 20;
      posAttr.array[i3 + 1] = basePositions[i3 + 1] + Math.cos(time * 0.25 + i * 0.7) * 0.3 + velocities[i3 + 1] * 20;
      posAttr.array[i3 + 2] = basePositions[i3 + 2] + Math.sin(time * 0.2 + i * 0.3) * 0.2;
    }
    posAttr.needsUpdate = true;

    // Mouse influence
    if (mouse.current) {
      mesh.current.rotation.y = THREE.MathUtils.lerp(
        mesh.current.rotation.y,
        mouse.current.x * 0.15,
        0.05
      );
      mesh.current.rotation.x = THREE.MathUtils.lerp(
        mesh.current.rotation.x,
        mouse.current.y * 0.1,
        0.05
      );
    }

    // Update lines
    if (linesRef.current) {
      const linePos = linesRef.current.geometry.attributes.position;
      let idx = 0;
      const maxDist = 2.8;
      const arr = posAttr.array;

      for (let i = 0; i < count && idx < linePos.array.length - 6; i++) {
        for (let j = i + 1; j < count && idx < linePos.array.length - 6; j++) {
          const dx = arr[i * 3] - arr[j * 3];
          const dy = arr[i * 3 + 1] - arr[j * 3 + 1];
          const dz = arr[i * 3 + 2] - arr[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < maxDist) {
            linePos.array[idx++] = arr[i * 3];
            linePos.array[idx++] = arr[i * 3 + 1];
            linePos.array[idx++] = arr[i * 3 + 2];
            linePos.array[idx++] = arr[j * 3];
            linePos.array[idx++] = arr[j * 3 + 1];
            linePos.array[idx++] = arr[j * 3 + 2];
          }
        }
      }
      // Fill remaining with zeros (hidden)
      for (; idx < linePos.array.length; idx++) {
        linePos.array[idx] = 0;
      }
      linePos.needsUpdate = true;
    }
  });

  // Pre-allocate max possible lines
  const maxLines = count * 4;
  const linePositions = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);

  return (
    <group>
      {/* Nodes */}
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#D4AF37"
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Glow nodes (larger, more transparent) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.18}
          color="#D4AF37"
          transparent
          opacity={0.15}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={maxLines * 2}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#D4AF37"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/* ─── Floating stock ticker symbols ─── */
function FloatingTickers() {
  const tickers = ["INFY", "TCS", "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "ITC", "TATAMOTORS", "WIPRO", "LT"];

  return (
    <group>
      {tickers.map((ticker, i) => {
        const angle = (i / tickers.length) * Math.PI * 2;
        const radius = 5 + Math.random() * 3;
        const x = Math.cos(angle) * radius;
        const y = (Math.random() - 0.5) * 6;
        const z = -3 - Math.random() * 4;
        return (
          <Float key={ticker} speed={1.5 + Math.random()} rotationIntensity={0} floatIntensity={0.3}>
            <group position={[x, y, z]}>
              <mesh>
                <planeGeometry args={[1.2, 0.35]} />
                <meshBasicMaterial
                  color="#D4AF37"
                  transparent
                  opacity={0.06}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </Float>
        );
      })}
    </group>
  );
}

/* ─── Ambient floating particles (dust) ─── */
function Dust({ count = 200 }) {
  const mesh = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const posAttr = mesh.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3 + 1] += Math.sin(time * 0.1 + i) * 0.001;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Camera rig: follows mouse ─── */
function CameraRig({ mouse }) {
  const { camera } = useThree();

  useFrame(() => {
    if (mouse.current) {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 0.5, 0.03);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1 + mouse.current.y * 0.3, 0.03);
      camera.lookAt(0, 0, -2);
    }
  });

  return null;
}

/* ─── Main exported scene ─── */
export default function Scene3D({ className = "" }) {
  const mouse = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`absolute inset-0 ${className}`} style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 1, 6], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <CameraRig mouse={mouse} />
        <ParticleNetwork count={70} mouse={mouse} />
        <FloatingTickers />
        <Dust count={150} />
      </Canvas>
    </div>
  );
}
