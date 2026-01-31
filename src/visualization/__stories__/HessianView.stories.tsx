import type { Meta, StoryObj } from '@storybook/react';
import { HessianView } from '../HessianView.tsx';

const meta = {
  title: 'Visualization/HessianView',
  component: HessianView,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HessianView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PositiveDefinite: Story = {
  args: {
    matrix: [
      [4, 1],
      [1, 2],
    ],
    title: 'Positive Definite',
  },
};

export const Identity: Story = {
  args: {
    matrix: [
      [1, 0],
      [0, 1],
    ],
    title: 'Identity Matrix',
  },
};

export const Diverging: Story = {
  args: {
    matrix: [
      [2, -1],
      [-1, 3],
    ],
    title: 'Mixed Signs',
    colorScheme: 'diverging',
  },
};

export const Sequential: Story = {
  args: {
    matrix: [
      [0.5, 0.2],
      [0.2, 0.8],
    ],
    title: 'Correlation-like',
    colorScheme: 'sequential',
  },
};

export const LargeValues: Story = {
  args: {
    matrix: [
      [100, -50],
      [-50, 200],
    ],
    title: 'Large Values',
  },
};
