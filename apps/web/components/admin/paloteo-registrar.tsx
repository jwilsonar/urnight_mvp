'use client';

import { UsersThree } from '@phosphor-icons/react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@urnight/ui';
import {
  PROMOTORES_LOCAL_DEMO,
  registrarPaloteoDemo,
  type PaloteoDemo,
} from '@/lib/mock/paloteo';
import { leerPoliticaDemo, type PoliticaLocalDemo } from '@/lib/mock/politica';

const LOCAL_SLUG = 'nocturna-club';

export function PaloteoRegistrar({
  onRegistrado,
}: {
  onRegistrado?: (paloteo: PaloteoDemo) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [politica, setPolitica] = useState<PoliticaLocalDemo | null>(null);
  const [promotorId, setPromotorId] = useState('');
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [zonaId, setZonaId] = useState('');

  useEffect(() => {
    const politicaActual = leerPoliticaDemo(LOCAL_SLUG);
    setPolitica(politicaActual);
    setZonaId(
      [...politicaActual.zonas]
        .sort((a, b) => a.orden - b.orden)
        .find((zona) => zona.activa)?.id ?? '',
    );
  }, []);

  if (!politica?.paloteoHabilitado) return null;

  const zonasActivas = [...politica.zonas]
    .filter((zona) => zona.activa)
    .sort((a, b) => a.orden - b.orden);

  function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const promotor = PROMOTORES_LOCAL_DEMO.find((item) => item.id === promotorId);
    if (!promotor || !zonaId) return;

    const nombreLimpio = nombreInvitado.trim();
    const paloteo = registrarPaloteoDemo({
      promotorId: promotor.id,
      promotorNombre: promotor.nombre,
      zonaId,
      ...(nombreLimpio ? { nombreInvitado: nombreLimpio } : {}),
    });
    onRegistrado?.(paloteo);
    toast.success(`Ingreso registrado a nombre de ${promotor.nombre}`);
    setNombreInvitado('');
    setAbierto(false);
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <UsersThree weight="duotone" /> Vengo de parte de…
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={confirmar}>
          <DialogHeader>
            <DialogTitle>Registrar paloteo</DialogTitle>
            <DialogDescription>
              Atribuye este ingreso al promotor que invitó a la persona.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-5">
            <div className="space-y-2">
              <Label>Promotor</Label>
              <Select value={promotorId} onValueChange={setPromotorId}>
                <SelectTrigger aria-label="Seleccionar promotor">
                  <SelectValue placeholder="Selecciona un promotor" />
                </SelectTrigger>
                <SelectContent>
                  {PROMOTORES_LOCAL_DEMO.map((promotor) => (
                    <SelectItem key={promotor.id} value={promotor.id}>
                      {promotor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre-paloteo">Nombre del invitado (opcional)</Label>
              <Input
                id="nombre-paloteo"
                value={nombreInvitado}
                onChange={(event) => setNombreInvitado(event.target.value)}
                placeholder="Ej. Sofía Castro"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label>Zona</Label>
              <Select value={zonaId} onValueChange={setZonaId}>
                <SelectTrigger aria-label="Seleccionar zona">
                  <SelectValue placeholder="Selecciona una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zonasActivas.map((zona) => (
                    <SelectItem key={zona.id} value={zona.id}>
                      {zona.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!promotorId || !zonaId}>
              Registrar ingreso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
