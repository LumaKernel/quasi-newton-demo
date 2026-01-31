import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import type { ObjectiveFunction } from '@/core/functions/types.ts';
import type { IterationState } from '@/core/optimizers/types.ts';
import styles from './LineSearchChart.module.css';

interface LineSearchChartProps {
  readonly func: ObjectiveFunction;
  readonly iteration: IterationState | null;
  readonly color: string;
}

export const LineSearchChart = ({
  func,
  iteration,
  color,
}: LineSearchChartProps) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);

  const lineSearchData = useMemo(() => {
    if (!iteration || !iteration.direction || iteration.alpha === null) {
      return null;
    }

    const x = iteration.x;
    const d = iteration.direction;
    const alpha = iteration.alpha;
    const fx = iteration.fx;
    const g = iteration.gradient;

    // Sample function along search direction
    const numSamples = 100;
    const alphaMax = alpha * 2.5;
    const samples: { alpha: number; f: number }[] = [];

    for (let i = 0; i <= numSamples; i++) {
      const a = (i / numSamples) * alphaMax;
      const newX = [x[0] + a * d[0], x[1] + a * d[1]];
      const fVal = func.value(newX);
      samples.push({ alpha: a, f: fVal });
    }

    // Armijo condition line: f(x) + c1 * alpha * grad^T * d
    const c1 = 1e-4; // Typical Armijo constant
    const gradDotD = g[0] * d[0] + g[1] * d[1];
    const armijoSlope = c1 * gradDotD;

    return {
      samples,
      alpha,
      fx,
      gradDotD,
      armijoSlope,
      alphaMax,
    };
  }, [func, iteration]);

  useEffect(() => {
    if (!svgRef.current || !lineSearchData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 180;
    const margin = { top: 20, right: 20, bottom: 35, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const { samples, alpha, fx, armijoSlope, alphaMax } = lineSearchData;

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, alphaMax])
      .range([0, innerWidth]);

    const fValues = samples.map((s) => s.f);
    const fMin = d3.min(fValues) ?? 0;
    const fMax = d3.max(fValues) ?? 1;
    const fPadding = (fMax - fMin) * 0.1;

    const yScale = d3.scaleLinear()
      .domain([fMin - fPadding, fMax + fPadding])
      .range([innerHeight, 0]);

    // Axes - compute explicit tick values to avoid duplicates
    const xTickCount = 5;
    const xTickValues = Array.from({ length: xTickCount + 1 }, (_, i) => (i / xTickCount) * alphaMax);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickValues(xTickValues).tickFormat((d) => {
        const val = d as number;
        if (val === 0) return '0';
        if (val < 0.01) return val.toExponential(1);
        if (val < 1) return val.toFixed(2);
        return val.toFixed(1);
      }))
      .attr('font-size', '10px');

    const yRange = (fMax + fPadding) - (fMin - fPadding);
    const yTickCount = 5;
    const yTickValues = Array.from({ length: yTickCount + 1 }, (_, i) =>
      (fMin - fPadding) + (i / yTickCount) * yRange
    );

    g.append('g')
      .call(d3.axisLeft(yScale).tickValues(yTickValues).tickFormat((d) => {
        const val = d as number;
        if (Math.abs(val) >= 1000 || (Math.abs(val) < 0.01 && val !== 0)) {
          return val.toExponential(1);
        }
        return val.toFixed(2);
      }))
      .attr('font-size', '10px');

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text('α');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text('φ(α) = f(x + αd)');

    // Draw function along search direction
    const line = d3.line<{ alpha: number; f: number }>()
      .x((d) => xScale(d.alpha))
      .y((d) => yScale(d.f));

    g.append('path')
      .datum(samples)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Draw Armijo condition line
    const armijoPoints = [
      { alpha: 0, f: fx },
      { alpha: alphaMax, f: fx + armijoSlope * alphaMax },
    ];

    g.append('path')
      .datum(armijoPoints)
      .attr('fill', 'none')
      .attr('stroke', '#e74c3c')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,3')
      .attr('d', line);

    // Draw tangent line at α=0
    const tangentPoints = [
      { alpha: 0, f: fx },
      { alpha: alphaMax * 0.3, f: fx + lineSearchData.gradDotD * alphaMax * 0.3 },
    ];

    g.append('path')
      .datum(tangentPoints)
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('d', line);

    // Mark initial point
    g.append('circle')
      .attr('cx', xScale(0))
      .attr('cy', yScale(fx))
      .attr('r', 5)
      .attr('fill', '#27ae60');

    // Mark selected alpha
    const fAtAlpha = samples.find((s) => Math.abs(s.alpha - alpha) < alphaMax / 100)?.f ?? fx;
    g.append('circle')
      .attr('cx', xScale(alpha))
      .attr('cy', yScale(fAtAlpha))
      .attr('r', 5)
      .attr('fill', color);

    // Vertical line at selected alpha
    g.append('line')
      .attr('x1', xScale(alpha))
      .attr('x2', xScale(alpha))
      .attr('y1', yScale(fAtAlpha))
      .attr('y2', innerHeight)
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerWidth - 80}, 5)`);

    legend.append('line')
      .attr('x1', 0).attr('x2', 15)
      .attr('y1', 0).attr('y2', 0)
      .attr('stroke', color).attr('stroke-width', 2);
    legend.append('text')
      .attr('x', 20).attr('y', 4)
      .attr('font-size', '9px').attr('fill', '#666')
      .text('φ(α)');

    legend.append('line')
      .attr('x1', 0).attr('x2', 15)
      .attr('y1', 12).attr('y2', 12)
      .attr('stroke', '#e74c3c').attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,3');
    legend.append('text')
      .attr('x', 20).attr('y', 16)
      .attr('font-size', '9px').attr('fill', '#666')
      .text('Armijo');

  }, [lineSearchData, color]);

  if (!lineSearchData) {
    return (
      <div className={styles.container}>
        <h4 className={styles.title}>{t('lineSearch.title')}</h4>
        <p className={styles.empty}>{t('lineSearch.noData')}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>{t('lineSearch.title')}</h4>
      <svg ref={svgRef} />
      <div className={styles.info}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>α*:</span>
          <span className={styles.infoValue}>{lineSearchData.alpha.toFixed(4)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>∇f·d:</span>
          <span className={styles.infoValue}>{lineSearchData.gradDotD.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};
