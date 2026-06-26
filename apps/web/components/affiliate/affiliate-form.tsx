'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  submitAffiliationSchema,
  type AffiliationResponse,
  type SubmitAffiliationDto,
} from '@urnight/contracts';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@urnight/ui';
import { submitAffiliation } from '@/lib/api/companies';
import { useApiMutation } from '@/lib/api/use-api-mutation';

/** Limpia strings opcionales vacíos a undefined (no enviar campos en blanco). */
function blank(value?: string): string | undefined {
  return value && value.trim() ? value : undefined;
}

/** Formulario público de solicitud de afiliación (POST /affiliation-requests). */
export function AffiliateForm() {
  const [submitted, setSubmitted] = useState<AffiliationResponse | null>(null);

  const form = useForm<z.input<typeof submitAffiliationSchema>, unknown, SubmitAffiliationDto>({
    resolver: zodResolver(submitAffiliationSchema),
    defaultValues: {
      legalName: '',
      ruc: '',
      commercialName: '',
      address: '',
      socials: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: SubmitAffiliationDto) => submitAffiliation(values),
    setError: form.setError,
    successMessage: 'Solicitud enviada. Te contactaremos pronto.',
    onSuccess: (affiliation) => setSubmitted(affiliation),
  });

  function onSubmit(values: SubmitAffiliationDto) {
    mutation.mutate({
      ...values,
      address: blank(values.address),
      socials: blank(values.socials),
      contactName: blank(values.contactName),
      contactEmail: blank(values.contactEmail),
      contactPhone: blank(values.contactPhone),
    });
  }

  if (submitted) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Solicitud recibida</AlertTitle>
        <AlertDescription>
          La afiliación de <span className="font-medium">{submitted.commercialName}</span> está en
          estado <span className="font-medium">{submitted.status}</span>. Un administrador la
          revisará pronto.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="commercialName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre comercial</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="legalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón social</FormLabel>
                <FormControl>
                  <Input placeholder="Razón social registrada" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ruc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RUC</FormLabel>
              <FormControl>
                <Input inputMode="numeric" placeholder="11 dígitos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Dirección <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Av. / Calle, distrito" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Contacto <span className="text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del responsable" {...field} value={field.value ?? ''} />
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
                <FormLabel>
                  Teléfono <span className="text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+51 9XX XXX XXX" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Correo de contacto <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input type="email" placeholder="contacto@local.com" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="socials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Redes sociales <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Instagram, web, etc."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>Ayúdanos a conocer tu local.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Enviando…' : 'Enviar solicitud'}
        </Button>
      </form>
    </Form>
  );
}
