'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { createPromoterSchema, type CreatePromoterDto, type PromoterResponse } from '@urnight/contracts';
import {
  Button,
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
import { listMyLocals } from '@/lib/api/admin';
import { createPromoter } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

interface CreatePromoterFormProps {
  /** Se invoca con el promotor invitado (queda en estado `pending`). */
  onCreated: (promoter: PromoterResponse) => void;
}

/** Sentinela del selector de local para "toda la empresa" (sin local específico). */
const ALL_LOCALS = 'all';

type PromoterFormValues = z.input<typeof createPromoterSchema>;

const EMPTY: PromoterFormValues = {
  name: '',
  email: '',
  localId: undefined,
  contactPhone: '',
};

/**
 * Invitar a un promotor. NO se piden UUIDs: la persona se identifica por su
 * correo y el local se elige con un selector (poblado con los locales de la
 * empresa del actor). El promotor queda `pending` hasta que confirme.
 */
export function CreatePromoterForm({ onCreated }: CreatePromoterFormProps) {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  // Empresa del actor (claims del token): el promotor pertenece a su tenant.
  const companyId = session?.user?.companyId ?? '';

  // Locales de la empresa del actor: el backend ya los aísla por tenant.
  const localsQuery = useQuery({
    queryKey: queryKeys.myLocals,
    queryFn: () => listMyLocals(token ?? ''),
    enabled: status === 'authenticated' && Boolean(token),
  });
  const myLocals = localsQuery.data ?? [];

  const form = useForm<PromoterFormValues, unknown, CreatePromoterDto>({
    resolver: zodResolver(createPromoterSchema),
    defaultValues: EMPTY,
  });

  const mutation = useApiMutation({
    mutationFn: (values: CreatePromoterDto) => createPromoter(values, token),
    setError: form.setError,
    successMessage: (promoter) => `Invitación enviada a ${promoter.invitedEmail ?? promoter.name}.`,
    onSuccess: (promoter) => {
      onCreated(promoter);
      form.reset(EMPTY);
    },
  });

  function onSubmit(values: CreatePromoterDto) {
    if (!companyId) {
      toast.error('No se encontró la empresa asociada a tu cuenta.');
      return;
    }
    mutation.mutate({
      name: values.name,
      email: values.email,
      localId: values.localId,
      contactPhone: values.contactPhone?.trim() ? values.contactPhone : undefined,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del promotor</FormLabel>
              <FormControl>
                <Input placeholder="Nombre o marca" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo de la persona</FormLabel>
              <FormControl>
                <Input type="email" placeholder="promotor@correo.com" {...field} />
              </FormControl>
              <FormDescription>
                Si ya tiene cuenta, recibirá la solicitud para confirmar. Si no, al registrarse con
                este correo podrá aceptar la asociación.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="localId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Local <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <Select
                value={field.value ?? ALL_LOCALS}
                onValueChange={(value) => field.onChange(value === ALL_LOCALS ? undefined : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Toda la empresa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ALL_LOCALS}>Toda la empresa</SelectItem>
                  {myLocals.map((local) => (
                    <SelectItem key={local.id} value={local.id}>
                      {local.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {localsQuery.isPending
                  ? 'Cargando tus locales…'
                  : myLocals.length === 0
                    ? 'Aún no tienes locales: el promotor quedará a nivel de toda la empresa.'
                    : 'Asigna el promotor a un local o déjalo para toda la empresa.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Teléfono <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+51 9XX XXX XXX"
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

        <Button type="submit" className="w-full" disabled={mutation.isPending || !companyId}>
          {mutation.isPending ? 'Enviando invitación…' : 'Invitar promotor'}
        </Button>
      </form>
    </Form>
  );
}
