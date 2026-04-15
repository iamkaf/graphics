import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";

function RotatingBox() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() * 0.001;
    ref.current.rotation.y = t * 0.8;
    ref.current.rotation.x = t * 0.4;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.1, 1.1, 1.1]} />
      <meshStandardMaterial color="#38bdf8" metalness={0.28} roughness={0.36} />
    </mesh>
  );
}

export default function ThreeDemo() {
  return (
    <Canvas
      camera={{ position: [1.6, 1.2, 3.2], fov: 60 }}
      style={{ width: "100%", height: "100%" }}
      aria-label="Three.js demo canvas"
    >
      <color attach="background" args={["#f1f5f9"]} />
      <directionalLight position={[2, 4, 4]} intensity={1} />
      <ambientLight intensity={0.6} color="#91a1af" />
      <RotatingBox />
    </Canvas>
  );
}
