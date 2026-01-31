import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { IterationState } from '@/core/optimizers/types.ts';

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
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
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

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
    />
  );
};
