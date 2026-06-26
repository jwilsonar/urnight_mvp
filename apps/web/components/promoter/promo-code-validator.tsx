'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  validatePromoCodeSchema,
  type PromoValidationResponse,
  type ValidatePromoCodeDto,
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
  Separator,
} from '@urnight/ui';
import { getErrorMessage } from '@/lib/api/error-messages';
import { validatePromoCode } from '@/lib/api/promoters';
import { formatPEN } from '@/lib/utils';

/** Widget para previsualizar el descuento de un código (POST /promo-codes/validate). */
export function PromoCodeValidator() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const form = useForm<z.input<typeof validatePromoCodeSchema>, unknown, ValidatePromoCodeDto>({
    resolver: zodResolver(validatePromoCodeSchema),
    defaultValues: {
      code: '',
      subtotal: undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ValidatePromoCodeDto) => validatePromoCode(values, token),
    onError: (error) => {
      form.setError('code', { message: getErrorMessage(error) });
    },
  });

  function onSubmit(values: ValidatePromoCodeDto) {
    mutation.mutate(values);
  }

  // Oculta el resultado anterior mientras se valida uno nuevo (evita mostrar un
  // descuento obsoleto durante el re-envío).
  const result: PromoValidationResponse | undefined = mutation.isPending
    ? undefined
    : mutation.data;
  const subtotal = form.getValues('subtotal');

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="VERANO2026" className="font-mono uppercase" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtotal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      placeholder="120.00"
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
                  <FormDescription>Monto de la compra antes del descuento.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" variant="secondary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Validando…' : 'Validar código'}
          </Button>
        </form>
      </Form>

      {result ? (
        <Alert variant={result.valid ? 'default' : 'destructive'}>
          {result.valid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertTitle>{result.valid ? 'Código válido' : 'Código no aplicable'}</AlertTitle>
          <AlertDescription>
            {result.valid ? (
              <div className="space-y-1">
                <p>
                  Descuento:{' '}
                  <span className="font-medium text-foreground">{formatPEN(result.discount)}</span>
                  {result.discountType === 'percentage' ? ' (porcentaje aplicado)' : null}
                </p>
                {typeof subtotal === 'number' && Number.isFinite(subtotal) ? (
                  <>
                    <Separator className="my-1" />
                    <p>
                      Total a pagar:{' '}
                      <span className="font-medium text-foreground">
                        {formatPEN(Math.max(0, subtotal - result.discount))}
                      </span>
                    </p>
                  </>
                ) : null}
              </div>
            ) : (
              (result.reason ?? 'Este código no aplica para esta compra.')
            )}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
