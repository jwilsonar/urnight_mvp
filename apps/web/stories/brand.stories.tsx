import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Logo } from '../components/shared/logo';

/** Piezas de marca y paleta provisional del DS RAVENUE. */
const meta = {
  title: 'RAVENUE/Marca',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lockup: Story = {
  render: () => <Logo />,
};

export const Eyebrow: Story = {
  render: () => <p className="rv-eyebrow">Lo más hot para esta semana</p>,
};

export const PlaceholderImagen: Story = {
  render: () => (
    <div className="rv-img-ph h-48 w-80 rounded-lg">
      <span>Galería del local</span>
    </div>
  ),
};

const PALETTE = [
  { name: 'Obsidian Night', hex: '#09090D', token: 'var(--rv-obsidian)' },
  { name: 'Midnight Carbon', hex: '#15151C', token: 'var(--bg-surface)' },
  { name: 'Ravenue Crimson', hex: '#B21E45', token: 'var(--rv-crimson)' },
  { name: 'Deep Wine', hex: '#6E1833', token: 'var(--rv-wine)' },
  { name: 'Moon White', hex: '#F4F0F2', token: 'var(--rv-moon)' },
  { name: 'Smoke Gray', hex: '#A8A4AE', token: 'var(--rv-smoke)' },
  { name: 'Steel Border', hex: '#302E38', token: 'var(--rv-steel)' },
  { name: 'Rose', hex: '#E8A2B8', token: 'var(--rv-rose)' },
] as const;

export const Paleta: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PALETTE.map((color) => (
        <article key={color.name} className="overflow-hidden rounded-lg border bg-card">
          <div className="h-24 border-b" style={{ backgroundColor: color.token }} aria-hidden="true" />
          <div className="p-4">
            <p className="font-bold">{color.name}</p>
            <p className="mt-1 font-mono text-xs text-rose">{color.hex}</p>
          </div>
        </article>
      ))}
    </div>
  ),
};
