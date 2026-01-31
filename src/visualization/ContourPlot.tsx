import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { IterationState } from '@/core/optimizers/types.ts';
import { useVisualization, type OverlayData, type OverlayType } from '@/contexts/index.ts';

interface ContourPlotProps {
  readonly func: ObjectiveFunction;
  readonly iterations: readonly IterationState[];
  readonly currentIteration: number;
  readonly algorithmId?: string;
  readonly width?: number;
  readonly height?: number;
  readonly showPath?: boolean;
  readonly showDirection?: boolean;
  readonly onStartPointChange?: (point: readonly [number, number]) => void;
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

interface ContourData {
  readonly values: number[];
  readonly thresholds: number[];
}

const generateContourData = (
  func: ObjectiveFunction,
  width: number,
  height: number,
  bounds: readonly [number, number, number, number],
): ContourData => {
  const [xMin, xMax, yMin, yMax] = bounds;
  const values: number[] = new Array(width * height);

  let minVal = Infinity;
  let maxVal = -Infinity;

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = xMin + (i / (width - 1)) * (xMax - xMin);
      const y = yMax - (j / (height - 1)) * (yMax - yMin); // Flip y
      const val = func.value([x, y]);
      values[i + j * width] = val;
      minVal = Math.min(minVal, val);
      maxVal = Math.max(maxVal, val);
    }
  }

  // Generate thresholds that show detail at both low and high values
  const range = maxVal - minVal;
  const thresholds: number[] = [];

  // Determine if we need special handling for large dynamic range
  const dynamicRange = range / Math.max(Math.abs(minVal), 0.001);

  if (dynamicRange > 10 && minVal >= 0) {
    // Use log-like spacing for large dynamic range (Rosenbrock, etc.)
    // Add offset to handle minVal close to 0
    const offset = minVal < 0.01 ? 0.01 : 0;
    const effectiveMin = minVal + offset;
    const effectiveMax = maxVal + offset;

    // More contours at lower values where the interesting structure is
    const numLowContours = 15;  // More detail near minimum
    const numHighContours = 10; // Less detail at high values

    // Low value region: from min to min + 10% of range (log spaced)
    const lowMax = effectiveMin + range * 0.1;
    const logLowMin = Math.log(effectiveMin);
    const logLowMax = Math.log(lowMax);
    for (let i = 0; i < numLowContours; i++) {
      const t = i / (numLowContours - 1);
      thresholds.push(Math.exp(logLowMin + t * (logLowMax - logLowMin)) - offset);
    }

    // Mid-high value region: from 10% to 100% of range (log spaced, sparser)
    const logMidMin = Math.log(lowMax);
    const logMidMax = Math.log(Math.min(effectiveMax, effectiveMin * 10000));
    for (let i = 1; i <= numHighContours; i++) {
      const t = i / numHighContours;
      thresholds.push(Math.exp(logMidMin + t * (logMidMax - logMidMin)) - offset);
    }
  } else {
    // Linear spacing for functions with smaller dynamic range
    const numThresholds = 25;
    for (let i = 0; i < numThresholds; i++) {
      thresholds.push(minVal + (i / (numThresholds - 1)) * range);
    }
  }

  // Remove duplicates and sort
  const uniqueThresholds = [...new Set(thresholds.map(t => Math.round(t * 1e10) / 1e10))].sort((a, b) => a - b);

  return { values, thresholds: uniqueThresholds };
};

