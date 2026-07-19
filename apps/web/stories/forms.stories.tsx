import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@urnight/ui';

/**
 * Campos del DS (patrón .field): 46px, fill suave, focus ring carmín
 * pegado al borde, placeholders muted.
 */
const meta = {
  title: 'UrNight/Formularios',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Campos: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sb-email">Correo electrónico</Label>
        <Input id="sb-email" type="email" placeholder="tucorreo@ejemplo.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Zona</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Elige una zona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="barranco">Barranco</SelectItem>
            <SelectItem value="miraflores">Miraflores</SelectItem>
            <SelectItem value="san-isidro">San Isidro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sb-msg">Cuéntanos qué pasa</Label>
        <Textarea id="sb-msg" placeholder="Escribe tu mensaje…" />
      </div>
    </div>
  ),
};
