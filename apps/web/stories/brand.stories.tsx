import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo } from "../components/shared/logo";

/** Piezas de marca y paleta provisional del DS RAVENUE. */
const meta = {
  title: "RAVENUE/Marca",
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
  { name: "Obsidian Night", hex: "#0A0A0D", token: "var(--rv-obsidian)" },
  { name: "Charcoal Carbon", hex: "#16181B", token: "var(--bg-surface)" },
  { name: "Ravenue Crimson", hex: "#E31732", token: "var(--rv-crimson)" },
  { name: "Deep Wine", hex: "#7A0F1F", token: "var(--rv-wine)" },
  { name: "Moon White", hex: "#F5F5F7", token: "var(--rv-moon)" },
  { name: "Smoke Gray", hex: "#A3A8B3", token: "var(--rv-smoke)" },
  { name: "Steel Border", hex: "#2F3440", token: "var(--rv-steel)" },
  { name: "Soft Border", hex: "#3A404D", token: "var(--rv-border-soft)" },
] as const;

export const Paleta: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PALETTE.map((color) => (
        <article
          key={color.name}
          className="overflow-hidden rounded-lg border bg-card"
        >
          <div
            className="h-24 border-b"
            style={{ backgroundColor: color.token }}
            aria-hidden="true"
          />
          <div className="p-4">
            <p className="font-bold">{color.name}</p>
            <p className="mt-1 font-mono text-xs text-rose">{color.hex}</p>
          </div>
        </article>
      ))}
    </div>
  ),
};
