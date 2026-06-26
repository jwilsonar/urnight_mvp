'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  reviewVerificationSchema,
  type ReviewVerificationDto,
  type VerificationResponse,
} from '@urnight/contracts';
import {
  Badge,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@urnight/ui';
import { reviewLocalVerification } from '@/lib/api/ops';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { formatDate, isUuid } from '@/lib/utils';

const DECISIONS = ['approved', 'observed', 'expired'] as const;
const DECISION_LABELS: Record<(typeof DECISIONS)[number], string> = {
  approved: 'Aprobar',
  observed: 'Observar',
  expired: 'Expirar',
};

const STATUS_LABELS: Record<VerificationResponse['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  observed: 'Observada',
  expired: 'Expirada',
};

const STATUS_VARIANTS: Record<
  VerificationResponse['status'],
  'secondary' | 'success' | 'destructive'
> = {
  pending: 'secondary',
  approved: 'success',
  observed: 'destructive',
  expired: 'destructive',
};

/**
 * Revisa una verificación de local por ID (POST /local-verifications/:id/review).
 * No existe listado de verificaciones, así que se opera por ID.
 */
export function ReviewVerificationForm() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [verificationId, setVerificationId] = useState('');
  const [idError, setIdError] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<VerificationResponse | null>(null);

  const form = useForm<z.input<typeof reviewVerificationSchema>, unknown, ReviewVerificationDto>({
    resolver: zodResolver(reviewVerificationSchema),
    defaultValues: {
      decision: 'approved',
      notes: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: ReviewVerificationDto) =>
      reviewLocalVerification(verificationId.trim(), values, token),
    setError: form.setError,
    successMessage: (verification) => `Verificación → ${STATUS_LABELS[verification.status]}.`,
    onSuccess: (verification) => {
      setReviewed(verification);
      form.reset({ decision: 'approved', notes: '' });
    },
  });

  function onSubmit(values: ReviewVerificationDto) {
    const id = verificationId.trim();
    if (!isUuid(id)) {
      setIdError('Ingresa un UUID de verificación válido.');
      return;
    }
    setIdError(null);
    const payload: ReviewVerificationDto = {
      ...values,
      notes: values.notes?.trim() ? values.notes : undefined,
    };
    mutation.mutate(payload);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verification-id">ID de la verificación</Label>
        <Input
          id="verification-id"
          placeholder="UUID de la verificación de local"
          value={verificationId}
          onChange={(event) => {
            setVerificationId(event.target.value);
            if (idError) setIdError(null);
          }}
        />
        {idError ? <p className="text-sm text-destructive">{idError}</p> : null}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="decision"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Decisión</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Decisión" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DECISIONS.map((decision) => (
                      <SelectItem key={decision} value={decision}>
                        {DECISION_LABELS[decision]}
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
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Notas <span className="text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Motivo u observaciones de la revisión"
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

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Aplicando…' : 'Aplicar revisión'}
          </Button>
        </form>
      </Form>

      {reviewed ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
          <Badge variant={STATUS_VARIANTS[reviewed.status]}>
            {STATUS_LABELS[reviewed.status]}
          </Badge>
          <span className="text-muted-foreground">Local {reviewed.localId}</span>
          <span className="ml-auto text-muted-foreground">{formatDate(reviewed.createdAt)}</span>
        </div>
      ) : null}
    </div>
  );
}
