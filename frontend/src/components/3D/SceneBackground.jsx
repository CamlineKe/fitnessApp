import React from 'react';
import { Canvas } from '@react-three/fiber';

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
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#6366f1" emissive="#4338ca" emissiveIntensity={0.2} opacity={0.2} transparent />
        </mesh>
      </Canvas>
    </div>
  );
};

export default SceneBackground;