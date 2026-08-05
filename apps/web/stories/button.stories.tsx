import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@urnight/ui';

/**
 * Botón según DS RAVENUE: primary carmín con glow de firma, secondary con
 * fill blanco sutil, outline = "ghost" del DS (borde carmín, texto rosa).
 * Alturas 34/44/52, radios 8/12/16.
 */
const meta = {
  title: 'RAVENUE/Button',
  component: Button,
  args: { children: 'Comprar entradas' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = { args: { variant: 'secondary', children: 'Ver detalles' } };

export const Outline: Story = { args: { variant: 'outline', children: 'Reservar mesa' } };

export const Destructive: Story = { args: { variant: 'destructive', children: 'Cancelar evento' } };

export const Ghost: Story = { args: { variant: 'ghost', children: 'Omitir' } };

export const LinkVariant: Story = { args: { variant: 'link', children: 'Ver todos los eventos' } };

export const Tamanos: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Pequeño</Button>
      <Button size="default">Mediano</Button>
      <Button size="lg">Grande</Button>
    </div>
  ),
};
