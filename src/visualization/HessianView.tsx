import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { Matrix } from '@/core/linalg/types.ts';

interface HessianViewProps {
  readonly matrix: Matrix;
  readonly title: string;
  readonly width?: number;
  readonly height?: number;
  readonly colorScheme?: 'diverging' | 'sequential';
}

export const HessianView = ({
  matrix,
  title,
  width = 200,
  height = 200,
  colorScheme = 'diverging',
}: HessianViewProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = { top: 30, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const flatValues = useMemo(() => matrix.flat(), [matrix]);
  const maxAbs = useMemo(
    () => Math.max(...flatValues.map(Math.abs), 0.001),
    [flatValues],
  );

  const colorScale = useMemo(() => {
    if (colorScheme === 'diverging') {
      return d3.scaleSequential(d3.interpolateRdBu).domain([maxAbs, -maxAbs]);
    }
    return d3.scaleSequential(d3.interpolateBlues).domain([0, maxAbs]);
  }, [maxAbs, colorScheme]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const n = matrix.length;
    const cellWidth = innerWidth / n;
    const cellHeight = innerHeight / n;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(title);

    // Draw cells
    matrix.forEach((row, i) => {
      row.forEach((value, j) => {
        g.append('rect')
          .attr('x', j * cellWidth)
          .attr('y', i * cellHeight)
          .attr('width', cellWidth - 1)
          .attr('height', cellHeight - 1)
          .attr('fill', colorScale(value))
          .attr('stroke', '#ccc')
          .attr('stroke-width', 0.5);

        // Value text
        g.append('text')
          .attr('x', j * cellWidth + cellWidth / 2)
          .attr('y', i * cellHeight + cellHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '11px')
          .attr('fill', Math.abs(value) > maxAbs * 0.5 ? '#fff' : '#333')
          .text(value.toFixed(2));
      });
    });

    // Row/column labels
    for (let i = 0; i < n; i++) {
      g.append('text')
        .attr('x', -5)
        .attr('y', i * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text(i + 1);

      g.append('text')
        .attr('x', i * cellWidth + cellWidth / 2)
        .attr('y', innerHeight + 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text(i + 1);
    }
  }, [matrix, colorScale, innerWidth, innerHeight, margin, title, width, maxAbs]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: '#fafafa', borderRadius: 4 }}
    />
  );
};
