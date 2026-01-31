import { useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useTranslation } from 'react-i18next';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { IterationState } from '@/core/optimizers/types.ts';
import { Surface } from './Surface.tsx';
import { OptimizationPath3D } from './OptimizationPath3D.tsx';
import { Overlay3D } from './Overlay3D.tsx';
import styles from './SurfacePlot3D.module.css';

interface SurfacePlot3DProps {
  readonly func: ObjectiveFunction;
  readonly iterations: readonly IterationState[];
  readonly currentIteration: number;
  readonly algorithmId?: string;
  readonly width?: number;
  readonly height?: number;
  readonly showPath?: boolean;
  readonly resolution?: number;
}

export const SurfacePlot3D = ({
  func,
  iterations,
  currentIteration,
  algorithmId,
  width = 500,
  height = 500,
  showPath = true,
  resolution = 80,
}: SurfacePlot3DProps) => {
  const { t } = useTranslation();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // Calculate center of the function bounds
  const [xMin, xMax, yMin, yMax] = func.bounds;
  const centerX = (xMin + xMax) / 2;
  const centerY = (yMin + yMax) / 2;

  return (
    <div className={styles.container} style={{ width, height }}>
      <Canvas>
        <PerspectiveCamera
          makeDefault
          position={[centerX + 4, 4, centerY + 4]}
          fov={50}
        />
        <OrbitControls
          ref={controlsRef}
          target={[centerX, 0.5, centerY]}
          enableDamping
          dampingFactor={0.1}
          minDistance={1}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <directionalLight position={[-10, 10, -5]} intensity={0.4} />

        <Suspense fallback={null}>
          {/* Surface mesh */}
          <Surface func={func} resolution={resolution} />

          {/* Optimization path */}
          {showPath && iterations.length > 0 && (
            <OptimizationPath3D
              func={func}
              iterations={iterations}
              currentIteration={currentIteration}
              resolution={resolution}
            />
          )}

          {/* Interactive overlay */}
          <Overlay3D
            func={func}
            iterations={iterations}
            currentIteration={currentIteration}
            algorithmId={algorithmId}
            resolution={resolution}
          />
        </Suspense>

        {/* Grid helper */}
        <gridHelper
          args={[Math.max(xMax - xMin, yMax - yMin) * 1.5, 10, '#ccc', '#eee']}
          position={[centerX, -0.01, centerY]}
        />
      </Canvas>

      <button className={styles.resetButton} onClick={handleResetCamera}>
        {t('visualization.resetCamera')}
      </button>
    </div>
  );
};
