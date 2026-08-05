'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm, type Resolver } from 'react-hook-form';
import { createZoneSchema, type CreateZoneDto } from '@urnight/contracts';
import { Badge, Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input } from '@urnight/ui';
import { createMusicGenre, createTag, createZone, getMusicGenres, getTags, getZones } from '@/lib/api/catalog';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

type TaxonomyKind = 'zones' | 'musicGenres' | 'tags';

interface TaxonomyManagerProps {
  title: string;
  kind: TaxonomyKind;
}

const TAXONOMY_CONFIG = {
  zones: { queryKey: queryKeys.zones, list: getZones, create: createZone },
  musicGenres: { queryKey: queryKeys.musicGenres, list: getMusicGenres, create: createMusicGenre },
  tags: { queryKey: queryKeys.tags, list: getTags, create: createTag },
} satisfies Record<TaxonomyKind, object>;

const EMPTY: CreateZoneDto = { name: '', slug: '', displayOrder: 0, isActive: true };

/** Lista + alta de un recurso de taxonomía (zonas/géneros/etiquetas, #6/7/8). */
export function TaxonomyManager({ title, kind }: TaxonomyManagerProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const config = TAXONOMY_CONFIG[kind];

  const { data: items, isPending, isError, refetch } = useQuery({ queryKey: config.queryKey, queryFn: config.list });

  const form = useForm<CreateZoneDto>({
    // createZoneSchema tiene defaults → input ≠ output; el form usa el tipo de salida.
    resolver: zodResolver(createZoneSchema) as Resolver<CreateZoneDto>,
    defaultValues: EMPTY,
  });

  const mutation = useApiMutation({
    mutationFn: (values: CreateZoneDto) => config.create(values, token),
    setError: form.setError,
    successMessage: `${title}: elemento creado.`,
    invalidateKeys: [config.queryKey],
    onSuccess: () => form.reset(EMPTY),
  });

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-muted-foreground">No pudimos cargar {title.toLowerCase()}.</p>
          <Button type="button" variant="outline" size="sm" className="text-foreground" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="flex min-h-6 flex-wrap gap-2" aria-busy={isPending}>
          {isPending ? (
            <span className="text-sm text-muted-foreground">Cargando…</span>
          ) : (
            items?.map((item) => (
              <Badge key={item.id} variant="secondary">
                {item.name}
              </Badge>
            ))
          )}
          {!isPending && items?.length === 0 ? (
            <span className="text-sm text-muted-foreground">Sin elementos.</span>
          ) : null}
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-wrap items-end gap-3"
          noValidate
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} className="w-44" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} className="w-44" placeholder="kebab-case" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={mutation.isPending}>
            Agregar
          </Button>
        </form>
      </Form>
    </div>
  );
}
