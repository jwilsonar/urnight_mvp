import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Logo } from '../components/shared/logo';

/**
 * Piezas de marca: lockup (copa amatista + wordmark), eyebrow lavanda y
 * placeholder de imagen rotulado del DS.
 */
const meta = {
  title: 'UrNight/Marca',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lockup: Story = {
  render: () => <Logo />,
};

export const Eyebrow: Story = {
  render: () => <p className="un-eyebrow">Lo más hot para esta semana</p>,
};

export const PlaceholderImagen: Story = {
  render: () => (
    <div className="un-img-ph h-48 w-80 rounded-lg">
      <span>Galería del local</span>
    </div>
  ),
};
