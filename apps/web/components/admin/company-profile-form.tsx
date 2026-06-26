'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateCompanySchema, type UpdateCompanyDto } from '@urnight/contracts';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@urnight/ui';
import { getMyCompany, updateMyCompany } from '@/lib/api/companies';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

/** Edita el perfil de la propia empresa (#29). RUC y razón social son inmutables. */
export function CompanyProfileForm() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const { data: company } = useQuery({
    queryKey: queryKeys.myCompany,
    queryFn: () => getMyCompany(token),
    enabled: Boolean(token),
  });

  const form = useForm<UpdateCompanyDto>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: { commercialName: '', contactEmail: '', contactPhone: '' },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        commercialName: company.commercialName,
        contactEmail: company.contactEmail ?? '',
        contactPhone: company.contactPhone ?? '',
      });
    }
  }, [company, form]);

  const mutation = useApiMutation({
    mutationFn: (values: UpdateCompanyDto) => updateMyCompany(values, token),
    setError: form.setError,
    successMessage: 'Empresa actualizada.',
    invalidateKeys: [queryKeys.myCompany],
  });

  function onSubmit(values: UpdateCompanyDto) {
    // Campos vacíos → undefined (evita que '' falle la validación de email).
    mutation.mutate({
      commercialName: values.commercialName,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {company ? (
          <p className="text-sm text-muted-foreground">
            Razón social: <span className="font-medium text-foreground">{company.legalName}</span> ·
            RUC {company.ruc}
          </p>
        ) : null}
        <FormField
          control={form.control}
          name="commercialName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre comercial</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo de contacto</FormLabel>
              <FormControl>
                <Input type="email" {...field} value={field.value ?? ''} />
              </FormControl>
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
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </form>
    </Form>
  );
}
