'use client';

import { ArrowLeft, ArrowRight, Check, Plus } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { type FieldPath, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import type { z } from 'zod';
import { createEventSchema, type CreateEventDto } from '@urnight/contracts';
import {
  Badge,
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
  cn,
} from '@urnight/ui';
import { StagedImageField } from '@/components/shared/staged-image-field';
import { createEvent } from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { useStagedUpload } from '@/lib/hooks/use-staged-upload';
import { formatDate, localInputToIso } from '@/lib/utils';
import { slugify } from './slugify';

type EventFormInput = z.input<typeof createEventSchema>;

const STEPS = ['Básicos', 'Fecha y aforo', 'Detalles', 'Resumen'] as const;

const STEP_FIELDS: FieldPath<EventFormInput>[][] = [
  ['name', 'slug', 'description'],
  ['startsAt', 'endsAt', 'totalCapacity'],
  ['minAgeNote', 'dressCode'],
];

function blankToUndefined(value: string | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label="Progreso del evento">
      {STEPS.map((label, index) => (
        <li key={label} className="flex items-center gap-2 sm:gap-3">
          <span
            aria-current={index === current ? 'step' : undefined}
            className={cn(
              'flex size-7 items-center justify-center rounded-full border text-xs font-bold transition-colors',
              index < current
                ? 'border-primary bg-primary text-primary-foreground'
                : index === current
                  ? 'border-primary bg-accent-soft text-lavender'
                  : 'border-border text-muted-foreground',
            )}
          >
            {index < current ? <Check className="size-3.5" /> : index + 1}
          </span>
          <span
            className={cn(
              'hidden text-xs font-semibold sm:inline',
              index === current ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
          {index < STEPS.length - 1 ? <span className="h-px w-4 bg-border sm:w-8" /> : null}
        </li>
      ))}
    </ol>
  );
}

/** Conserva el alta real y distribuye el mismo formulario en cuatro pasos. */
export function CreateEventWizard({ localId }: { localId: string }) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const slugEdited = useRef(false);
  // El flyer mantiene staging para no crear el evento hasta que la imagen esté lista.
  const flyer = useStagedUpload('event');

  const defaults = (): EventFormInput => ({
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

  const form = useForm<EventFormInput, unknown, CreateEventDto>({
    resolver: zodResolver(createEventSchema),
    defaultValues: defaults(),
    mode: 'onChange',
  });

  const mutation = useApiMutation({
    mutationFn: (values: CreateEventDto) => createEvent(values, token),
    setError: form.setError,
    successMessage: (event) => `Evento "${event.name}" creado.`,
    invalidateKeys: [queryKeys.events(localId)],
    onSuccess: () => {
      setOpen(false);
      setStep(0);
      slugEdited.current = false;
      flyer.reset();
      form.reset(defaults());
    },
  });

  const values = form.watch();
  const fields = STEP_FIELDS[step] ?? [];
  const requiredReady =
    step === 0
      ? Boolean(values.name?.trim() && values.slug?.trim())
      : step === 1
        ? Boolean(values.startsAt?.trim() && Number.isFinite(values.totalCapacity))
        : true;
  const stepHasErrors = fields.some(
    (field) => form.getFieldState(field, form.formState).invalid,
  );
  const canContinue =
    requiredReady && !stepHasErrors && flyer.status !== 'uploading' && !mutation.isPending;

  function onSubmit(valuesDto: CreateEventDto) {
    mutation.mutate({
      ...valuesDto,
      localId,
      description: blankToUndefined(valuesDto.description ?? undefined),
      endsAt: blankToUndefined(valuesDto.endsAt ?? undefined),
      flyerKey: flyer.stagedKey ?? undefined,
      minAgeNote: blankToUndefined(valuesDto.minAgeNote ?? undefined),
      dressCode: blankToUndefined(valuesDto.dressCode ?? undefined),
    });
  }

  async function continueToNextStep() {
    // Validar solo el bloque visible evita ocultar errores en un paso posterior.
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setStep(0);
          flyer.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" weight="bold" />
          Crear evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle>Crear evento</DialogTitle>
            <Badge variant="info">Demo — creación conectada al backend de eventos</Badge>
          </div>
          <DialogDescription>
            Completa los datos del evento para este local en cuatro pasos.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b pb-5">
          <Stepper current={step} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {step === 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading text-lg font-bold">Datos básicos</h3>
                  <p className="text-sm text-muted-foreground">
                    La identidad que verá el público en el catálogo.
                  </p>
                </div>

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
                              form.setValue('slug', slugify(event.target.value), {
                                shouldValidate: true,
                              });
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
                        <Textarea
                          placeholder="Detalles del evento…"
                          rows={4}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading text-lg font-bold">Fecha y aforo</h3>
                  <p className="text-sm text-muted-foreground">
                    Define cuándo ocurre y cuántas personas puede recibir.
                  </p>
                </div>

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
                            value={
                              field.value && field.value.length > 16
                                ? field.value.slice(0, 16)
                                : (field.value ?? '')
                            }
                            onChange={(event) =>
                              field.onChange(localInputToIso(event.target.value) ?? '')
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
                            value={
                              field.value && field.value.length > 16
                                ? field.value.slice(0, 16)
                                : (field.value ?? '')
                            }
                            onChange={(event) =>
                              field.onChange(
                                event.target.value
                                  ? (localInputToIso(event.target.value) ?? '')
                                  : '',
                              )
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
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading text-lg font-bold">Detalles</h3>
                  <p className="text-sm text-muted-foreground">
                    Agrega indicaciones útiles y el flyer del evento.
                  </p>
                </div>

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
                          <Input
                            placeholder="Elegante / Casual"
                            {...field}
                            value={field.value ?? ''}
                          />
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
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-heading text-lg font-bold">Resumen</h3>
                  <p className="text-sm text-muted-foreground">
                    Revisa la información antes de crear el evento.
                  </p>
                </div>

                <dl className="divide-y rounded-md border bg-surface px-4">
                  <SummaryRow label="Nombre" value={values.name || 'Sin nombre'} />
                  <SummaryRow label="Slug" value={values.slug || 'Sin slug'} />
                  <SummaryRow
                    label="Descripción"
                    value={values.description?.trim() || 'Sin descripción'}
                  />
                  <SummaryRow
                    label="Inicio"
                    value={values.startsAt ? formatDate(values.startsAt) : 'Sin fecha'}
                  />
                  <SummaryRow
                    label="Fin"
                    value={values.endsAt ? formatDate(values.endsAt) : 'Sin fecha de cierre'}
                  />
                  <SummaryRow
                    label="Aforo"
                    value={`${(values.totalCapacity ?? 0).toLocaleString('es-PE')} personas`}
                  />
                  <SummaryRow label="Edad mínima" value={values.minAgeNote || 'Sin indicación'} />
                  <SummaryRow label="Vestimenta" value={values.dressCode || 'Sin indicación'} />
                  <SummaryRow label="Flyer" value={flyer.stagedKey ? 'Flyer listo' : 'Sin flyer'} />
                </dl>
              </div>
            ) : null}

            <DialogFooter className="gap-2">
              {step === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={mutation.isPending}
                >
                  Cancelar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={mutation.isPending}
                >
                  <ArrowLeft className="size-4" /> Atrás
                </Button>
              )}

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={continueToNextStep} disabled={!canContinue}>
                  Continuar <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={mutation.isPending || flyer.status === 'uploading'}
                >
                  {mutation.isPending ? 'Creando…' : 'Crear evento'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 text-sm sm:grid-cols-[140px_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words font-semibold sm:text-right">{value}</dd>
    </div>
  );
}
