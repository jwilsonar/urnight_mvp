'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle } from '@phosphor-icons/react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  applyPromoterSchema,
  type ApplyPromoterDto,
  type PromoterApplicationResponse,
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
import { applyPromoter } from '@/lib/api/promoters';
import { useApiMutation } from '@/lib/api/use-api-mutation';

/** Formulario de postulación a promotor (POST /promoter-applications). */
export function ApplyPromoterForm() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [submitted, setSubmitted] = useState<PromoterApplicationResponse | null>(null);

  const form = useForm<z.input<typeof applyPromoterSchema>, unknown, ApplyPromoterDto>({
    resolver: zodResolver(applyPromoterSchema),
    defaultValues: {
      name: session?.user?.name ?? '',
      contactEmail: session?.user?.email ?? '',
      contactPhone: '',
      socials: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: ApplyPromoterDto) => applyPromoter(values, token),
    setError: form.setError,
    successMessage: 'Postulación enviada. Te avisaremos cuando sea revisada.',
    onSuccess: (application) => {
      setSubmitted(application);
      form.reset({ name: '', contactEmail: '', contactPhone: '', socials: '' });
    },
  });

  function onSubmit(values: ApplyPromoterDto) {
    const payload: ApplyPromoterDto = {
      ...values,
      contactEmail: values.contactEmail?.trim() ? values.contactEmail : undefined,
      contactPhone: values.contactPhone?.trim() ? values.contactPhone : undefined,
      socials: values.socials?.trim() ? values.socials : undefined,
    };
    mutation.mutate(payload);
  }

  if (submitted) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Postulación recibida</AlertTitle>
        <AlertDescription>
          Tu postulación <span className="font-medium">{submitted.name}</span> está en estado{' '}
          <span className="font-medium">{submitted.status}</span>. Un administrador la revisará
          pronto.
        </AlertDescription>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={() => setSubmitted(null)}>
            Enviar otra postulación
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre o marca</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre artístico o marca" {...field} />
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
              <FormLabel>
                Correo de contacto <span className="text-muted-foreground">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="tu@correo.com"
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
                  placeholder="Instagram, TikTok, etc. — cuéntanos tu alcance."
                  rows={3}
                  value={field.value ?? ''}
                  onChange={(event) =>
                    field.onChange(event.target.value === '' ? undefined : event.target.value)
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>Comparte enlaces que muestren tu comunidad.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Enviando…' : 'Enviar postulación'}
        </Button>
      </form>
    </Form>
  );
}
