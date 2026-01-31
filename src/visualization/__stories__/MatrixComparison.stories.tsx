import type { Meta, StoryObj } from '@storybook/react';
import { MatrixComparison } from '../MatrixComparison.tsx';
import { rosenbrock, quadratic } from '@/core/functions/index.ts';
import { bfgsOptimize } from '@/core/optimizers/bfgs.ts';

const meta = {
  title: 'Visualization/MatrixComparison',
  component: MatrixComparison,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MatrixComparison>;

export default meta;
type Story = StoryObj<typeof meta>;

const rosenbrockResult = bfgsOptimize(rosenbrock, [-1, 1]);
const quadraticResult = bfgsOptimize(quadratic, [2, 2]);

export const RosenbrockIteration0: Story = {
  args: {
    trueHessian: rosenbrockResult.iterations[0].trueHessian,
    approximateInverseHessian: rosenbrockResult.iterations[0].hessianApprox,
    iteration: 0,
  },
};

export const RosenbrockMidway: Story = {
  args: {
    trueHessian:
      rosenbrockResult.iterations[Math.floor(rosenbrockResult.iterations.length / 2)]
        .trueHessian,
    approximateInverseHessian:
      rosenbrockResult.iterations[Math.floor(rosenbrockResult.iterations.length / 2)]
        .hessianApprox,
    iteration: Math.floor(rosenbrockResult.iterations.length / 2),
  },
};

export const RosenbrockFinal: Story = {
  args: {
    trueHessian:
      rosenbrockResult.iterations[rosenbrockResult.iterations.length - 1].trueHessian,
    approximateInverseHessian:
      rosenbrockResult.iterations[rosenbrockResult.iterations.length - 1].hessianApprox,
    iteration: rosenbrockResult.iterations.length - 1,
  },
};

export const QuadraticFinal: Story = {
  args: {
    trueHessian:
      quadraticResult.iterations[quadraticResult.iterations.length - 1].trueHessian,
    approximateInverseHessian:
      quadraticResult.iterations[quadraticResult.iterations.length - 1].hessianApprox,
    iteration: quadraticResult.iterations.length - 1,
  },
};
