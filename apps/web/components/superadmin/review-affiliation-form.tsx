'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  reviewAffiliationSchema,
  type AffiliationResponse,
  type ReviewAffiliationDto,
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
import { reviewAffiliation } from '@/lib/api/companies';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { formatDate, isUuid } from '@/lib/utils';

const STATUS_LABELS: Record<AffiliationResponse['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const STATUS_VARIANTS: Record<AffiliationResponse['status'], 'secondary' | 'success' | 'destructive'> = {
  pending: 'secondary',
  approved: 'success',
  rejected: 'destructive',
};

/**
 * Revisa una solicitud de afiliación por ID (POST /affiliation-requests/:id/review).
 * No existe listado de pendientes, así que se opera por ID directo.
 */
export function ReviewAffiliationForm() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [affiliationId, setAffiliationId] = useState('');
  const [idError, setIdError] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<AffiliationResponse | null>(null);

  const form = useForm<z.input<typeof reviewAffiliationSchema>, unknown, ReviewAffiliationDto>({
    resolver: zodResolver(reviewAffiliationSchema),
    defaultValues: { decision: 'approved', rejectionReason: '' },
  });

  const mutation = useApiMutation({
    mutationFn: (values: ReviewAffiliationDto) =>
      reviewAffiliation(affiliationId.trim(), values, token),
    setError: form.setError,
    successMessage: (affiliation) => `Afiliación → ${STATUS_LABELS[affiliation.status]}.`,
    onSuccess: (affiliation) => {
      setReviewed(affiliation);
      form.reset({ decision: 'approved', rejectionReason: '' });
    },
  });

  function onSubmit(values: ReviewAffiliationDto) {
    const id = affiliationId.trim();
    if (!isUuid(id)) {
      setIdError('Ingresa un UUID de solicitud válido.');
      return;
    }
    setIdError(null);
    mutation.mutate({
      ...values,
      rejectionReason: values.rejectionReason?.trim() ? values.rejectionReason : undefined,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="affiliation-id">ID de la solicitud</Label>
        <Input
          id="affiliation-id"
          placeholder="UUID de la solicitud de afiliación"
          value={affiliationId}
          onChange={(event) => {
            setAffiliationId(event.target.value);
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
                    <SelectItem value="approved">Aprobar (crea empresa + local)</SelectItem>
                    <SelectItem value="rejected">Rechazar</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rejectionReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Motivo de rechazo{' '}
                  <span className="text-muted-foreground">(requerido al rechazar)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Explica por qué se rechaza la solicitud"
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
          <Badge variant={STATUS_VARIANTS[reviewed.status]}>{STATUS_LABELS[reviewed.status]}</Badge>
          <span className="text-muted-foreground">{reviewed.commercialName}</span>
          <span className="ml-auto text-muted-foreground">{formatDate(reviewed.createdAt)}</span>
        </div>
      ) : null}
    </div>
  );
}
