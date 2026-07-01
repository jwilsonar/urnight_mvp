import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '@urnight/ui';

/**
 * Pills de estado del DS: fill tintado + borde suave + foreground legible.
 * El radio pill está reservado a chips/tags/badges.
 */
const meta = {
  title: 'UrNight/Badge',
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tonos: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Destacado</Badge>
      <Badge variant="secondary">Techno</Badge>
      <Badge variant="success">● Abierto ahora</Badge>
      <Badge variant="warning">Casi lleno</Badge>
      <Badge variant="destructive">Agotado</Badge>
      <Badge variant="info">Verificado por UrNight</Badge>
      <Badge variant="outline">+18</Badge>
    </div>
  ),
};
