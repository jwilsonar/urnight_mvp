'use client';

import { Plus } from '@phosphor-icons/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
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
  Label,
  Textarea,
} from '@urnight/ui';
import { StagedImageField } from '@/components/shared/staged-image-field';
import { createLocal } from '@/lib/api/admin';
import { ApiError } from '@/lib/api/client';
import { confirmLocalImage } from '@/lib/api/local-images';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { useStagedUpload } from '@/lib/hooks/use-staged-upload';
import { readImageSize } from '@/lib/utils/image';
import { slugify } from './slugify';

function blankToUndefined(value: string | undefined): string | undefined {
  return value && value.trim() ? value : undefined;
}

/**
 * Ni companyId, ni slug, ni mainImageUrl se piden al usuario:
 * - companyId se inyecta desde la empresa (tenant) del actor.
 * - slug se deriva del nombre (slugify) y se garantiza único: si el backend
 *   responde LOCAL_SLUG_TAKEN, se reintenta con un sufijo corto.
 * - la portada se arrastra al dropzone (staging) y se confirma en la galería
 *   tras crear el local (mismo endpoint que usa el gestor de imágenes).
 */
const formSchema = createLocalSchema.omit({ companyId: true, slug: true, mainImageUrl: true });
type LocalFormValues = z.input<typeof formSchema>;
/** Local sin slug: el slug lo genera `createLocalUniqueSlug`. */
type LocalDraft = Omit<CreateLocalDto, 'slug'>;

const EMPTY: LocalFormValues = {
  name: '',
  description: '',
  address: '',
  googleMapsUrl: '',
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
  const queryClient = useQueryClient();
  // Portada con drag-and-drop: se sube a staging al soltarla y se confirma
  // como imagen principal de la galería tras crear el local.
  const cover = useStagedUpload('local');

  const form = useForm<LocalFormValues, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
  });

  const mutation = useApiMutation({
    mutationFn: async (draft: LocalDraft) => {
      const local = await createLocalUniqueSlug(draft, token);
      // La portada no bloquea el alta: si el confirm falla, el local ya es
      // válido y la imagen puede subirse después desde su galería.
      if (cover.stagedKey) {
        try {
          const size = cover.file ? await readImageSize(cover.file) : null;
          await confirmLocalImage(
            local.id,
            { key: cover.stagedKey, isMain: true, ...(size ?? {}) },
            token,
          );
        } catch {
          toast.warning('Local creado, pero la portada no se pudo adjuntar. Súbela desde su galería.');
        }
      }
      return local;
    },
    setError: form.setError,
    successMessage: (local) => `Local "${local.name}" creado.`,
    invalidateKeys: [queryKeys.myLocals],
    onSuccess: (local) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.localImages(local.id) });
      setOpen(false);
      cover.reset();
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
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) cover.reset();
      }}
    >
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

            <div className="space-y-2">
              <Label>
                Imagen principal <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <StagedImageField upload={cover} disabled={mutation.isPending} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !companyId || cover.status === 'uploading'}
              >
                {mutation.isPending ? 'Creando…' : 'Crear local'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
