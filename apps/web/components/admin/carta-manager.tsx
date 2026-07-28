'use client';

import { ForkKnife, MagnifyingGlass, PencilSimple, Plus } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@urnight/ui';
import { CartaItemDialog } from '@/components/admin/carta-item-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { StorageImage } from '@/lib/storage/storage-context';
import { formatPEN } from '@/lib/utils';
import {
  CARTA_CATEGORIAS_DEMO,
  CARTA_CONFIG_DEMO,
  CARTA_ITEMS_DEMO,
  CARTA_TAG_LABEL,
  type CartaConfigDemo,
  type CartaItemDemo,
} from '@/lib/mock/carta';

type PendingToggle =
  | { type: 'config'; enabled: boolean }
  | { type: 'availability'; item: CartaItemDemo; available: boolean };

/**
 * Gestión demo de la carta: productos, disponibilidad y configuración por
 * local. Todo en estado client; con backend real cada acción llama a
 * lib/api/ (módulo de catálogo in-venue) vía use-api-mutation.
 */
export function CartaManager() {
  const [items, setItems] = useState<CartaItemDemo[]>(CARTA_ITEMS_DEMO);
  const [configs, setConfigs] = useState<CartaConfigDemo[]>(CARTA_CONFIG_DEMO);
  const [selectedSlug, setSelectedSlug] = useState(CARTA_CONFIG_DEMO[0]!.localSlug);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dialogItem, setDialogItem] = useState<CartaItemDemo | 'new' | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);

  const config = configs.find((c) => c.localSlug === selectedSlug) ?? configs[0]!;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        (!categoryId || item.categoryId === categoryId) &&
        (!q || item.name.toLowerCase().includes(q)),
    );
  }, [items, categoryId, query]);

  const activos = items.filter((i) => i.available).length;
  const agotados = items.length - activos;

  const updateConfig = (patch: Partial<CartaConfigDemo>) => {
    setConfigs((prev) => prev.map((c) => (c.localSlug === selectedSlug ? { ...c, ...patch } : c)));
  };

  const setAvailable = (id: string, available: boolean) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available } : i)));
  };

  const saveItem = (item: CartaItemDemo) => {
    const isNew = !items.some((current) => current.id === item.id);
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [item, ...prev];
    });
    toast.success(isNew ? 'Producto creado.' : 'Cambios guardados.');
    setDialogItem(null);
  };

  const confirmToggle = () => {
    if (!pendingToggle) return;
    if (pendingToggle.type === 'config') {
      updateConfig({ enabled: pendingToggle.enabled });
      toast.success(pendingToggle.enabled ? 'Carta habilitada.' : 'Carta deshabilitada.');
    } else {
      setAvailable(pendingToggle.item.id, pendingToggle.available);
      toast.success(
        pendingToggle.available
          ? `${pendingToggle.item.name} está disponible.`
          : `${pendingToggle.item.name} quedó no disponible.`,
      );
    }
    setPendingToggle(null);
  };

  return (
    <div className="space-y-8">
      {/* Configuración por local */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>
            La carta se muestra a asistentes con entrada validada. Los cambios se guardan al
            conectar el backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="carta-local">Local</Label>
            <Select value={selectedSlug} onValueChange={setSelectedSlug}>
              <SelectTrigger id="carta-local">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {configs.map((c) => (
                  <SelectItem key={c.localSlug} value={c.localSlug}>
                    {c.localName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="carta-zona">Zona de recojo</Label>
            <Input
              id="carta-zona"
              value={config.pickupZone}
              onChange={(e) => updateConfig({ pickupZone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carta-horario">Horario de pedidos</Label>
            <Input
              id="carta-horario"
              value={config.schedule}
              onChange={(e) => updateConfig({ schedule: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Carta digital</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full text-foreground"
              aria-pressed={config.enabled}
              onClick={() => setPendingToggle({ type: 'config', enabled: !config.enabled })}
            >
              {config.enabled ? 'Habilitada' : 'Deshabilitada'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <dl className="grid grid-cols-3 gap-4">
        {[
          { label: 'Productos activos', value: activos },
          { label: 'Agotados', value: agotados },
          { label: 'Categorías', value: CARTA_CATEGORIAS_DEMO.length },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{kpi.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold tabular-nums">{kpi.value}</dd>
          </Card>
        ))}
      </dl>

      {/* Filtros + acciones */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto…"
            className="pl-9"
            aria-label="Buscar producto"
          />
        </div>
        <Select
          value={categoryId ?? 'all'}
          onValueChange={(v) => setCategoryId(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-44" aria-label="Filtrar por categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {CARTA_CATEGORIAS_DEMO.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogItem('new')}>
          <Plus className="size-4" weight="bold" /> Nuevo producto
        </Button>
      </div>

      {/* Tabla de productos */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Etiquetas</TableHead>
              <TableHead>Disponible</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  'even:bg-muted/30 hover:bg-accent transition-opacity duration-200',
                  !item.available && 'opacity-50',
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md border">
                      <StorageImage
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="line-clamp-2 max-w-64 text-xs leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {CARTA_CATEGORIAS_DEMO.find((c) => c.id === item.categoryId)?.name ?? '—'}
                </TableCell>
                <TableCell className="font-semibold tabular-nums">
                  {formatPEN(item.priceSoles)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {CARTA_TAG_LABEL[tag]}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-foreground"
                    aria-pressed={item.available}
                    onClick={() =>
                      setPendingToggle({
                        type: 'availability',
                        item,
                        available: !item.available,
                      })
                    }
                  >
                    {item.available ? 'Disponible' : 'No disponible'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${item.name}`}
                    onClick={() => setDialogItem(item)}
                  >
                    <PencilSimple className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    compact
                    icon={<ForkKnife weight="duotone" />}
                    title="Sin productos para este filtro"
                    action={
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setQuery('');
                            setCategoryId(null);
                          }}
                        >
                          Limpiar filtro
                        </Button>
                        <Button onClick={() => setDialogItem('new')}>Nuevo producto</Button>
                      </div>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      <CartaItemDialog
        open={dialogItem !== null}
        initial={dialogItem === 'new' ? null : dialogItem}
        onOpenChange={(open) => {
          if (!open) setDialogItem(null);
        }}
        onSave={saveItem}
      />

      <ConfirmDialog
        open={pendingToggle !== null}
        onOpenChange={(open) => {
          if (!open) setPendingToggle(null);
        }}
        destructive={false}
        title={
          pendingToggle?.type === 'config'
            ? pendingToggle.enabled
              ? '¿Habilitar la carta?'
              : '¿Deshabilitar la carta?'
            : pendingToggle?.available
              ? '¿Marcar el producto como disponible?'
              : '¿Marcar el producto como no disponible?'
        }
        description={
          pendingToggle?.type === 'config'
            ? 'Confirma el cambio de visibilidad de la carta para los asistentes.'
            : `Confirma el cambio de disponibilidad de ${pendingToggle?.item.name ?? 'este producto'}.`
        }
        confirmLabel="Confirmar cambio"
        onConfirm={confirmToggle}
      />
    </div>
  );
}
