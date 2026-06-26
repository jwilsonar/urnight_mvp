'use client';

import { Plus } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { COMPANIES_ERROR_CODES, createLocalSchema, type CreateLocalDto } from '@urnight/contracts';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createLocal } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { queryKeys } from '@/lib/api/query-keys';
import { slugify } from './slugify';

function blankToUndefined(value: string | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

/**
 * Ni companyId ni slug se piden al usuario:
 * - companyId se inyecta desde la empresa (tenant) del actor.
 * - slug se deriva del nombre (slugify) y se garantiza único: si el backend
 *   responde LOCAL_SLUG_TAKEN, se reintenta con un sufijo corto.
 */
const formSchema = createLocalSchema.omit({ companyId: true, slug: true });
type LocalFormValues = z.input<typeof formSchema>;
/** Local sin slug: el slug lo genera `createLocalUniqueSlug`. */
type LocalDraft = Omit<CreateLocalDto, 'slug'>;

const EMPTY: LocalFormValues = {
  name: '',
  description: '',
  address: '',
  googleMapsUrl: '',
  mainImageUrl: '',
};

const SLUG_MAX_ATTEMPTS = 6;

/** Sufijo aleatorio corto (kebab-safe) para desambiguar slugs en colisión. */
function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

/**
 * Crea el local generando un slug único a partir del nombre. Primer intento con
 * el slug "limpio" (`mi-local`); ante colisión (LOCAL_SLUG_TAKEN) reintenta con
 * `mi-local-xxxx`. Cualquier otro error se propaga sin tocar.
 */
async function createLocalUniqueSlug(draft: LocalDraft, token: string) {
  const base = slugify(draft.name);
  const root = base.length >= 2 ? base : 'local';
  for (let attempt = 0; attempt < SLUG_MAX_ATTEMPTS; attempt++) {
    const slug = attempt === 0 ? root : `${root}-${randomSuffix()}`.slice(0, 180);
    try {
      return await createLocal({ ...draft, slug }, token);
    } catch (err) {
      const slugTaken = err instanceof ApiError && err.code === COMPANIES_ERROR_CODES.LOCAL_SLUG_TAKEN;
      if (slugTaken && attempt < SLUG_MAX_ATTEMPTS - 1) continue;
      throw err;
    }
  }
  // Inalcanzable: el bucle retorna en éxito o lanza en el último intento.
  throw new Error('No se pudo generar un slug único para el local.');
}

/** Crear local vía modal. Invalida la lista de locales al guardar. */
export function CreateLocalDialog() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  // Empresa del actor (claims del token): el local se crea SIEMPRE en su tenant.
  const companyId = session?.user?.companyId ?? '';
  const [open, setOpen] = useState(false);

  const form = useForm<LocalFormValues, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
  });

  const mutation = useApiMutation({
    mutationFn: (draft: LocalDraft) => createLocalUniqueSlug(draft, token),
    setError: form.setError,
    successMessage: (local) => `Local "${local.name}" creado.`,
    invalidateKeys: [queryKeys.myLocals],
    onSuccess: () => {
      setOpen(false);
      form.reset(EMPTY);
    },
  });

  // Vista previa en vivo del slug que se generará a partir del nombre.
  const slugPreview = slugify(form.watch('name') ?? '');

  function onSubmit(values: z.output<typeof formSchema>) {
    if (!companyId) {
      toast.error('No se encontró la empresa asociada a tu cuenta.');
      return;
    }
    mutation.mutate({
      companyId,
      ...values,
      description: blankToUndefined(values.description ?? undefined),
      address: blankToUndefined(values.address ?? undefined),
      googleMapsUrl: blankToUndefined(values.googleMapsUrl ?? undefined),
      mainImageUrl: blankToUndefined(values.mainImageUrl ?? undefined),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" weight="bold" />
          Crear local
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear local</DialogTitle>
          <DialogDescription>Registra un nuevo local de tu empresa.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del local" {...field} />
                  </FormControl>
                  <FormDescription>
                    {slugPreview
                      ? `Enlace (slug): ${slugPreview} — se genera automáticamente.`
                      : 'El enlace (slug) se genera automáticamente desde el nombre.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Descripción <span className="text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Sobre tu local…" rows={3} {...field} value={field.value ?? ''} />
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
                    <Input placeholder="Av. Principal 123" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mainImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Imagen principal (URL) <span className="text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…/imagen.jpg" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || !companyId}>
                {mutation.isPending ? 'Creando…' : 'Crear local'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
