import { useMemo } from 'react';
import * as THREE from 'three';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import { useSurfaceGeometry } from './useSurfaceGeometry.ts';

interface SurfaceProps {
  readonly func: ObjectiveFunction;
  readonly resolution?: number;
  readonly wireframe?: boolean;
}

export const Surface = ({ func, resolution = 100, wireframe = false }: SurfaceProps) => {
  const { geometry } = useSurfaceGeometry(func, resolution);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      wireframe,
      flatShading: false,
    });
  }, [wireframe]);

  return <mesh geometry={geometry} material={material} />;
};
