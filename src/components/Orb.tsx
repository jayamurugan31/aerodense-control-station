import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PixelatedSphere = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.15;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Inner dots - denser */}
      <points ref={pointsRef} scale={1.6}>
        <icosahedronGeometry args={[1, 12]} />
        <pointsMaterial
          color="#22d3ee" // Cyan-400
          size={0.05}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.8}
        />
      </points>
      
      {/* Outer shell - sparse pixels */}
      <points scale={2.0} rotation={[0.5, 0.5, 0]}>
        <icosahedronGeometry args={[1, 4]} />
        <pointsMaterial
          color="#0ea5e9" // Sky-500
          size={0.08}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.4}
        />
      </points>
    </group>
  );
};

const Orb = ({ className }: { className?: string }) => {
  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }} 
        gl={{ alpha: true, antialias: false }} // antialias: false helps pixel look
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <PixelatedSphere />
      </Canvas>
    </div>
  );
};

export default Orb;