export const ContourPlot = ({
  func,
  iterations,
  currentIteration,
  algorithmId,
  width = 500,
  height = 500,
  showPath = true,
  showDirection = true,
  onStartPointChange,
}: ContourPlotProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { pinnedConfig, hoverOverlay } = useVisualization();
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  // Compute activeOverlay: pinned takes priority, then hover
  // Only show overlay if it's for this algorithm (or algorithmId is not specified)
  const activeOverlay = useMemo((): OverlayData | null => {
    // If pinned for this algorithm, compute from current iteration data
    if (pinnedConfig && algorithmId && pinnedConfig.algorithmId === algorithmId) {
      const idx = Math.min(currentIteration, iterations.length - 1);
      const currentState = iterations[idx];
      if (!currentState) return null;
      const nextIdx = Math.min(currentIteration + 1, iterations.length - 1);
      const nextState = nextIdx !== currentIteration ? iterations[nextIdx] : null;
      return computeOverlayData(pinnedConfig.type, algorithmId, currentState, nextState);
    }
    // If hover overlay is for this algorithm, use it
    if (hoverOverlay && (!algorithmId || hoverOverlay.algorithmId === algorithmId)) {
      return hoverOverlay;
    }
    return null;
  }, [pinnedConfig, hoverOverlay, algorithmId, iterations, currentIteration]);
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [xMin, xMax, yMin, yMax] = func.bounds;

  const xScale = useMemo(
    () => d3.scaleLinear().domain([xMin, xMax]).range([0, innerWidth]),
    [xMin, xMax, innerWidth],
  );

  const yScale = useMemo(
    () => d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]),
    [yMin, yMax, innerHeight],
  );

  const contourData = useMemo(
    () => generateContourData(func, innerWidth, innerHeight, func.bounds),
    [func, innerWidth, innerHeight],
  );

  const contours = useMemo(() => {
    const generator = d3
      .contours()
      .size([innerWidth, innerHeight])
      .thresholds(contourData.thresholds);
    return generator(contourData.values);
  }, [contourData, innerWidth, innerHeight]);

  const getColor = useMemo(() => {
    const minT = contourData.thresholds[0];
    const maxT = contourData.thresholds[contourData.thresholds.length - 1];
    const range = maxT - minT;

    // Use log scale for color when dynamic range is large
    if (range / Math.max(Math.abs(minT), 0.001) > 10 && minT >= 0) {
      const offset = minT < 0.01 ? 0.01 : 0;
      const scale = d3
        .scaleSequentialLog(d3.interpolateYlGnBu)
        .domain([minT + offset, maxT + offset]);
      return (value: number) => scale(value + offset);
    }

    const scale = d3
      .scaleSequential(d3.interpolateYlGnBu)
      .domain([minT, maxT]);
    return (value: number) => scale(value);
  }, [contourData.thresholds]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    // Remove only the main group, preserve defs and overlay
    svg.selectAll('g.main').remove();
    svg.selectAll('defs').remove();

    const g = svg
      .insert('g', 'g.overlay')
      .attr('class', 'main')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw contours
    g.selectAll('path.contour')
      .data(contours)
      .join('path')
      .attr('class', 'contour')
      .attr('d', d3.geoPath())
      .attr('fill', (d) => getColor(d.value))
      .attr('stroke', '#666')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.3);

    // Draw axes
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('font-size', '12px');

    g.append('g').call(yAxis).attr('font-size', '12px');

    // Labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .text('x');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .text('y');

    // Draw optimization path
    if (showPath && iterations.length > 0) {
      const pathData = iterations.slice(0, currentIteration + 1).map((iter) => ({
        x: xScale(iter.x[0]),
        y: yScale(iter.x[1]),
      }));

      // Draw path line
      const lineGenerator = d3
        .line<{ x: number; y: number }>()
        .x((d) => d.x)
        .y((d) => d.y);

      g.append('path')
        .datum(pathData)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.8);

      // Draw points
      g.selectAll('circle.iteration')
        .data(pathData)
        .join('circle')
        .attr('class', 'iteration')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .attr('r', (_, i) => (i === currentIteration ? 6 : 4))
        .attr('fill', (_, i) =>
          i === 0 ? '#27ae60' : i === currentIteration ? '#e74c3c' : '#f39c12',
        )
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
    }

    // Draw search direction
    if (showDirection && currentIteration > 0 && currentIteration < iterations.length) {
      const iter = iterations[currentIteration];
      if (iter.direction && iter.alpha) {
        const startX = xScale(iter.x[0]);
        const startY = yScale(iter.x[1]);
        const arrowScale = 30;
        const endX = startX + iter.direction[0] * arrowScale;
        const endY = startY - iter.direction[1] * arrowScale;

        g.append('line')
          .attr('x1', startX)
          .attr('y1', startY)
          .attr('x2', endX)
          .attr('y2', endY)
          .attr('stroke', '#9b59b6')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowhead)');
      }
    }

    // Draw minimum markers
    func.minima.forEach((min) => {
      g.append('circle')
        .attr('cx', xScale(min[0]))
        .attr('cy', yScale(min[1]))
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', '#2ecc71')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,3');
    });

    // Arrow marker definition
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#9b59b6');

    // Interactive start point selection
    if (onStartPointChange) {
      g.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'crosshair')
        .on('click', (event) => {
          const [mx, my] = d3.pointer(event);
          const x = xScale.invert(mx);
          const y = yScale.invert(my);
          onStartPointChange([x, y]);
        });
    }
  }, [
    func,
    iterations,
    currentIteration,
    showPath,
    showDirection,
    contours,
    getColor,
    xScale,
    yScale,
    innerWidth,
    innerHeight,
    margin,
    onStartPointChange,
  ]);

  // Render overlay based on hover state
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Ensure overlay group exists
    let overlay = svg.select<SVGGElement>('g.overlay');
    if (overlay.empty()) {
      overlay = svg.append('g').attr('class', 'overlay').attr('transform', `translate(${margin.left},${margin.top})`);
    }
    overlay.selectAll('*').remove();

    if (!activeOverlay) return;

    // Add arrow markers
    let defs = svg.select<SVGDefsElement>('defs.overlay-defs');
    if (defs.empty()) {
      defs = svg.append('defs').attr('class', 'overlay-defs');

      defs.append('marker')
        .attr('id', 'gradient-arrow')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#e74c3c');

      defs.append('marker')
        .attr('id', 'direction-arrow')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#3498db');
    }

    const { type, currentPoint, gradient, direction, nextPoint, trustRegionRadius, fx, hessian, hessianApprox } = activeOverlay;

    const cx = xScale(currentPoint[0]);
    const cy = yScale(currentPoint[1]);

    // Scale factor for vectors (adaptive based on bounds)
    const rangeX = xMax - xMin;
    const rangeY = yMax - yMin;
    const vectorScale = Math.min(innerWidth / rangeX, innerHeight / rangeY) * 0.15;

    // Draw gradient vector (always shown with gradient overlay)
    if ((type === 'gradient' || type === 'direction') && gradient) {
      const gradLen = Math.sqrt(gradient[0] ** 2 + gradient[1] ** 2);
      if (gradLen > 0.001) {
        const normGrad = [gradient[0] / gradLen, gradient[1] / gradLen];
        const arrowLen = Math.min(gradLen * vectorScale, 80);

        overlay
          .append('line')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', cx + normGrad[0] * arrowLen)
          .attr('y2', cy - normGrad[1] * arrowLen)
          .attr('stroke', '#e74c3c')
          .attr('stroke-width', 3)
          .attr('stroke-opacity', 0.9)
          .attr('marker-end', 'url(#gradient-arrow)');

        overlay
          .append('text')
          .attr('x', cx + normGrad[0] * arrowLen + 5)
          .attr('y', cy - normGrad[1] * arrowLen - 5)
          .attr('fill', '#e74c3c')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text('∇f');
      }
    }

    // Draw search direction vector
    if ((type === 'direction' || type === 'nextPoint') && direction) {
      const dirLen = Math.sqrt(direction[0] ** 2 + direction[1] ** 2);
      if (dirLen > 0.001) {
        const normDir = [direction[0] / dirLen, direction[1] / dirLen];
        const arrowLen = Math.min(dirLen * vectorScale, 100);

        overlay
          .append('line')
          .attr('x1', cx)
          .attr('y1', cy)
          .attr('x2', cx + normDir[0] * arrowLen)
          .attr('y2', cy - normDir[1] * arrowLen)
          .attr('stroke', '#3498db')
          .attr('stroke-width', 3)
          .attr('stroke-opacity', 0.9)
          .attr('marker-end', 'url(#direction-arrow)');

        overlay
          .append('text')
          .attr('x', cx + normDir[0] * arrowLen + 5)
          .attr('y', cy - normDir[1] * arrowLen + 15)
          .attr('fill', '#3498db')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text('d');
      }
    }

    // Highlight next point
    if (type === 'nextPoint' && nextPoint) {
      const nx = xScale(nextPoint[0]);
      const ny = yScale(nextPoint[1]);

      // Dashed line to next point
      overlay
        .append('line')
        .attr('x1', cx)
        .attr('y1', cy)
        .attr('x2', nx)
        .attr('y2', ny)
        .attr('stroke', '#27ae60')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('stroke-opacity', 0.8);

      // Next point highlight
      overlay
        .append('circle')
        .attr('cx', nx)
        .attr('cy', ny)
        .attr('r', 12)
        .attr('fill', 'none')
        .attr('stroke', '#27ae60')
        .attr('stroke-width', 3)
        .attr('stroke-opacity', 0.9);

      overlay
        .append('text')
        .attr('x', nx + 15)
        .attr('y', ny + 5)
        .attr('fill', '#27ae60')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('xₖ₊₁');
    }

    // Draw trust region circle
    if (type === 'direction' && trustRegionRadius !== undefined) {
      const radiusPixels = trustRegionRadius * vectorScale * 2;

      overlay
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', Math.min(radiusPixels, 100))
        .attr('fill', 'rgba(155, 89, 182, 0.1)')
        .attr('stroke', '#9b59b6')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-opacity', 0.8);

      overlay
        .append('text')
        .attr('x', cx + Math.min(radiusPixels, 100) + 5)
        .attr('y', cy)
        .attr('fill', '#9b59b6')
        .attr('font-size', '11px')
        .text('Δ');
    }

    // Draw quadratic model contours
    if (type === 'quadraticModel' && gradient && fx !== undefined) {
      const g = gradient;
      const xk = currentPoint;
      const localRange = Math.min(xMax - xMin, yMax - yMin) * 0.3;
      const resolution = 40;

      const localXMin = currentPoint[0] - localRange;
      const localXMax = currentPoint[0] + localRange;
      const localYMin = currentPoint[1] - localRange;
      const localYMax = currentPoint[1] + localRange;

      // Custom path transformation (shared)
      const geoTransform = d3.geoTransform({
        point(px, py) {
          const x = localXMin + (px / (resolution - 1)) * (localXMax - localXMin);
          const y = localYMax - (py / (resolution - 1)) * (localYMax - localYMin);
          this.stream.point(xScale(x), yScale(y));
        },
      });

      // Helper to compute quadratic model values
      const computeQuadValues = (H: readonly (readonly number[])[]) => {
        const quadValues: number[] = new Array(resolution * resolution);
        let minQuad = Infinity;
        let maxQuad = -Infinity;

        for (let j = 0; j < resolution; j++) {
          for (let i = 0; i < resolution; i++) {
            const x = localXMin + (i / (resolution - 1)) * (localXMax - localXMin);
            const y = localYMax - (j / (resolution - 1)) * (localYMax - localYMin);
            const dx = x - xk[0];
            const dy = y - xk[1];

            const gradTerm = g[0] * dx + g[1] * dy;
            const hessTermX = H[0][0] * dx + H[0][1] * dy;
            const hessTermY = H[1][0] * dx + H[1][1] * dy;
            const quadTerm = 0.5 * (dx * hessTermX + dy * hessTermY);
            const val = fx + gradTerm + quadTerm;

            quadValues[i + j * resolution] = val;
            minQuad = Math.min(minQuad, val);
            maxQuad = Math.max(maxQuad, val);
          }
        }
        return { quadValues, minQuad, maxQuad };
      };

      // Invert 2x2 matrix: B^{-1} -> H_approx
      const invert2x2 = (B: readonly (readonly number[])[]): readonly (readonly number[])[] | null => {
        const det = B[0][0] * B[1][1] - B[0][1] * B[1][0];
        if (Math.abs(det) < 1e-10) return null;
        return [
          [B[1][1] / det, -B[0][1] / det],
          [-B[1][0] / det, B[0][0] / det],
        ];
      };

      // Draw quasi-Newton approximation (purple, dashed) - from hessianApprox (inverse Hessian)
      if (hessianApprox) {
        const H_approx = invert2x2(hessianApprox);
        if (H_approx) {
          const { quadValues, minQuad, maxQuad } = computeQuadValues(H_approx);
          const numLevels = 8;
          const levels: number[] = [];
          for (let i = 0; i < numLevels; i++) {
            levels.push(minQuad + (i / (numLevels - 1)) * (maxQuad - minQuad) * 0.5);
          }

          const quadContours = d3.contours()
            .size([resolution, resolution])
            .thresholds(levels)(quadValues);

          overlay.selectAll('path.quad-approx-contour')
            .data(quadContours)
            .join('path')
            .attr('class', 'quad-approx-contour')
            .attr('d', d3.geoPath(geoTransform))
            .attr('fill', 'none')
            .attr('stroke', '#9b59b6')
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 0.6)
            .attr('stroke-dasharray', '6,3');

          overlay
            .append('text')
            .attr('x', cx + 20)
            .attr('y', cy - 35)
            .attr('fill', '#9b59b6')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .text('m_B(d) quasi-Newton');
        }
      }

      // Draw true quadratic model (orange, dotted) - from true Hessian
      if (hessian) {
        const { quadValues, minQuad, maxQuad } = computeQuadValues(hessian);
        const numLevels = 8;
        const levels: number[] = [];
        for (let i = 0; i < numLevels; i++) {
          levels.push(minQuad + (i / (numLevels - 1)) * (maxQuad - minQuad) * 0.5);
        }

        const quadContours = d3.contours()
          .size([resolution, resolution])
          .thresholds(levels)(quadValues);

        overlay.selectAll('path.quad-true-contour')
          .data(quadContours)
          .join('path')
          .attr('class', 'quad-true-contour')
          .attr('d', d3.geoPath(geoTransform))
          .attr('fill', 'none')
          .attr('stroke', '#e67e22')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.7)
          .attr('stroke-dasharray', '2,2');

        overlay
          .append('text')
          .attr('x', cx + 20)
          .attr('y', cy - 20)
          .attr('fill', '#e67e22')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .text('m(d) true quadratic');
      }
    }

    // Current point highlight
    overlay
      .append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 8)
      .attr('fill', 'none')
      .attr('stroke', '#f39c12')
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.9);

  }, [activeOverlay, xScale, yScale, xMin, xMax, yMin, yMax, innerWidth, innerHeight, margin.left, margin.top]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
    />
  );
};
