'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { updatePreferenceSchema, type UpdatePreferenceDto } from '@urnight/contracts';
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@urnight/ui';
import { updatePreferences } from '@/lib/api/identity';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

const LOCALES = [
  { value: 'es-PE', label: 'Español (Perú)' },
  { value: 'en-US', label: 'English (US)' },
];

/**
 * Edita las preferencias del usuario (PATCH /me/preferences). El backend no
 * expone GET de preferencias, por lo que partimos de valores por defecto; el
 * guardado persiste e invalida el perfil (`queryKeys.me`).
 */
export function PreferencesForm() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const form = useForm<UpdatePreferenceDto>({
    resolver: zodResolver(updatePreferenceSchema),
    defaultValues: {
      acceptsMarketing: false,
      acceptsReminders: true,
      preferredLocale: 'es-PE',
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: UpdatePreferenceDto) => updatePreferences(values, token),
    setError: form.setError,
    successMessage: 'Preferencias actualizadas.',
    invalidateKeys: [queryKeys.me],
  });

  function onSubmit(values: UpdatePreferenceDto) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="preferredLocale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Idioma" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LOCALES.map((locale) => (
                    <SelectItem key={locale.value} value={locale.value}>
                      {locale.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Guarda tu preferencia de idioma. La traducción de la interfaz al inglés llega
                próximamente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptsReminders"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} />
              </FormControl>
              <div className="space-y-1 leading-snug">
                <FormLabel className="font-normal">Recordatorios de eventos</FormLabel>
                <FormDescription>Avisos previos a los eventos para los que tengas entradas.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptsMarketing"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} />
              </FormControl>
              <div className="space-y-1 leading-snug">
                <FormLabel className="font-normal">Novedades y promociones</FormLabel>
                <FormDescription>Recibe ofertas y novedades por correo.</FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar preferencias'}
        </Button>
      </form>
    </Form>
  );
}
