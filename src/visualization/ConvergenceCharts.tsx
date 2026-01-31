import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import type { OptimizationResult } from '@/core/optimizers/types.ts';
import styles from './ConvergenceCharts.module.css';

interface ConvergenceChartsProps {
  readonly results: ReadonlyMap<string, OptimizationResult>;
  readonly currentIteration: number;
  readonly algorithmColors: Record<string, string>;
}

type ChartType = 'functionValue' | 'gradientNorm' | 'stepSize';

export const ConvergenceCharts = ({
  results,
  currentIteration,
  algorithmColors,
}: ConvergenceChartsProps) => {
  const { t } = useTranslation();
  const fxRef = useRef<SVGSVGElement>(null);
  const gradRef = useRef<SVGSVGElement>(null);
  const alphaRef = useRef<SVGSVGElement>(null);

  const chartData = useMemo(() => {
    const data: Record<string, {
      fx: number[];
      gradNorm: number[];
      alpha: (number | null)[];
    }> = {};

    results.forEach((result, id) => {
      data[id] = {
        fx: result.iterations.map((iter) => iter.fx),
        gradNorm: result.iterations.map((iter) => iter.gradientNorm),
        alpha: result.iterations.map((iter) => iter.alpha),
      };
    });

    return data;
  }, [results]);

  const maxIterations = useMemo(() => {
    let max = 0;
    results.forEach((result) => {
      max = Math.max(max, result.iterations.length);
    });
    return max;
  }, [results]);

  const drawChart = (
    svgRef: React.RefObject<SVGSVGElement | null>,
    chartType: ChartType,
    useLogScale: boolean = false,
  ) => {
    if (!svgRef.current || results.size === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 150;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Collect all values for y scale
    const allValues: number[] = [];
    Object.entries(chartData).forEach(([, data]) => {
      const values = chartType === 'functionValue' ? data.fx :
                     chartType === 'gradientNorm' ? data.gradNorm :
                     data.alpha.filter((v): v is number => v !== null);
      allValues.push(...values.slice(0, currentIteration + 1).filter((v) => v > 0 || !useLogScale));
    });

    if (allValues.length === 0) return;

    const xScale = d3.scaleLinear()
      .domain([0, Math.max(maxIterations - 1, 1)])
      .range([0, innerWidth]);

    const yMin = useLogScale ? Math.max(d3.min(allValues) ?? 1e-10, 1e-10) : d3.min(allValues) ?? 0;
    const yMax = d3.max(allValues) ?? 1;

    const yScale = useLogScale
      ? d3.scaleLog().domain([yMin, yMax]).range([innerHeight, 0])
      : d3.scaleLinear().domain([yMin * 0.9, yMax * 1.1]).range([innerHeight, 0]);

    // Draw axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('d')))
      .attr('font-size', '10px');

    // For log scale, compute explicit tick values to avoid duplicates
    const yAxis = d3.axisLeft(yScale);
    if (useLogScale) {
      // Generate log-spaced tick values
      const logMin = Math.log10(yMin);
      const logMax = Math.log10(yMax);
      const logRange = logMax - logMin;
      const numTicks = Math.min(5, Math.max(2, Math.ceil(logRange)));
      const tickValues: number[] = [];
      for (let i = 0; i <= numTicks; i++) {
        const logVal = logMin + (i / numTicks) * logRange;
        tickValues.push(Math.pow(10, logVal));
      }
      yAxis.tickValues(tickValues);
    } else {
      yAxis.ticks(4);
    }

    g.append('g')
      .call(yAxis.tickFormat((d) => {
        const val = d as number;
        if (Math.abs(val) < 0.001 || Math.abs(val) >= 10000) {
          return val.toExponential(1);
        }
        return val.toFixed(2);
      }))
      .attr('font-size', '10px');

    // Draw lines for each algorithm
    Object.entries(chartData).forEach(([id, data]) => {
      const values = chartType === 'functionValue' ? data.fx :
                     chartType === 'gradientNorm' ? data.gradNorm :
                     data.alpha;

      const lineData = values
        .slice(0, currentIteration + 1)
        .map((v, i) => ({ x: i, y: v }))
        .filter((d) => d.y !== null && (!useLogScale || d.y > 0));

      if (lineData.length === 0) return;

      const line = d3.line<{ x: number; y: number | null }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y as number))
        .defined((d) => d.y !== null);

      g.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke', algorithmColors[id] || '#666')
        .attr('stroke-width', 2)
        .attr('d', line);

      // Current iteration marker
      const currentValue = values[Math.min(currentIteration, values.length - 1)];
      if (currentValue !== null && (!useLogScale || currentValue > 0)) {
        g.append('circle')
          .attr('cx', xScale(Math.min(currentIteration, values.length - 1)))
          .attr('cy', yScale(currentValue))
          .attr('r', 4)
          .attr('fill', algorithmColors[id] || '#666');
      }
    });

    // Current iteration line
    g.append('line')
      .attr('x1', xScale(currentIteration))
      .attr('x2', xScale(currentIteration))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
  };

  useEffect(() => {
    drawChart(fxRef, 'functionValue', false);
    drawChart(gradRef, 'gradientNorm', true);
    drawChart(alphaRef, 'stepSize', false);
  }, [chartData, currentIteration, maxIterations, algorithmColors]);

  if (results.size === 0) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('convergence.title')}</h3>

      <div className={styles.charts}>
        <div className={styles.chart}>
          <div className={styles.chartLabel}>{t('convergence.functionValue')}</div>
          <svg ref={fxRef} />
        </div>

        <div className={styles.chart}>
          <div className={styles.chartLabel}>{t('convergence.gradientNorm')} (log)</div>
          <svg ref={gradRef} />
        </div>

        <div className={styles.chart}>
          <div className={styles.chartLabel}>{t('convergence.stepSize')}</div>
          <svg ref={alphaRef} />
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Array.from(results.keys()).map((id) => (
          <div key={id} className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ background: algorithmColors[id] }}
            />
            <span className={styles.legendLabel}>{t(`optimizers.${id}.name`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
