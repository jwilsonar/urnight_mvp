'use client';

import { PencilSimple, X } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { EventResponse, UpdateEventDto } from '@urnight/contracts';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Textarea,
} from '@urnight/ui';
import { ChipSelect } from '@/components/shared/chip-select';
import { StagedImageField } from '@/components/shared/staged-image-field';
import { updateEvent } from '@/lib/api/admin';
import { getMusicGenres, getTags } from '@/lib/api/catalog';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { useStagedUpload } from '@/lib/hooks/use-staged-upload';
import { isoToLocalInput, localInputToIso, tagKey } from '@/lib/utils';

/**
 * Esquema del formulario (fechas como valor local de `datetime-local`; la
 * transformación a ISO 8601 se hace en el submit con los utils compartidos).
 * Las cotas replican las de `updateEventSchema` — el DTO final se tipa como
 * `UpdateEventDto`, así el compilador detecta cualquier drift con el contrato.
 */
const formSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(180),
  description: z.string().max(8000),
  startsAt: z
    .string()
    .refine((value) => Boolean(localInputToIso(value)), 'Indica una fecha de inicio válida.'),
  endsAt: z.string(),
  totalCapacity: z.number().int().min(0),
  minAgeNote: z.string().max(40),
  dressCode: z.string().max(120),
  genreIds: z.array(z.string()),
  tagIds: z.array(z.string()),
  customTags: z.array(z.string()),
});
type FormValues = z.infer<typeof formSchema>;

function fromEvent(event: EventResponse): FormValues {
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

/** Alterna la pertenencia de `id` en una lista de selección (chips). */
function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
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
 * Validación con RHF + Zod y errores inline (patrón estándar del proyecto).
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

  const flyer = useStagedUpload('event');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: fromEvent(event),
  });

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
  const customTags = form.watch('customTags');
  function addCustomTag() {
    const value = tagDraft.trim().slice(0, 40);
    if (!value) return;
    const current = form.getValues('customTags');
    if (!current.some((t) => tagKey(t) === tagKey(value))) {
      form.setValue('customTags', [...current, value], { shouldDirty: true });
    }
    setTagDraft('');
  }
  function removeCustomTag(value: string) {
    form.setValue(
      'customTags',
      form.getValues('customTags').filter((t) => t !== value),
      { shouldDirty: true },
    );
  }

  // Al abrir, rehidrata el formulario con los datos actuales del evento y
  // limpia cualquier flyer pendiente de una edición previa.
  useEffect(() => {
    if (open) {
      form.reset(fromEvent(event));
      flyer.reset();
      setTagDraft('');
    }
    // Solo rehidrata al abrir o al cambiar de evento (no en refetches del mismo).
  }, [open, event.id]);

  const mutation = useApiMutation({
    mutationFn: (dto: UpdateEventDto) => updateEvent(event.id, dto, token),
    setError: form.setError,
    successMessage: (updated) => `Evento "${updated.name}" actualizado.`,
    invalidateKeys,
    onSuccess: () => {
      setOpen(false);
      onUpdated?.();
    },
  });

  function onSubmit(values: FormValues) {
    if (flyer.status === 'uploading') {
      toast.error('Espera a que termine de subir la imagen.');
      return;
    }
    const dto: UpdateEventDto = {
      name: values.name,
      description: values.description.trim() ? values.description.trim() : null,
      startsAt: localInputToIso(values.startsAt),
      endsAt: localInputToIso(values.endsAt) ?? null,
      totalCapacity: values.totalCapacity,
      minAgeNote: values.minAgeNote.trim() || undefined,
      dressCode: values.dressCode.trim() ? values.dressCode.trim() : null,
      genreIds: values.genreIds,
      tagIds: values.tagIds,
      customTags: values.customTags,
      ...(flyer.stagedKey ? { flyerKey: flyer.stagedKey } : {}),
    };
    mutation.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[90dvh] w-full max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>Actualiza los datos y la imagen del evento.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Flyer */}
            <div className="space-y-2">
              <Label>Flyer / imagen</Label>
              <StagedImageField
                upload={flyer}
                currentUrl={event.flyerUrl}
                disabled={mutation.isPending}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Descripción <span className="text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles del evento…" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Fin <span className="text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="totalCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad total</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="minAgeNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Edad mínima <span className="text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+18" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dressCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Vestimenta <span className="text-muted-foreground">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Elegante / Casual" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <ChipSelect
              label="Categorías"
              hint="(géneros musicales)"
              options={genres}
              selected={form.watch('genreIds')}
              onToggle={(id) =>
                form.setValue('genreIds', toggleId(form.getValues('genreIds'), id), {
                  shouldDirty: true,
                })
              }
              emptyHint="Aún no hay categorías en el catálogo."
            />

            <ChipSelect
              label="Etiquetas"
              hint="(del catálogo)"
              options={tags}
              selected={form.watch('tagIds')}
              onToggle={(id) =>
                form.setValue('tagIds', toggleId(form.getValues('tagIds'), id), {
                  shouldDirty: true,
                })
              }
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
              {customTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {customTags.map((t) => (
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || flyer.status === 'uploading'}>
                {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
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
