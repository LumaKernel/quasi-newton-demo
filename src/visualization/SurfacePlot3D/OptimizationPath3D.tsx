import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { IterationState } from '@/core/optimizers/types.ts';
import { useSurfaceGeometry } from './useSurfaceGeometry.ts';

interface OptimizationPath3DProps {
  readonly func: ObjectiveFunction;
  readonly iterations: readonly IterationState[];
  readonly currentIteration: number;
  readonly resolution?: number;
}

export const OptimizationPath3D = ({
  func,
  iterations,
  currentIteration,
  resolution = 100,
}: OptimizationPath3DProps) => {
  const { heightScale, valueRange } = useSurfaceGeometry(func, resolution);
  const [minValue] = valueRange;

  const visibleIterations = useMemo(() => {
    return iterations.slice(0, currentIteration + 1);
  }, [iterations, currentIteration]);

  // Convert 2D points to 3D positions
  const points = useMemo(() => {
    return visibleIterations.map((iter) => {
      const x = iter.x[0];
      const y = iter.x[1];
      const z = (iter.fx - minValue) * heightScale;
      return new THREE.Vector3(x, z + 0.02, y); // Slight offset to render above surface
    });
  }, [visibleIterations, heightScale, minValue]);

  // Line points for path
  const linePoints = useMemo(() => {
    if (points.length < 2) return null;
    return points.map((p) => [p.x, p.y, p.z] as const);
  }, [points]);

  // Render spheres for each point
  const spheres = useMemo(() => {
    return points.map((point, index) => {
      const isStart = index === 0;
      const isCurrent = index === currentIteration;
      const isEnd = index === visibleIterations.length - 1 && index === iterations.length - 1;

      let color = '#f39c12'; // Orange for intermediate
      let scale = 0.03;

      if (isStart) {
        color = '#27ae60'; // Green for start
        scale = 0.04;
      } else if (isCurrent) {
        color = '#e74c3c'; // Red for current
        scale = 0.05;
      } else if (isEnd) {
        color = '#3498db'; // Blue for end/converged
        scale = 0.04;
      }

      return (
        <mesh key={index} position={point}>
          <sphereGeometry args={[scale, 16, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    });
  }, [points, currentIteration, visibleIterations.length, iterations.length]);

  // Render minima markers
  const minimaMarkers = useMemo(() => {
    return func.minima.map((minimum, index) => {
      const x = minimum[0];
      const y = minimum[1];
      const z = (func.value(minimum) - minValue) * heightScale;
      return (
        <mesh key={`minima-${index}`} position={[x, z + 0.01, y]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.1, 32]} />
          <meshBasicMaterial color="#27ae60" side={THREE.DoubleSide} />
        </mesh>
      );
    });
  }, [func, heightScale, minValue]);

  return (
    <group>
      {linePoints && (
        <Line points={linePoints} color="#e74c3c" lineWidth={2} />
      )}
      {spheres}
      {minimaMarkers}
    </group>
  );
};
