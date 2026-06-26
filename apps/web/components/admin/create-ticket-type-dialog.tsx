'use client';

import { Plus } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import type { z } from 'zod';
import { createTicketTypeSchema, type CreateTicketTypeDto } from '@urnight/contracts';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@urnight/ui';
import { createTicketType } from '@/lib/api/admin';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

const TIERS: { value: CreateTicketTypeDto['tierCode']; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'vip', label: 'VIP' },
  { value: 'premium', label: 'Premium' },
];

const defaults = (eventId: string): z.input<typeof createTicketTypeSchema> => ({
  eventId,
  name: '',
  tierCode: 'general',
  price: 0,
  currency: 'PEN',
  stock: 1,
});

export function CreateTicketTypeDialog({ eventId }: { eventId: string }) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [open, setOpen] = useState(false);

  const form = useForm<z.input<typeof createTicketTypeSchema>, unknown, CreateTicketTypeDto>({
    resolver: zodResolver(createTicketTypeSchema),
    defaultValues: defaults(eventId),
  });

  const mutation = useApiMutation({
    mutationFn: (values: CreateTicketTypeDto) => createTicketType(values, token),
    setError: form.setError,
    successMessage: (ticket) => `Entrada "${ticket.name}" creada.`,
    invalidateKeys: [queryKeys.ticketTypes(eventId)],
    onSuccess: () => {
      setOpen(false);
      form.reset(defaults(eventId));
    },
  });

  function onSubmit(values: CreateTicketTypeDto) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" weight="bold" />
          Crear entrada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear tipo de entrada</DialogTitle>
          <DialogDescription>Define el nombre, precio y stock de esta entrada.</DialogDescription>
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
                    <Input placeholder="Entrada general" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tierCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIERS.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (PEN)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={field.value ?? 0}
                        onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
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
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={field.value ?? 1}
                        onChange={(event) => field.onChange(event.target.valueAsNumber || 0)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>Cantidad disponible.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creando…' : 'Crear entrada'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
