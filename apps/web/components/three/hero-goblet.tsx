'use client';

/**
 * Escena 3D del hero: la copa amatista de la marca, facetada y girando lento.
 * Se carga SOLO vía el wrapper lazy (hero-3d.tsx) — nunca en el bundle inicial.
 *
 * Decisiones de sostenibilidad:
 * - dpr limitado a [1, 1.5]: nitidez suficiente sin quemar GPU en pantallas retina.
 * - Sin HDR descargado: la iluminación de estudio se arma con <Lightformer> dentro
 *   de un <Environment> de resolución baja (se renderiza en GPU, 0 KB de red).
 * - `paused` corta la animación (useFrame early-return) cuando el hero sale de vista.
 * - Geometría de torno (LatheGeometry) de pocos segmentos + flatShading = facetas
 *   cristalinas sin cargar ningún modelo.
 */

import { Environment, Float, Lightformer } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Perfil (radio, altura) de la copa, revolucionado alrededor del eje Y. */
function useGobletGeometry() {
  return useMemo(() => {
    const p = (x: number, y: number) => new THREE.Vector2(x, y);
    const points = [
      p(0.03, -1.3),
      p(0.78, -1.3),
      p(0.74, -1.2),
      p(0.15, -1.08),
      p(0.1, -0.3),
      p(0.1, 0.02),
      p(0.56, 0.36),
      p(0.96, 1.26),
      p(0.88, 1.26),
      p(0.44, 0.44),
      p(0.07, 0.06),
      p(0.03, -1.28),
    ];
    const geo = new THREE.LatheGeometry(points, 16);
    geo.computeVertexNormals();
    return geo;
  }, []);
}

function Goblet({ paused }: { paused: boolean }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useGobletGeometry();

  useFrame((_, delta) => {
    if (paused || !group.current) return;
    group.current.rotation.y += delta * 0.35;
  });

  return (
    <Float speed={paused ? 0 : 1.4} rotationIntensity={0.15} floatIntensity={0.5}>
      <group ref={group} position={[0, -0.1, 0]} scale={1.15}>
        <mesh geometry={geometry} castShadow>
          {/* Cristal amatista pulido: clearcoat + iridiscencia + brillo interno,
              sin transmisión (evita el buffer de refracción, más barato en móvil). */}
          <meshPhysicalMaterial
            color="#6c4dff"
            metalness={0.15}
            roughness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.1}
            iridescence={0.6}
            iridescenceIOR={1.6}
            emissive="#3a1d8a"
            emissiveIntensity={0.4}
            flatShading
          />
        </mesh>
      </group>
    </Float>
  );
}

export function HeroGoblet({ paused = false }: { paused?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.2, 4.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 2]} intensity={40} color="#b8a8ff" />
      <pointLight position={[-3, -1, 2]} intensity={25} color="#6c4dff" />
      <pointLight position={[0, 2, -3]} intensity={30} color="#ffffff" />

      <Goblet paused={paused} />

      {/* Estudio de luces sin descargar HDR: reflejos suaves de marca. */}
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 3, 3]} scale={[6, 3, 1]} color="#b8a8ff" />
        <Lightformer intensity={1.4} position={[-4, 0, 2]} scale={[3, 4, 1]} color="#6c4dff" />
        <Lightformer intensity={1} position={[4, -2, 1]} scale={[3, 3, 1]} color="#ffffff" />
      </Environment>
    </Canvas>
  );
}

export default HeroGoblet;
