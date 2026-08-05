'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle } from '@phosphor-icons/react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
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
  const t = useTranslations('promotorApply');
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
    successMessage: t('successToast'),
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
        <AlertTitle>{t('success.title')}</AlertTitle>
        <AlertDescription>
          {t.rich('success.description', {
            name: submitted.name,
            status: submitted.status,
            strong: (chunks: ReactNode) => (
              <span className="font-medium">{chunks}</span>
            ),
          })}
        </AlertDescription>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={() => setSubmitted(null)}>
            {t('success.submitAnother')}
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
              <FormLabel>{t('fields.name.label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('fields.name.placeholder')} {...field} />
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
                {t('fields.contactEmail.label')}{' '}
                <span className="text-muted-foreground">{t('optional')}</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('fields.contactEmail.placeholder')}
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
                {t('fields.contactPhone.label')}{' '}
                <span className="text-muted-foreground">{t('optional')}</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={t('fields.contactPhone.placeholder')}
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
                {t('fields.socials.label')}{' '}
                <span className="text-muted-foreground">{t('optional')}</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('fields.socials.placeholder')}
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
              <FormDescription>{t('fields.socials.description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? t('sending') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
