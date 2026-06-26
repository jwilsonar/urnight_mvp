'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import {
  upsertPlatformSettingSchema,
  type PlatformSettingResponse,
  type UpsertPlatformSettingDto,
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
  Textarea,
} from '@urnight/ui';
import { ApiError } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/error-messages';
import { getPlatformSetting, upsertPlatformSetting } from '@/lib/api/ops';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { formatDate } from '@/lib/utils';

const VALUE_TYPES = ['string', 'number', 'boolean', 'json'] as const;

const VALUE_TYPE_LABELS: Record<(typeof VALUE_TYPES)[number], string> = {
  string: 'Texto',
  number: 'Número',
  boolean: 'Booleano',
  json: 'JSON',
};

/**
 * Editor de ajustes de plataforma. Permite leer un ajuste por clave
 * (GET /platform-settings/:key) y crear/actualizar (PUT /platform-settings).
 */
export function PlatformSettingEditor() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [lastSaved, setLastSaved] = useState<PlatformSettingResponse | null>(null);

  const form = useForm<z.input<typeof upsertPlatformSettingSchema>, unknown, UpsertPlatformSettingDto>({
    resolver: zodResolver(upsertPlatformSettingSchema),
    defaultValues: {
      key: '',
      value: '',
      valueType: 'string',
    },
  });

  const loadMutation = useMutation({
    mutationFn: (key: string) => getPlatformSetting(key, token),
    onSuccess: (setting) => {
      form.reset({
        key: setting.key,
        value: setting.value,
        valueType: setting.valueType,
      });
      setLastSaved(setting);
      toast.success(`Ajuste "${setting.key}" cargado.`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 404) {
        toast.info('No existe un ajuste con esa clave. Puedes crearlo abajo.');
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });

  const saveMutation = useApiMutation({
    mutationFn: (values: UpsertPlatformSettingDto) => upsertPlatformSetting(values, token),
    setError: form.setError,
    successMessage: (setting) => `Ajuste "${setting.key}" guardado.`,
    onSuccess: (setting) => setLastSaved(setting),
  });

  function onLoad() {
    const key = form.getValues('key')?.trim();
    if (!key || key.length < 2) {
      form.setError('key', { message: 'Ingresa una clave de al menos 2 caracteres para leer.' });
      return;
    }
    loadMutation.mutate(key);
  }

  function onSubmit(values: UpsertPlatformSettingDto) {
    saveMutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clave</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="p.ej. checkout.fee_percent" {...field} />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onLoad}
                    disabled={loadMutation.isPending}
                  >
                    <MagnifyingGlass className="mr-2 h-4 w-4" />
                    {loadMutation.isPending ? 'Leyendo…' : 'Leer'}
                  </Button>
                </div>
                <FormDescription>
                  Lee un ajuste existente o escribe una clave nueva para crearlo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valueType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de valor</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VALUE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {VALUE_TYPE_LABELS[type]}
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
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Valor del ajuste (texto serializado)"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  El valor se almacena como texto; el tipo solo indica cómo interpretarlo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Guardando…' : 'Guardar ajuste'}
          </Button>
        </form>
      </Form>

      {lastSaved ? (
        <p className="text-sm text-muted-foreground">
          Última versión de <span className="font-medium text-foreground">{lastSaved.key}</span>{' '}
          actualizada el {formatDate(lastSaved.updatedAt)}.
        </p>
      ) : null}
    </div>
  );
}
