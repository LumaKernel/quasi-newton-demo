import { useMemo } from 'react';
import * as THREE from 'three';
import { useVisualization } from '@/contexts/index.ts';
import type { ObjectiveFunction } from '@/core/functions/types.ts';

interface Overlay3DProps {
  readonly func: ObjectiveFunction;
}

// Line to next point with sphere
const NextPointLine = ({
  currentPos,
  nextPos,
}: {
  readonly currentPos: readonly [number, number, number];
  readonly nextPos: readonly [number, number, number];
}) => {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      currentPos[0], currentPos[1], currentPos[2],
      nextPos[0], nextPos[1], nextPos[2],
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: '#27ae60' });
    return new THREE.Line(geometry, material);
  }, [currentPos, nextPos]);

  return (
    <>
      <primitive object={line} />
      <mesh position={[nextPos[0], nextPos[1], nextPos[2]]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#27ae60"
          emissive="#27ae60"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
    </>
  );
};

// Arrow component for 3D vectors
const Arrow = ({
  start,
  direction,
  color,
  length = 1,
}: {
  readonly start: readonly [number, number, number];
  readonly direction: readonly [number, number, number];
  readonly color: string;
  readonly length?: number;
}) => {
  const arrowHelper = useMemo(() => {
    const dir = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize();
    const origin = new THREE.Vector3(start[0], start[1], start[2]);
    return { dir, origin };
  }, [start, direction]);

  return (
    <arrowHelper
      args={[
        arrowHelper.dir,
        arrowHelper.origin,
        length,
        color,
        length * 0.2,
        length * 0.1,
      ]}
    />
  );
};

export const Overlay3D = ({ func }: Overlay3DProps) => {
  const { activeOverlay } = useVisualization();

  const overlayData = useMemo(() => {
    if (!activeOverlay) return null;

    const { type, currentPoint, gradient, direction, nextPoint, trustRegionRadius } = activeOverlay;

    // Convert 2D point to 3D (x, z in 3D corresponds to x, y in 2D)
    const x = currentPoint[0];
    const z = currentPoint[1];
    const y = func.value([x, z]);

    // Normalize y value for better visualization
    const [xMin, xMax, yMin, yMax] = func.bounds;
    const rangeX = xMax - xMin;
    const rangeY = yMax - yMin;
    const scale = Math.max(rangeX, rangeY);

    // Calculate 3D positions and vectors
    const currentPos: readonly [number, number, number] = [x, y * 0.5, z];

    let gradientVec: readonly [number, number, number] | null = null;
    if (gradient) {
      // Gradient in 2D (gx, gy) becomes (gx, 0, gy) in 3D for horizontal visualization
      // Scale to visible length
      const gradLen = Math.sqrt(gradient[0] ** 2 + gradient[1] ** 2);
      if (gradLen > 0.001) {
        const scaleFactor = Math.min(1, scale * 0.3 / gradLen);
        gradientVec = [
          gradient[0] * scaleFactor,
          0,
          gradient[1] * scaleFactor,
        ];
      }
    }

    let directionVec: readonly [number, number, number] | null = null;
    if (direction) {
      const dirLen = Math.sqrt(direction[0] ** 2 + direction[1] ** 2);
      if (dirLen > 0.001) {
        const scaleFactor = Math.min(1, scale * 0.3 / dirLen);
        directionVec = [
          direction[0] * scaleFactor,
          0,
          direction[1] * scaleFactor,
        ];
      }
    }

    let nextPos: readonly [number, number, number] | null = null;
    if (nextPoint) {
      const nx = nextPoint[0];
      const nz = nextPoint[1];
      const ny = func.value([nx, nz]);
      nextPos = [nx, ny * 0.5, nz];
    }

    return {
      type,
      currentPos,
      gradientVec,
      directionVec,
      nextPos,
      trustRegionRadius: trustRegionRadius ? trustRegionRadius * 0.5 : undefined,
    };
  }, [activeOverlay, func]);

  if (!overlayData) return null;

  const { type, currentPos, gradientVec, directionVec, nextPos, trustRegionRadius } = overlayData;

  return (
    <group>
      {/* Current point highlight */}
      <mesh position={[currentPos[0], currentPos[1], currentPos[2]]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#f39c12" emissive="#f39c12" emissiveIntensity={0.5} />
      </mesh>

      {/* Gradient vector (red arrow) */}
      {(type === 'gradient' || type === 'direction') && gradientVec && (
        <Arrow
          start={currentPos}
          direction={gradientVec}
          color="#e74c3c"
          length={Math.sqrt(gradientVec[0] ** 2 + gradientVec[1] ** 2 + gradientVec[2] ** 2)}
        />
      )}

      {/* Direction vector (blue arrow) */}
      {(type === 'direction' || type === 'nextPoint') && directionVec && (
        <Arrow
          start={currentPos}
          direction={directionVec}
          color="#3498db"
          length={Math.sqrt(directionVec[0] ** 2 + directionVec[1] ** 2 + directionVec[2] ** 2)}
        />
      )}

      {/* Next point highlight */}
      {type === 'nextPoint' && nextPos && (
        <NextPointLine currentPos={currentPos} nextPos={nextPos} />
      )}

      {/* Trust region visualization (horizontal circle) */}
      {type === 'direction' && trustRegionRadius && (
        <mesh
          position={[currentPos[0], currentPos[1] + 0.01, currentPos[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[trustRegionRadius * 0.95, trustRegionRadius, 32]} />
          <meshStandardMaterial
            color="#9b59b6"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};
