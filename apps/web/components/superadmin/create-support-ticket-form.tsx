'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  createSupportTicketSchema,
  type CreateSupportTicketDto,
  type SupportTicketResponse,
} from '@urnight/contracts';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@urnight/ui';
import { createSupportTicket } from '@/lib/api/ops';
import { useApiMutation } from '@/lib/api/use-api-mutation';

const CATEGORIES = ['incident', 'request', 'bug'] as const;
const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  incident: 'Incidente',
  request: 'Solicitud',
  bug: 'Error (bug)',
};

const PRIORITIES = ['low', 'medium', 'high'] as const;
const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

/**
 * Formulario para abrir un ticket de soporte (POST /support-tickets).
 * Nota: el backend exige rol `admin_local` para abrir tickets, por lo que un
 * super_admin "puro" puede recibir 403. Tras crear, mostramos el ID para poder
 * gestionarlo en la sección de actualización de estado.
 */
export function CreateSupportTicketForm({ onCreated }: { onCreated?: () => void } = {}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [created, setCreated] = useState<SupportTicketResponse | null>(null);

  const form = useForm<z.input<typeof createSupportTicketSchema>, unknown, CreateSupportTicketDto>({
    resolver: zodResolver(createSupportTicketSchema),
    defaultValues: {
      subject: '',
      description: '',
      category: 'request',
      priority: 'low',
      localId: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: CreateSupportTicketDto) => createSupportTicket(values, token),
    setError: form.setError,
    successMessage: (ticket) => `Ticket ${ticket.ticketCode} creado.`,
    onSuccess: (ticket) => {
      setCreated(ticket);
      form.reset();
      onCreated?.();
    },
  });

  function onSubmit(values: CreateSupportTicketDto) {
    const payload: CreateSupportTicketDto = {
      ...values,
      description: values.description?.trim() ? values.description : undefined,
      localId: values.localId?.trim() ? values.localId : undefined,
    };
    mutation.mutate(payload);
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asunto</FormLabel>
                <FormControl>
                  <Input placeholder="Resumen del problema o solicitud" {...field} />
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
                  <Textarea
                    rows={4}
                    placeholder="Detalles, pasos para reproducir, contexto…"
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(event.target.value === '' ? undefined : event.target.value)
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {CATEGORY_LABELS[category]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {PRIORITY_LABELS[priority]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="localId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  ID de local <span className="text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="UUID del local relacionado"
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(event.target.value === '' ? undefined : event.target.value)
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

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando…' : 'Abrir ticket'}
          </Button>
        </form>
      </Form>

      {created ? (
        <p className="rounded-md border bg-muted/40 p-3 text-sm">
          Ticket <span className="font-medium">{created.ticketCode}</span> creado. ID para
          gestión: <code className="text-foreground">{created.id}</code>
        </p>
      ) : null}
    </div>
  );
}
