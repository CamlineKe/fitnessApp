import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const FloatingShapes = () => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          color="#6366f1" 
          emissive="#4338ca" 
          emissiveIntensity={0.3} 
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
      
      {/* Wireframe Overlay */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.05, 32, 32]} />
        <meshBasicMaterial 
          color="#818cf8" 
          wireframe 
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Floating Ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.02, 16, 100]} />
        <meshBasicMaterial color="#a5b4fc" transparent opacity={0.3} />
      </mesh>
      
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 4 + Math.random() * 1;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 3;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#c7d2fe" transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
};

const SceneBackground = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      pointerEvents: 'none',
    }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4338ca" />
        <FloatingShapes />
      </Canvas>
    </div>
  );
};

export default SceneBackground;