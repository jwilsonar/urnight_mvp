'use client';

import { Minus, Plus, UsersThree } from '@phosphor-icons/react';
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
import {
  etiquetaPulsera,
  leerPoliticaDemo,
  type PoliticaLocalDemo,
} from '@/lib/mock/politica';

const LOCAL_SLUG = 'nocturna-club';

export function PaloteoRegistrar({
  onRegistrado,
}: {
  onRegistrado?: (paloteo: PaloteoDemo) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [politica, setPolitica] = useState<PoliticaLocalDemo | null>(null);
  const [promotorId, setPromotorId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [nombreInvitado, setNombreInvitado] = useState('');
  const [documento, setDocumento] = useState('');
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
  const zonaSeleccionada = zonasActivas.find((zona) => zona.id === zonaId);

  function cambiarDialog(siguienteAbierto: boolean) {
    setAbierto(siguienteAbierto);
    if (!siguienteAbierto) {
      setCantidad(1);
      setNombreInvitado('');
      setDocumento('');
    }
  }

  function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const promotor = PROMOTORES_LOCAL_DEMO.find((item) => item.id === promotorId);
    if (!promotor || !zonaId) return;

    const nombreLimpio = nombreInvitado.trim();
    const paloteo = registrarPaloteoDemo({
      promotorId: promotor.id,
      promotorNombre: promotor.nombre,
      cantidad,
      zonaId,
      ...(nombreLimpio ? { nombreInvitado: nombreLimpio } : {}),
      ...(documento.trim() ? { documento } : {}),
    });
    onRegistrado?.(paloteo);
    toast.success(
      `${cantidad} ${cantidad === 1 ? 'ingreso registrado' : 'ingresos registrados'} a nombre de ${promotor.nombre}`,
    );
    cambiarDialog(false);
  }

  return (
    <Dialog open={abierto} onOpenChange={cambiarDialog}>
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
              <Label htmlFor="cantidad-paloteo">Cantidad de personas</Label>
              <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12"
                  onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
                  disabled={cantidad <= 1}
                  aria-label="Restar una persona"
                >
                  <Minus weight="bold" />
                </Button>
                <Input
                  id="cantidad-paloteo"
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  inputMode="numeric"
                  value={cantidad}
                  onChange={(event) => setCantidad(Math.min(20, Math.max(1, Math.floor(Number(event.target.value)))))}
                  className="h-12 text-center font-heading text-xl font-bold tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-12"
                  onClick={() => setCantidad((actual) => Math.min(20, actual + 1))}
                  disabled={cantidad >= 20}
                  aria-label="Sumar una persona"
                >
                  <Plus weight="bold" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Máximo 20 personas por registro.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre-paloteo">
                  {cantidad > 1
                    ? 'Nombre del titular del grupo (opcional)'
                    : 'Nombre del invitado (opcional)'}
                </Label>
                <Input
                  id="nombre-paloteo"
                  value={nombreInvitado}
                  onChange={(event) => setNombreInvitado(event.target.value)}
                  placeholder="Ej. Sofía Castro"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento-paloteo">Documento del titular (opcional)</Label>
                <Input
                  id="documento-paloteo"
                  value={documento}
                  onChange={(event) => setDocumento(event.target.value)}
                  placeholder="Ej. 73148204"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={20}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              En puerta se coteja con el DNI físico del titular antes de registrar el ingreso.
            </p>

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
              {/* El portero entrega la pulsera en el momento del ingreso: se la
                  mostramos antes de confirmar, no solo después en el feed. */}
              {zonaSeleccionada ? (
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: zonaSeleccionada.color }}
                  />
                  Entregar pulsera: {etiquetaPulsera(zonaSeleccionada)}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => cambiarDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!promotorId || !zonaId}>
              {cantidad === 1 ? 'Registrar ingreso' : `Registrar ${cantidad} ingresos`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
