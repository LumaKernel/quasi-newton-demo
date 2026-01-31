import { useMemo } from 'react';
import * as THREE from 'three';
import { useVisualization, type OverlayData, type OverlayType } from '@/contexts/index.ts';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { IterationState } from '@/core/optimizers/types.ts';
import { useSurfaceGeometry } from './useSurfaceGeometry.ts';

interface Overlay3DProps {
  readonly func: ObjectiveFunction;
  readonly iterations: readonly IterationState[];
  readonly currentIteration: number;
  readonly algorithmId?: string;
  readonly resolution?: number;
}

/** Compute overlay data from iteration state */
const computeOverlayData = (
  type: OverlayType,
  algorithmId: string,
  currentState: IterationState,
  nextState: IterationState | null,
): OverlayData => ({
  type,
  algorithmId,
  currentPoint: [currentState.x[0], currentState.x[1]] as const,
  gradient: [currentState.gradient[0], currentState.gradient[1]] as const,
  fx: currentState.fx,
  ...(currentState.direction && {
    direction: [currentState.direction[0], currentState.direction[1]] as const,
  }),
  ...(nextState && {
    nextPoint: [nextState.x[0], nextState.x[1]] as const,
  }),
  ...(algorithmId === 'trustRegion' && currentState.direction && {
    trustRegionRadius: Math.sqrt(
      currentState.direction[0] ** 2 + currentState.direction[1] ** 2,
    ),
  }),
  ...(currentState.trueHessian && { hessian: currentState.trueHessian }),
  ...(currentState.hessianApprox && { hessianApprox: currentState.hessianApprox }),
});

