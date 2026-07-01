import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';

/**
 * Card del DS: fill oscuro, hairline, radio 16, sin sombra en reposo.
 * Las cards clickeables levantan 2px con borde amatista al hover.
 */
const meta = {
  title: 'UrNight/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Contenido: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Resumen de tu local</CardTitle>
        <CardDescription>Todo listo. Tu evento se revisará y publicará en minutos.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Badge variant="success">● Abierto ahora</Badge>
        <Button size="sm">Ver panel</Button>
      </CardContent>
    </Card>
  ),
};

export const Clickeable: Story = {
  render: () => (
    <Card className="w-96 cursor-pointer p-5 hover:-translate-y-0.5 hover:border-accent-border hover:shadow-float">
      <div className="un-img-ph mb-4 aspect-[16/10] rounded-sm">
        <span>Cover del evento</span>
      </div>
      <p className="un-eyebrow mb-1">Sáb 19 Abr · 11:00pm</p>
      <p className="font-heading text-[17px] font-bold">Noche de amatista</p>
      <p className="mt-1 text-sm text-muted-foreground">Barranco · Desde S/ 60</p>
    </Card>
  ),
};
