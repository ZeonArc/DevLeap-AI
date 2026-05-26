"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const GRID = 50;
const TILE = 0.9;
const GAP = 1.05;
const COUNT = GRID * GRID;

function WaveGrid() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const wireframe = useRef<THREE.InstancedMesh>(null);
  const obj = useMemo(() => new THREE.Object3D(), []);
  const scroll = useRef({ v: 0 });

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    const half = (GRID * GAP) / 2;
    let i = 0;
    for (let x = 0; x < GRID; x++) {
      for (let z = 0; z < GRID; z++) {
        arr[i * 3] = x * GAP - half;
        arr[i * 3 + 1] = 0;
        arr[i * 3 + 2] = z * GAP - half;
        i++;
      }
    }
    return arr;
  }, []);

  const colors = useMemo(() => {
    const c = new Float32Array(COUNT * 3);
    const base = new THREE.Color("#111111");
    const cyan = new THREE.Color("#0070f3");
    const mag = new THREE.Color("#ff00ff");
    for (let i = 0; i < COUNT; i++) {
      const r = Math.random();
      const col = r > 0.994 ? mag : r > 0.984 ? cyan : base;
      col.toArray(c, i * 3);
    }
    return c;
  }, []);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => { scroll.current.v = s.progress; }
    });
    return () => { st.kill(); };
  }, []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    const sp = scroll.current.v * Math.PI * 20;

    for (let i = 0; i < COUNT; i++) {
      const px = positions[i * 3];
      const pz = positions[i * 3 + 2];
      const d = Math.sqrt(px * px + pz * pz);

      // 3 layered waves for organic movement
      const w1 = Math.sin(d * 0.12 - t * 0.4 + sp) * 3.0;
      const w2 = Math.cos(px * 0.15 + t * 0.3) * Math.sin(pz * 0.15 + t * 0.3) * 1.8;
      const w3 = Math.sin((px + pz) * 0.04 + sp * 0.3) * 2.5;
      const y = w1 + w2 + w3;

      obj.position.set(px, y, pz);
      obj.rotation.set(-Math.PI / 2, 0, 0);
      const s = 1 + Math.sin(t * 0.5 + d * 0.05) * 0.08;
      obj.scale.set(s, s, s);
      obj.updateMatrix();
      mesh.current.setMatrixAt(i, obj.matrix);
      if (wireframe.current) wireframe.current.setMatrixAt(i, obj.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (wireframe.current) wireframe.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, -12, -35]} rotation={[Math.PI / 7, Math.PI / 4, 0]}>
      {/* Solid dark fill tiles */}
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
        <planeGeometry args={[TILE, TILE]}>
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </planeGeometry>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} transparent opacity={0.7} />
      </instancedMesh>
      {/* Wireframe edge overlay for that grid-line glow */}
      <instancedMesh ref={wireframe} args={[undefined, undefined, COUNT]}>
        <planeGeometry args={[TILE, TILE]} />
        <meshBasicMaterial color="#1a1a1a" wireframe side={THREE.DoubleSide} transparent opacity={0.4} />
      </instancedMesh>
    </group>
  );
}

function FloatingElements() {
  const group = useRef<THREE.Group>(null);
  const scroll = useRef({ v: 0 });

  const chips = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 60,
          Math.random() * 25 + 5,
          (Math.random() - 0.5) * 60
        ),
        speed: Math.random() * 0.4 + 0.1,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        scale: Math.random() * 0.4 + 0.2,
        isCyan: Math.random() > 0.5,
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => { scroll.current.v = s.progress; }
    });
    return () => { st.kill(); };
  }, []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      const chip = chips[i];
      if (!chip) return;
      child.position.y = chip.pos.y + Math.sin(t * chip.speed) * 3 - scroll.current.v * 30;
      child.rotation.x += chip.rotSpeed;
      child.rotation.z += chip.rotSpeed * 1.5;
    });
  });

  return (
    <group ref={group} position={[0, -10, -30]} rotation={[Math.PI / 8, Math.PI / 4, 0]}>
      {chips.map((chip, i) => (
        <mesh key={i} position={chip.pos} scale={chip.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={chip.isCyan ? "#0070f3" : "#ff00ff"}
            wireframe
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Hero3D() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 8, 25], fov: 42 }} dpr={[1, 1.5]}>
        <fog attach="fog" args={["#0a0a0a", 15, 60]} />
        <WaveGrid />
        <FloatingElements />
      </Canvas>
    </div>
  );
}
