import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { IterationState } from '@/core/optimizers/types.ts';
import { useVisualization } from '@/contexts/index.ts';

interface ContourPlotProps {
  readonly func: ObjectiveFunction;
  readonly iterations: readonly IterationState[];
  readonly currentIteration: number;
  readonly width?: number;
  readonly height?: number;
  readonly showPath?: boolean;
  readonly showDirection?: boolean;
  readonly onStartPointChange?: (point: readonly [number, number]) => void;
}

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

  // Use log scale for thresholds if range is large
  const useLog = maxVal / Math.max(minVal, 0.001) > 100;
  const numThresholds = 20;
  const thresholds: number[] = [];

  if (useLog && minVal > 0) {
    const logMin = Math.log(minVal);
    const logMax = Math.log(Math.min(maxVal, minVal * 1000));
    for (let i = 0; i < numThresholds; i++) {
      thresholds.push(Math.exp(logMin + (i / (numThresholds - 1)) * (logMax - logMin)));
    }
  } else {
    const clampedMax = Math.min(maxVal, minVal + (maxVal - minVal) * 0.5);
    for (let i = 0; i < numThresholds; i++) {
      thresholds.push(minVal + (i / (numThresholds - 1)) * (clampedMax - minVal));
    }
  }

  return { values, thresholds };
};

export const ContourPlot = ({
  func,
  iterations,
  currentIteration,
  width = 500,
  height = 500,
  showPath = true,
  showDirection = true,
  onStartPointChange,
}: ContourPlotProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { activeOverlay } = useVisualization();
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
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

  const colorScale = useMemo(
    () =>
      d3
        .scaleSequential(d3.interpolateYlGnBu)
        .domain([
          contourData.thresholds[0],
          contourData.thresholds[contourData.thresholds.length - 1],
        ]),
    [contourData.thresholds],
  );

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
      .attr('fill', (d) => colorScale(d.value))
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
    colorScale,
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

    const { type, currentPoint, gradient, direction, nextPoint, trustRegionRadius } = activeOverlay;

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
        .text('x_{k+1}');
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
