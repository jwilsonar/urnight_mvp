'use client';

import { Plus } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import type { z } from 'zod';
import { createEventSchema, type CreateEventDto } from '@urnight/contracts';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Textarea,
} from '@urnight/ui';
import { StagedImageField } from '@/components/shared/staged-image-field';
import { createEvent } from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { useStagedUpload } from '@/lib/hooks/use-staged-upload';
import { localInputToIso } from '@/lib/utils';
import { slugify } from './slugify';

function blankToUndefined(value: string | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

/** Crear evento vía modal para un local concreto. Invalida la lista del local. */
export function CreateEventDialog({ localId }: { localId: string }) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [open, setOpen] = useState(false);
  const slugEdited = useRef(false);
  // Flyer con drag-and-drop: se sube a staging al soltarlo y el submit envía la key.
  const flyer = useStagedUpload('event');

  const defaults = (): z.input<typeof createEventSchema> => ({
    localId,
    name: '',
    slug: '',
    description: '',
    startsAt: '',
    endsAt: '',
    totalCapacity: 0,
    minAgeNote: '',
    dressCode: '',
  });

  const form = useForm<z.input<typeof createEventSchema>, unknown, CreateEventDto>({
    resolver: zodResolver(createEventSchema),
    defaultValues: defaults(),
  });

  const mutation = useApiMutation({
    mutationFn: (values: CreateEventDto) => createEvent(values, token),
    setError: form.setError,
    successMessage: (event) => `Evento "${event.name}" creado.`,
    invalidateKeys: [queryKeys.events(localId)],
    onSuccess: () => {
      setOpen(false);
      slugEdited.current = false;
      flyer.reset();
      form.reset(defaults());
    },
  });

  function onSubmit(values: CreateEventDto) {
    mutation.mutate({
      ...values,
      localId,
      description: blankToUndefined(values.description ?? undefined),
      endsAt: blankToUndefined(values.endsAt ?? undefined),
      flyerKey: flyer.stagedKey ?? undefined,
      minAgeNote: blankToUndefined(values.minAgeNote ?? undefined),
      dressCode: blankToUndefined(values.dressCode ?? undefined),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) flyer.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" weight="bold" />
          Crear evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear evento</DialogTitle>
          <DialogDescription>Define los datos del evento para este local.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nombre del evento"
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        if (!slugEdited.current) {
                          form.setValue('slug', slugify(event.target.value), { shouldValidate: false });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="mi-evento"
                      {...field}
                      onChange={(event) => {
                        slugEdited.current = true;
                        field.onChange(event);
                      }}
                    />
                  </FormControl>
                  <FormDescription>Solo minúsculas, números y guiones.</FormDescription>
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
                    <Textarea placeholder="Detalles del evento…" rows={3} {...field} value={field.value ?? ''} />
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
                      <Input
                        type="datetime-local"
                        value={field.value && field.value.length > 16 ? field.value.slice(0, 16) : (field.value ?? '')}
                        onChange={(event) => field.onChange(localInputToIso(event.target.value) ?? '')}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
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
                      <Input
                        type="datetime-local"
                        value={field.value && field.value.length > 16 ? field.value.slice(0, 16) : (field.value ?? '')}
                        onChange={(event) =>
                          field.onChange(event.target.value ? (localInputToIso(event.target.value) ?? '') : '')
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
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
                      onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>Aforo del evento. Usa 0 si aún no lo defines.</FormDescription>
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
                      <Input placeholder="+18" {...field} value={field.value ?? ''} />
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
                      <Input placeholder="Elegante / Casual" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Flyer <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <StagedImageField upload={flyer} disabled={mutation.isPending} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || flyer.status === 'uploading'}>
                {mutation.isPending ? 'Creando…' : 'Crear evento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
