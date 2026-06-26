'use client';

import { PencilSimple, X } from '@phosphor-icons/react';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { EventResponse, UpdateEventDto, ZoneResponse } from '@urnight/contracts';
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
  Textarea,
  cn,
} from '@urnight/ui';
import { MediaDropzone } from '@/components/shared/media-dropzone';
import { updateEvent } from '@/lib/api/admin';
import { getMusicGenres, getTags } from '@/lib/api/catalog';
import { queryKeys } from '@/lib/api/query-keys';
import { uploadToStaging } from '@/lib/api/uploads';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { StorageImage } from '@/lib/storage/storage-context';

/** ISO → valor para `<input type="datetime-local">` (YYYY-MM-DDTHH:mm en local). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60_000).toISOString().slice(0, 16);
}

/** Valor de `datetime-local` → ISO 8601, o undefined si está vacío/ inválido. */
function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

interface FormState {
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  totalCapacity: number;
  minAgeNote: string;
  dressCode: string;
  genreIds: string[];
  tagIds: string[];
  customTags: string[];
}

function fromEvent(event: EventResponse): FormState {
  return {
    name: event.name,
    description: event.description ?? '',
    startsAt: isoToLocalInput(event.startsAt),
    endsAt: isoToLocalInput(event.endsAt),
    totalCapacity: event.totalCapacity,
    minAgeNote: event.minAgeNote ?? '',
    dressCode: event.dressCode ?? '',
    genreIds: event.genreIds ?? [],
    tagIds: event.tagIds ?? [],
    customTags: event.customTags ?? [],
  };
}

/** Clave de comparación de etiquetas libres (case/acentos-insensible) para deduplicar. */
function tagKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');
}

