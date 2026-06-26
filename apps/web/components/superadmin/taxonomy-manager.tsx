'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm, type Resolver } from 'react-hook-form';
import { createZoneSchema, type CreateZoneDto, type ZoneResponse } from '@urnight/contracts';
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
} from '@urnight/ui';
import { useApiMutation } from '@/lib/api/use-api-mutation';

interface TaxonomyManagerProps {
  title: string;
  queryKey: QueryKey;
  list: (token?: string) => Promise<ZoneResponse[]>;
  create: (dto: CreateZoneDto, token?: string) => Promise<ZoneResponse>;
}

const EMPTY: CreateZoneDto = { name: '', slug: '', displayOrder: 0, isActive: true };

/** Lista + alta de un recurso de taxonomía (zonas/géneros/etiquetas, #6/7/8). */
export function TaxonomyManager({ title, queryKey, list, create }: TaxonomyManagerProps) {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const { data: items } = useQuery({
    queryKey,
    queryFn: () => list(token),
    enabled: Boolean(token),
  });

  const form = useForm<CreateZoneDto>({
    // createZoneSchema tiene defaults → input ≠ output; el form usa el tipo de salida.
    resolver: zodResolver(createZoneSchema) as Resolver<CreateZoneDto>,
    defaultValues: EMPTY,
  });

  const mutation = useApiMutation({
    mutationFn: (values: CreateZoneDto) => create(values, token),
    setError: form.setError,
    successMessage: `${title}: elemento creado.`,
    invalidateKeys: [queryKey],
    onSuccess: () => form.reset(EMPTY),
  });

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {(items ?? []).map((item) => (
          <Badge key={item.id} variant="secondary">
            {item.name}
          </Badge>
        ))}
        {items && items.length === 0 ? (
          <span className="text-sm text-muted-foreground">Sin elementos.</span>
        ) : null}
      </div>
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
