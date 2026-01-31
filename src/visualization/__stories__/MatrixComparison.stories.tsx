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
  args: {
    onAlgorithmChange: () => {},
  },
} satisfies Meta<typeof MatrixComparison>;

export default meta;
type Story = StoryObj<typeof meta>;

const rosenbrockResult = bfgsOptimize(rosenbrock, [-1, 1]);
const quadraticResult = bfgsOptimize(quadratic, [2, 2]);

const algorithmColors: Record<string, string> = {
  bfgs: '#3498db',
  dfp: '#27ae60',
  sr1: '#9b59b6',
  bb: '#16a085',
};

export const RosenbrockIteration0: Story = {
  args: {
    availableAlgorithms: [
      {
        id: 'bfgs',
        hessianApprox: rosenbrockResult.iterations[0].hessianApprox,
        trueHessian: rosenbrockResult.iterations[0].trueHessian,
      },
    ],
    selectedAlgorithmId: 'bfgs',
    iteration: 0,
    algorithmColors,
  },
};

export const RosenbrockMidway: Story = {
  args: {
    availableAlgorithms: [
      {
        id: 'bfgs',
        hessianApprox:
          rosenbrockResult.iterations[Math.floor(rosenbrockResult.iterations.length / 2)]
            .hessianApprox,
        trueHessian:
          rosenbrockResult.iterations[Math.floor(rosenbrockResult.iterations.length / 2)]
            .trueHessian,
      },
    ],
    selectedAlgorithmId: 'bfgs',
    iteration: Math.floor(rosenbrockResult.iterations.length / 2),
    algorithmColors,
  },
};

export const RosenbrockFinal: Story = {
  args: {
    availableAlgorithms: [
      {
        id: 'bfgs',
        hessianApprox:
          rosenbrockResult.iterations[rosenbrockResult.iterations.length - 1].hessianApprox,
        trueHessian:
          rosenbrockResult.iterations[rosenbrockResult.iterations.length - 1].trueHessian,
      },
    ],
    selectedAlgorithmId: 'bfgs',
    iteration: rosenbrockResult.iterations.length - 1,
    algorithmColors,
  },
};

export const QuadraticFinal: Story = {
  args: {
    availableAlgorithms: [
      {
        id: 'bfgs',
        hessianApprox:
          quadraticResult.iterations[quadraticResult.iterations.length - 1].hessianApprox,
        trueHessian:
          quadraticResult.iterations[quadraticResult.iterations.length - 1].trueHessian,
      },
    ],
    selectedAlgorithmId: 'bfgs',
    iteration: quadraticResult.iterations.length - 1,
    algorithmColors,
  },
};

export const MultipleAlgorithms: Story = {
  args: {
    availableAlgorithms: [
      {
        id: 'bfgs',
        hessianApprox:
          rosenbrockResult.iterations[rosenbrockResult.iterations.length - 1].hessianApprox,
        trueHessian:
          rosenbrockResult.iterations[rosenbrockResult.iterations.length - 1].trueHessian,
      },
      {
        id: 'dfp',
        hessianApprox:
          rosenbrockResult.iterations[rosenbrockResult.iterations.length - 1].hessianApprox,
        trueHessian:
          rosenbrockResult.iterations[rosenbrockResult.iterations.length - 1].trueHessian,
      },
    ],
    selectedAlgorithmId: 'bfgs',
    iteration: rosenbrockResult.iterations.length - 1,
    algorithmColors,
  },
};
