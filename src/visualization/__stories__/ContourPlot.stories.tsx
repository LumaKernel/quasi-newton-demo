import type { Meta, StoryObj } from '@storybook/react';
import { ContourPlot } from '../ContourPlot.tsx';
import { rosenbrock, himmelblau, quadratic } from '@/core/functions/index.ts';
import { bfgsOptimize } from '@/core/optimizers/bfgs.ts';

const meta = {
  title: 'Visualization/ContourPlot',
  component: ContourPlot,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ContourPlot>;

export default meta;
type Story = StoryObj<typeof meta>;

const rosenbrockIterations = bfgsOptimize(rosenbrock, [-1, 1]).iterations;
const himmelblauIterations = bfgsOptimize(himmelblau, [0, 0]).iterations;
const quadraticIterations = bfgsOptimize(quadratic, [2, 2]).iterations;

export const Rosenbrock: Story = {
  args: {
    func: rosenbrock,
    iterations: rosenbrockIterations,
    currentIteration: rosenbrockIterations.length - 1,
    width: 500,
    height: 450,
  },
};

export const RosenbrockAnimated: Story = {
  args: {
    func: rosenbrock,
    iterations: rosenbrockIterations,
    currentIteration: Math.floor(rosenbrockIterations.length / 2),
    width: 500,
    height: 450,
    showDirection: true,
  },
};

export const Himmelblau: Story = {
  args: {
    func: himmelblau,
    iterations: himmelblauIterations,
    currentIteration: himmelblauIterations.length - 1,
    width: 500,
    height: 450,
  },
};

export const Quadratic: Story = {
  args: {
    func: quadratic,
    iterations: quadraticIterations,
    currentIteration: quadraticIterations.length - 1,
    width: 500,
    height: 450,
  },
};

export const EmptyPlot: Story = {
  args: {
    func: rosenbrock,
    iterations: [],
    currentIteration: 0,
    width: 500,
    height: 450,
  },
};
