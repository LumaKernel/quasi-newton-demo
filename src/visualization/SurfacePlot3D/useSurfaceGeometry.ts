import { useMemo } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';
import type { ObjectiveFunction } from '@/core/functions/types.ts';

interface SurfaceData {
  readonly geometry: THREE.BufferGeometry;
  readonly colorArray: Float32Array;
  readonly valueRange: readonly [number, number];
  readonly heightScale: number;
}

export const useSurfaceGeometry = (
  func: ObjectiveFunction,
  resolution: number = 100,
): SurfaceData => {
  return useMemo(() => {
    const [xMin, xMax, yMin, yMax] = func.bounds;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    // Generate grid values
    const values: number[][] = [];
    let minValue = Infinity;
    let maxValue = -Infinity;

    for (let i = 0; i <= resolution; i++) {
      const row: number[] = [];
      for (let j = 0; j <= resolution; j++) {
        const x = xMin + (i / resolution) * xRange;
        const y = yMin + (j / resolution) * yRange;
        const z = func.value([x, y]);
        row.push(z);
        if (isFinite(z)) {
          minValue = Math.min(minValue, z);
          maxValue = Math.max(maxValue, z);
        }
      }
      values.push(row);
    }

    // Clamp extreme values for better visualization
    const valueRange = maxValue - minValue;
    const clampMax = minValue + Math.min(valueRange, 100);

    // Create color scale
    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
      .domain([clampMax, minValue]); // Inverted so low values are blue

    // Calculate height scale to keep surface proportional
    const spatialRange = Math.max(xRange, yRange);
    const heightScale = spatialRange / Math.max(valueRange, 1);

    // Generate vertices, normals, and colors
    const vertexCount = (resolution + 1) * (resolution + 1);
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);

    let vertexIndex = 0;
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = xMin + (i / resolution) * xRange;
        const y = yMin + (j / resolution) * yRange;
        const z = Math.min(values[i][j], clampMax);
        const normalizedZ = (z - minValue) * heightScale;

        // Position (x, z-height, y) - Three.js uses y-up
        positions[vertexIndex * 3] = x;
        positions[vertexIndex * 3 + 1] = normalizedZ;
        positions[vertexIndex * 3 + 2] = y;

        // Color
        const color = d3.color(colorScale(z));
        if (color) {
          const rgb = color.rgb();
          colors[vertexIndex * 3] = rgb.r / 255;
          colors[vertexIndex * 3 + 1] = rgb.g / 255;
          colors[vertexIndex * 3 + 2] = rgb.b / 255;
        }

        vertexIndex++;
      }
    }

    // Generate indices for triangles
    const indices: number[] = [];
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const topLeft = i * (resolution + 1) + j;
        const topRight = topLeft + 1;
        const bottomLeft = (i + 1) * (resolution + 1) + j;
        const bottomRight = bottomLeft + 1;

        // Two triangles per grid cell
        indices.push(topLeft, bottomLeft, topRight);
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return {
      geometry,
      colorArray: colors,
      valueRange: [minValue, maxValue] as const,
      heightScale,
    };
  }, [func, resolution]);
};
