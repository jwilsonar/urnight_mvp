'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  createPromoCodeSchema,
  PROMO_SCOPES,
  type CreatePromoCodeDto,
  type PromoCodeResponse,
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
import { createPromoCode } from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

const DISCOUNT_TYPE_LABELS: Record<CreatePromoCodeDto['discountType'], string> = {
  percentage: 'Porcentaje (%)',
  fixed_amount: 'Monto fijo (S/)',
};

const SCOPE_LABELS: Record<(typeof PROMO_SCOPES)[number], string> = {
  global: 'Global',
  event: 'Evento',
  local: 'Local',
  zone: 'Zona',
  promoter: 'Promotor',
  ticket_type: 'Tipo de entrada',
};

interface PromoCodeFormProps {
  /** Si se conoce, prellena el `promoterId` y sugiere scope `promoter`. */
  promoterId?: string;
  /** Se invoca con el código creado. */
  onCreated?: (code: PromoCodeResponse) => void;
}

/** Formulario para crear un código promocional (POST /promo-codes). */
export function PromoCodeForm({ promoterId, onCreated }: PromoCodeFormProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const form = useForm<z.input<typeof createPromoCodeSchema>, unknown, CreatePromoCodeDto>({
    resolver: zodResolver(createPromoCodeSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
      discountValue: undefined,
      usageQuota: undefined,
      scope: promoterId ? 'promoter' : 'global',
      promoterId: promoterId ?? undefined,
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: CreatePromoCodeDto) => createPromoCode(values, token),
    setError: form.setError,
    successMessage: (code) => `Código "${code.code}" creado.`,
    invalidateKeys: promoterId ? [queryKeys.promoterSales(promoterId)] : [],
    onSuccess: (code) => {
      onCreated?.(code);
      form.reset({
        code: '',
        discountType: 'percentage',
        discountValue: undefined,
        usageQuota: undefined,
        scope: promoterId ? 'promoter' : 'global',
        promoterId: promoterId ?? undefined,
      });
    },
  });

  function onSubmit(values: CreatePromoCodeDto) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input
                  placeholder="VERANO2026"
                  className="font-mono uppercase"
                  {...field}
                  onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                />
              </FormControl>
              <FormDescription>Entre 3 y 40 caracteres. Se guardará en mayúsculas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="discountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de descuento</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(DISCOUNT_TYPE_LABELS) as CreatePromoCodeDto['discountType'][]).map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {DISCOUNT_TYPE_LABELS[type]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor del descuento</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="10"
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === '' ? undefined : event.target.valueAsNumber,
                      )
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="usageQuota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cupo de usos <span className="text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step="1"
                    placeholder="Sin límite"
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === '' ? undefined : event.target.valueAsNumber,
                      )
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
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alcance</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Alcance" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROMO_SCOPES.map((scope) => (
                      <SelectItem key={scope} value={scope}>
                        {SCOPE_LABELS[scope]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {promoterId ? (
          <p className="text-sm text-muted-foreground">
            Vinculado a tu promotor{' '}
            <span className="font-mono text-foreground">{promoterId}</span>.
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando…' : 'Crear código'}
        </Button>
      </form>
    </Form>
  );
}