/** Alterna la pertenencia de `id` en una lista de selección (chips). */
function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Multiselección por chips (categorías / etiquetas). */
function ChipSelect({
  label,
  hint,
  options,
  selected,
  onToggle,
  emptyHint,
}: {
  label: string;
  hint?: string;
  options: ZoneResponse[];
  selected: string[];
  onToggle: (id: string) => void;
  emptyHint: string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label} {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </Label>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = selected.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(o.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:border-primary hover:text-foreground',
                )}
              >
                {o.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface EditEventDialogProps {
  event: EventResponse;
  /** Modo controlado (p. ej. desde un menú): si se pasa, no se renderiza trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Modo no controlado: nodo que abre el diálogo (p. ej. un botón "Editar"). */
  trigger?: ReactNode;
  /** Claves de TanStack Query a invalidar tras guardar. */
  invalidateKeys?: readonly QueryKey[];
  /** Callback extra tras guardar (p. ej. router.refresh() en una server page). */
  onUpdated?: () => void;
}

/**
 * Editar un evento desde el panel admin: datos + flyer. El flyer se sube a
 * staging (S3) y se envía como `flyerKey`; el backend lo promueve y reemplaza
 * la imagen actual. Reutilizable controlado (menú) o con trigger propio.
 */
export function EditEventDialog({
  event,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  trigger,
  invalidateKeys = [],
  onUpdated,
}: EditEventDialogProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (next: boolean) => (isControlled ? onOpenChangeProp?.(next) : setInternalOpen(next));

  const [form, setForm] = useState<FormState>(() => fromEvent(event));
  const [flyerKey, setFlyerKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  // Catálogo (público): categorías/géneros y etiquetas. Solo al abrir el diálogo.
  const { data: genres = [] } = useQuery({
    queryKey: queryKeys.musicGenres,
    queryFn: getMusicGenres,
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const { data: tags = [] } = useQuery({
    queryKey: queryKeys.tags,
    queryFn: getTags,
    enabled: open,
    staleTime: 5 * 60_000,
  });

  // Etiquetas libres (no del catálogo): el admin las escribe por evento.
  const [tagDraft, setTagDraft] = useState('');
  function addCustomTag() {
    const value = tagDraft.trim().slice(0, 40);
    if (!value) return;
    setForm((f) =>
      f.customTags.some((t) => tagKey(t) === tagKey(value))
        ? f
        : { ...f, customTags: [...f.customTags, value] },
    );
    setTagDraft('');
  }
  function removeCustomTag(value: string) {
    setForm((f) => ({ ...f, customTags: f.customTags.filter((t) => t !== value) }));
  }

  // Al abrir, rehidrata el formulario con los datos actuales del evento y
  // limpia cualquier flyer pendiente de una edición previa.
  useEffect(() => {
    if (open) {
      setForm(fromEvent(event));
      setFlyerKey(null);
      setPreview(null);
      setUploadPct(null);
    }
    // Solo rehidrata al abrir o al cambiar de evento (no en refetches del mismo).
  }, [open, event.id]);

  // Libera el object URL del preview local al reemplazarlo/desmontar.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const mutation = useApiMutation({
    mutationFn: (dto: UpdateEventDto) => updateEvent(event.id, dto, token),
    successMessage: (updated) => `Evento "${updated.name}" actualizado.`,
    invalidateKeys,
    onSuccess: () => {
      setOpen(false);
      onUpdated?.();
    },
  });

  async function handleAccepted(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!token) {
      toast.error('Sesión no disponible. Vuelve a iniciar sesión.');
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return localUrl;
    });
    setUploadPct(0);
    try {
      const key = await uploadToStaging(file, 'event', token, setUploadPct);
      setFlyerKey(key);
      setUploadPct(100);
    } catch (err) {
      setFlyerKey(null);
      setUploadPct(null);
      toast.error(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    }
  }

  function onSubmit() {
    if (form.name.trim().length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    const startsAt = localInputToIso(form.startsAt);
    if (!startsAt) {
      toast.error('Indica una fecha de inicio válida.');
      return;
    }
    if (uploadPct !== null && uploadPct < 100) {
      toast.error('Espera a que termine de subir la imagen.');
      return;
    }
    const dto: UpdateEventDto = {
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      startsAt,
      endsAt: localInputToIso(form.endsAt) ?? null,
      totalCapacity: form.totalCapacity,
      minAgeNote: form.minAgeNote.trim() || undefined,
      dressCode: form.dressCode.trim() ? form.dressCode.trim() : null,
      genreIds: form.genreIds,
      tagIds: form.tagIds,
      customTags: form.customTags,
      ...(flyerKey ? { flyerKey } : {}),
    };
    mutation.mutate(dto);
  }

  const currentFlyer = preview ?? event.flyerUrl;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90dvh] w-full max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>Actualiza los datos y la imagen del evento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Flyer */}
          <div className="space-y-2">
            <Label>Flyer / imagen</Label>
            {currentFlyer ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                {preview ? (
                  // Preview local del archivo recién elegido (aún sin resolver S3, blob URL).
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <StorageImage
                    src={currentFlyer}
                    alt={event.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="object-cover"
                  />
                )}
                {uploadPct !== null && uploadPct < 100 ? (
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            <MediaDropzone onAccepted={handleAccepted} maxFiles={1} disabled={mutation.isPending} />
            <p className={cn('text-xs text-muted-foreground', !currentFlyer && 'sr-only')}>
              {flyerKey ? 'Nueva imagen lista. Guarda para aplicarla.' : 'Sube una imagen para reemplazar la actual.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del evento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">
              Descripción <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="edit-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Detalles del evento…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-startsAt">Inicio</Label>
              <Input
                id="edit-startsAt"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-endsAt">
                Fin <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="edit-endsAt"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-capacity">Capacidad total</Label>
            <Input
              id="edit-capacity"
              type="number"
              min={0}
              inputMode="numeric"
              value={form.totalCapacity}
              onChange={(e) =>
                setForm((f) => ({ ...f, totalCapacity: e.target.valueAsNumber || 0 }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-minAge">
                Edad mínima <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="edit-minAge"
                value={form.minAgeNote}
                onChange={(e) => setForm((f) => ({ ...f, minAgeNote: e.target.value }))}
                placeholder="+18"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dress">
                Vestimenta <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="edit-dress"
                value={form.dressCode}
                onChange={(e) => setForm((f) => ({ ...f, dressCode: e.target.value }))}
                placeholder="Elegante / Casual"
              />
            </div>
          </div>

          <ChipSelect
            label="Categorías"
            hint="(géneros musicales)"
            options={genres}
            selected={form.genreIds}
            onToggle={(id) => setForm((f) => ({ ...f, genreIds: toggleId(f.genreIds, id) }))}
            emptyHint="Aún no hay categorías en el catálogo."
          />

          <ChipSelect
            label="Etiquetas"
            hint="(del catálogo)"
            options={tags}
            selected={form.tagIds}
            onToggle={(id) => setForm((f) => ({ ...f, tagIds: toggleId(f.tagIds, id) }))}
            emptyHint="Aún no hay etiquetas en el catálogo."
          />

          {/* Etiquetas libres por evento (se guardan como JSON, no en el catálogo). */}
          <div className="space-y-2">
            <Label htmlFor="edit-custom-tag">
              Etiquetas personalizadas <span className="text-muted-foreground">(crea las tuyas)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="edit-custom-tag"
                value={tagDraft}
                maxLength={40}
                placeholder="Ej. DJ Peligro"
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCustomTag} disabled={!tagDraft.trim()}>
                Añadir
              </Button>
            </div>
            {form.customTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.customTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm text-foreground"
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`Quitar ${t}`}
                      onClick={() => removeCustomTag(t)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Añade etiquetas únicas para este evento. Se buscan igual que las del catálogo.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Botón "Editar" listo para usar (modo no controlado con trigger propio). */
export function EditEventButton({
  event,
  invalidateKeys,
  onUpdated,
}: Pick<EditEventDialogProps, 'event' | 'invalidateKeys' | 'onUpdated'>) {
  return (
    <EditEventDialog
      event={event}
      invalidateKeys={invalidateKeys}
      onUpdated={onUpdated}
      trigger={
        <Button variant="outline">
          <PencilSimple className="h-4 w-4" weight="bold" />
          Editar
        </Button>
      }
    />
  );
}
