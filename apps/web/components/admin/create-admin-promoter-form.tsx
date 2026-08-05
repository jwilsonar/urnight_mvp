'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  createPromoterSchema,
  type CreatePromoterDto,
  type PromoterResponse,
} from '@urnight/contracts';
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

const ALL_LOCALS = 'all';
const formSchema = createPromoterSchema.extend({
  contactPhone: z.string().trim().min(6, 'Ingresa un teléfono válido.').max(20),
});
type PromoterFormValues = z.input<typeof formSchema>;

const EMPTY: PromoterFormValues = {
  name: '',
  email: '',
  localId: undefined,
  contactPhone: '',
};

export function CreateAdminPromoterForm({
  onCreated,
}: {
  onCreated: (promoter: PromoterResponse) => void;
}) {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const companyId = session?.user?.companyId ?? '';

  const localsQuery = useQuery({
    queryKey: queryKeys.myLocals,
    queryFn: () => listMyLocals(token ?? ''),
    enabled: status === 'authenticated' && Boolean(token),
  });
  const myLocals = localsQuery.data ?? [];

  const form = useForm<PromoterFormValues, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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

  function onSubmit(values: z.output<typeof formSchema>) {
    if (!companyId) {
      toast.error('No se encontró la empresa asociada a tu cuenta.');
      return;
    }
    mutation.mutate({
      name: values.name,
      email: values.email,
      localId: values.localId,
      contactPhone: values.contactPhone,
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
                Recibirá la solicitud en este correo para confirmar la asociación.
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
                    ? 'Aún no tienes locales: se asociará a toda la empresa.'
                    : 'Selecciona un local o mantén el alcance de toda la empresa.'}
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
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+51 9XX XXX XXX" autoComplete="tel" {...field} />
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
