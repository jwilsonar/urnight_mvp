'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  cn,
} from '@urnight/ui';
import { MetasEditor } from '@/components/admin/metas-editor';
import { ZonasEditor } from '@/components/admin/zonas-editor';
import {
  guardarPoliticaDemo,
  leerPoliticaDemo,
  type PoliticaLocalDemo,
} from '@/lib/mock/politica';

interface RadioChoiceProps {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  description?: string;
  onChange: () => void;
}

function RadioChoice({
  name,
  value,
  checked,
  label,
  description,
  onChange,
}: RadioChoiceProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors',
        checked
          ? 'border-accent-border bg-accent-soft'
          : 'bg-muted/30 hover:border-[var(--accent-border-subtle)]',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 accent-primary"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function ToggleRow({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border bg-muted/30 p-3.5">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="text-sm font-semibold">{children}</span>
    </label>
  );
}

export function PoliticaLocalForm({ localSlug }: { localSlug: string }) {
  const [politica, setPolitica] = useState<PoliticaLocalDemo>(() => leerPoliticaDemo(localSlug));

  useEffect(() => {
    setPolitica(leerPoliticaDemo(localSlug));
  }, [localSlug]);

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const siguiente = {
      ...politica,
      cupoCodigosPorPromotor: Math.max(0, Math.floor(politica.cupoCodigosPorPromotor)),
    };
    setPolitica(siguiente);
    guardarPoliticaDemo(siguiente);
    toast.success('Política guardada');
  }

  return (
    <form className="space-y-6" onSubmit={guardar}>
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
          <CardDescription>Define cuánto se adelanta y cómo se distribuye ese pago.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold">Adelanto de la reserva</legend>
            <RadioChoice
              name="adelanto"
              value="50"
              checked={politica.adelantoPct === 50}
              label="50%"
              description="El cliente paga la mitad al reservar y completa el consumo en el local."
              onChange={() => setPolitica((actual) => ({ ...actual, adelantoPct: 50 }))}
            />
            <RadioChoice
              name="adelanto"
              value="100"
              checked={politica.adelantoPct === 100}
              label="100%"
              description="El cliente cubre todo el monto mínimo al confirmar la reserva."
              onChange={() => setPolitica((actual) => ({ ...actual, adelantoPct: 100 }))}
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-bold">Destino del adelanto</legend>
            <RadioChoice
              name="split-consumo"
              value="90"
              checked={politica.splitConsumoPct === 90}
              label="90% consumo / 10% comisión"
              description="El 90% queda como crédito de consumo y el 10% cubre el servicio de reserva."
              onChange={() => setPolitica((actual) => ({ ...actual, splitConsumoPct: 90 }))}
            />
            <RadioChoice
              name="split-consumo"
              value="100"
              checked={politica.splitConsumoPct === 100}
              label="100% consumo"
              description="Todo el adelanto se convierte en crédito para consumir dentro del local."
              onChange={() => setPolitica((actual) => ({ ...actual, splitConsumoPct: 100 }))}
            />
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Puerta</CardTitle>
          <CardDescription>Configura reingresos y atribución de invitados a promotores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <ToggleRow
              checked={politica.reingresoPermitido}
              onCheckedChange={(reingresoPermitido) =>
                setPolitica((actual) => ({ ...actual, reingresoPermitido }))
              }
            >
              Permitir reingreso
            </ToggleRow>
            <ToggleRow
              checked={politica.paloteoHabilitado}
              onCheckedChange={(paloteoHabilitado) =>
                setPolitica((actual) => ({ ...actual, paloteoHabilitado }))
              }
            >
              Permitir paloteo (ingreso a nombre de un promotor)
            </ToggleRow>
          </div>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="cupo-promotor">Cupo de códigos por promotor por evento</Label>
            <Input
              id="cupo-promotor"
              type="number"
              min={0}
              step={1}
              value={politica.cupoCodigosPorPromotor}
              onChange={(event) =>
                setPolitica((actual) => ({
                  ...actual,
                  cupoCodigosPorPromotor: Math.max(0, Number(event.target.value)),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zonas</CardTitle>
          <CardDescription>Ordena y publica las zonas disponibles para reservas e ingresos.</CardDescription>
        </CardHeader>
        <CardContent>
          <ZonasEditor
            value={politica.zonas}
            onChange={(zonas) => setPolitica((actual) => ({ ...actual, zonas }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metas de promotores</CardTitle>
          <CardDescription>Define los umbrales y recompensas del equipo de promoción.</CardDescription>
        </CardHeader>
        <CardContent>
          <MetasEditor
            value={politica.metas}
            onChange={(metas) => setPolitica((actual) => ({ ...actual, metas }))}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">Guardar cambios</Button>
      </div>
    </form>
  );
}