// Quadratic model surface mesh
const QuadraticSurface = ({
  center,
  gradient,
  hessian,
  fx,
  color,
  func,
}: {
  readonly center: readonly [number, number];
  readonly gradient: readonly [number, number];
  readonly hessian: readonly (readonly number[])[];
  readonly fx: number;
  readonly func: ObjectiveFunction;
  readonly color: string;
}) => {
  const geometry = useMemo(() => {
    const resolution = 30;
    const [xMin, xMax, yMin, yMax] = func.bounds;
    const range = Math.min(xMax - xMin, yMax - yMin) * 0.25;

    const localXMin = center[0] - range;
    const localXMax = center[0] + range;
    const localYMin = center[1] - range;
    const localYMax = center[1] + range;

    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Generate vertices for the quadratic surface
    for (let j = 0; j <= resolution; j++) {
      for (let i = 0; i <= resolution; i++) {
        const x = localXMin + (i / resolution) * (localXMax - localXMin);
        const z = localYMin + (j / resolution) * (localYMax - localYMin);
        const dx = x - center[0];
        const dz = z - center[1];

        // m(x) = fx + g'd + 0.5*d'Hd
        const gradTerm = gradient[0] * dx + gradient[1] * dz;
        const hessTermX = hessian[0][0] * dx + hessian[0][1] * dz;
        const hessTermZ = hessian[1][0] * dx + hessian[1][1] * dz;
        const quadTerm = 0.5 * (dx * hessTermX + dz * hessTermZ);
        const y = (fx + gradTerm + quadTerm) * 0.5; // Scale y for visualization

        vertices.push(x, y, z);
      }
    }

    // Generate indices for triangles
    for (let j = 0; j < resolution; j++) {
      for (let i = 0; i < resolution; i++) {
        const a = i + j * (resolution + 1);
        const b = i + 1 + j * (resolution + 1);
        const c = i + (j + 1) * (resolution + 1);
        const d = i + 1 + (j + 1) * (resolution + 1);

        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [center, gradient, hessian, fx, func]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
};

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

export const Overlay3D = ({ func, iterations, currentIteration, algorithmId, resolution = 80 }: Overlay3DProps) => {
  const { pinnedConfig, hoverOverlay } = useVisualization();
  const { heightScale, valueRange } = useSurfaceGeometry(func, resolution);
  const [minValue] = valueRange;

  // Compute activeOverlay: pinned takes priority, then hover
  const activeOverlay = useMemo((): OverlayData | null => {
    if (pinnedConfig && algorithmId && pinnedConfig.algorithmId === algorithmId) {
      const idx = Math.min(currentIteration, iterations.length - 1);
      const currentState = iterations[idx];
      if (!currentState) return null;
      const nextIdx = Math.min(currentIteration + 1, iterations.length - 1);
      const nextState = nextIdx !== currentIteration ? iterations[nextIdx] : null;
      return computeOverlayData(pinnedConfig.type, algorithmId, currentState, nextState);
    }
    if (hoverOverlay && (!algorithmId || hoverOverlay.algorithmId === algorithmId)) {
      return hoverOverlay;
    }
    return null;
  }, [pinnedConfig, hoverOverlay, algorithmId, iterations, currentIteration]);

  const overlayData = useMemo(() => {
    if (!activeOverlay) return null;

    const { type, currentPoint, gradient, direction, nextPoint, trustRegionRadius, fx, hessian, hessianApprox } = activeOverlay;

    // Convert 2D point to 3D (x, z in 3D corresponds to x, y in 2D)
    // Use the same height scaling as Surface and OptimizationPath3D
    const x = currentPoint[0];
    const z = currentPoint[1];
    const fxVal = fx ?? func.value([x, z]);
    const height = (fxVal - minValue) * heightScale + 0.02; // Slight offset above surface

    const [xMin, xMax, yMin, yMax] = func.bounds;
    const rangeX = xMax - xMin;
    const rangeY = yMax - yMin;
    const scale = Math.max(rangeX, rangeY);

    // Calculate 3D positions and vectors
    const currentPos: readonly [number, number, number] = [x, height, z];

    let gradientVec: readonly [number, number, number] | null = null;
    if (gradient) {
      // Gradient in 2D (gx, gy) becomes (gx, 0, gy) in 3D for horizontal visualization
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
      const nextFx = func.value([nx, nz]);
      const nextHeight = (nextFx - minValue) * heightScale + 0.02;
      nextPos = [nx, nextHeight, nz];
    }

    // Invert 2x2 matrix for quasi-Newton approximation
    const invert2x2 = (B: readonly (readonly number[])[]): readonly (readonly number[])[] | null => {
      const det = B[0][0] * B[1][1] - B[0][1] * B[1][0];
      if (Math.abs(det) < 1e-10) return null;
      return [
        [B[1][1] / det, -B[0][1] / det],
        [-B[1][0] / det, B[0][0] / det],
      ];
    };

    // Quadratic model data
    let trueHessian: readonly (readonly number[])[] | null = null;
    let approxHessian: readonly (readonly number[])[] | null = null;

    if (type === 'quadraticModel') {
      if (hessian) {
        trueHessian = hessian;
      }
      if (hessianApprox) {
        approxHessian = invert2x2(hessianApprox);
      }
    }

    return {
      type,
      currentPos,
      currentPoint,
      gradient,
      gradientVec,
      directionVec,
      nextPos,
      trustRegionRadius: trustRegionRadius ? trustRegionRadius * 0.5 : undefined,
      fx,
      trueHessian,
      approxHessian,
    };
  }, [activeOverlay, func, heightScale, minValue]);

  if (!overlayData) return null;

  const { type, currentPos, currentPoint, gradient, gradientVec, directionVec, nextPos, trustRegionRadius, fx, trueHessian, approxHessian } = overlayData;

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

      {/* Quasi-Newton quadratic model (purple surface) */}
      {type === 'quadraticModel' && approxHessian && gradient && fx !== undefined && currentPoint && (
        <QuadraticSurface
          center={currentPoint}
          gradient={gradient}
          hessian={approxHessian}
          fx={fx}
          func={func}
          color="#9b59b6"
        />
      )}

      {/* True quadratic model (orange surface) */}
      {type === 'quadraticModel' && trueHessian && gradient && fx !== undefined && currentPoint && (
        <QuadraticSurface
          center={currentPoint}
          gradient={gradient}
          hessian={trueHessian}
          fx={fx}
          func={func}
          color="#e67e22"
        />
      )}
    </group>
  );
};
