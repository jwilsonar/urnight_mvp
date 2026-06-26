'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import {
  LEGAL_DOC_TYPES,
  publishLegalDocumentSchema,
  type PublishLegalDocumentDto,
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
import { publishLegalDocument } from '@/lib/api/ops';
import { useApiMutation } from '@/lib/api/use-api-mutation';

export const LEGAL_DOC_TYPE_LABELS: Record<(typeof LEGAL_DOC_TYPES)[number], string> = {
  terms: 'Términos y condiciones',
  privacy: 'Política de privacidad',
  refund_policy: 'Política de reembolsos',
};

/**
 * Publica una nueva versión de documento legal (POST /legal-documents). La nueva
 * versión pasa a ser la vigente. Refresca la ruta para reflejar el documento
 * actual renderizado por el Server Component.
 */
export function PublishLegalDocumentForm({ onCreated }: { onCreated?: () => void } = {}) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const form = useForm<PublishLegalDocumentDto>({
    resolver: zodResolver(publishLegalDocumentSchema),
    defaultValues: {
      docType: 'terms',
      version: '',
      contentUrl: '',
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: PublishLegalDocumentDto) => publishLegalDocument(values, token),
    setError: form.setError,
    successMessage: (doc) =>
      `${LEGAL_DOC_TYPE_LABELS[doc.docType]} v${doc.version} publicado como vigente.`,
    onSuccess: (doc) => {
      form.reset({ docType: doc.docType, version: '', contentUrl: '' });
      router.refresh();
      onCreated?.();
    },
  });

  function onSubmit(values: PublishLegalDocumentDto) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="docType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de documento</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LEGAL_DOC_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LEGAL_DOC_TYPE_LABELS[type]}
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
          name="version"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Versión</FormLabel>
              <FormControl>
                <Input placeholder="p.ej. 1.0 o 1.2.3" {...field} />
              </FormControl>
              <FormDescription>Versión semántica (mayor.menor[.parche]).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contentUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del contenido</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://…/terminos-v1.html"
                  {...field}
                />
              </FormControl>
              <FormDescription>Enlace público al documento publicado.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Publicando…' : 'Publicar versión'}
        </Button>
      </form>
    </Form>
  );
}
