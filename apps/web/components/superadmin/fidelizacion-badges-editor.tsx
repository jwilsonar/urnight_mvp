'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PencilSimple, Plus } from '@phosphor-icons/react';
import { m } from 'framer-motion';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@urnight/ui';
import { INITIAL_BADGES, type LoyaltyBadgeConfig } from './fidelizacion-config';

const badgeSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa al menos 2 caracteres.').max(80),
  icon: z.string().trim().min(1, 'Ingresa un icono.').max(12, 'Usa un icono breve.'),
  criterion: z.string().trim().min(8, 'Describe el criterio con al menos 8 caracteres.').max(240),
});

type BadgeFormValues = z.infer<typeof badgeSchema>;

const EMPTY_BADGE: BadgeFormValues = { name: '', icon: '', criterion: '' };

export function FidelizacionBadgesEditor() {
  const [badges, setBadges] = useState<LoyaltyBadgeConfig[]>(() => INITIAL_BADGES.map((badge) => ({ ...badge })));
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeSchema),
    defaultValues: EMPTY_BADGE,
  });

  function openCreate() {
    setEditingId(null);
    form.reset(EMPTY_BADGE);
    setOpen(true);
  }

  function openEdit(badge: LoyaltyBadgeConfig) {
    setEditingId(badge.id);
    form.reset({
      name: badge.name,
      icon: badge.icon,
      criterion: badge.criterion,
    });
    setOpen(true);
  }

  function onSubmit(values: BadgeFormValues) {
    if (editingId) {
      setBadges((current) => current.map((badge) => (badge.id === editingId ? { ...badge, ...values } : badge)));
      toast.success(`Insignia “${values.name}” actualizada.`);
    } else {
      setBadges((current) => [{ id: `badge-${Date.now()}`, ...values }, ...current]);
      toast.success(`Insignia “${values.name}” creada.`);
    }
    setOpen(false);
  }

  return (
    <Card className="p-0">
      <CardHeader className="flex-row items-start justify-between gap-4 p-5 pb-3">
        <div className="space-y-1.5">
          <CardTitle>Catálogo de insignias</CardTitle>
          <CardDescription>Define el nombre, el icono y el criterio que debe cumplir el asistente.</CardDescription>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" weight="bold" />
          Nueva insignia
        </Button>
      </CardHeader>
      <CardContent className="p-5 pt-2">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {badges.map((badge, index) => (
            <m.article
              layout
              key={badge.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.18,
                delay: Math.min(index * 0.02, 0.12),
              }}
              className="flex min-h-36 flex-col rounded-md border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-2xl" aria-hidden>
                  {badge.icon}
                </span>
                <Badge variant="outline">Mock</Badge>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{badge.name}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{badge.criterion}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 self-start text-foreground"
                onClick={() => openEdit(badge)}
              >
                <PencilSimple className="h-4 w-4" />
                Editar
              </Button>
            </m.article>
          ))}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar insignia' : 'Crear insignia'}</DialogTitle>
            <DialogDescription>
              Esta configuración se conserva en el estado mock durante la sesión actual.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Explorador nocturno" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono</FormLabel>
                      <FormControl>
                        <Input placeholder="🌙" aria-label="Icono de la insignia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="criterion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criterio de obtención</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Ej.: completar 5 check-ins en locales distintos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" className="text-foreground" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingId ? 'Guardar cambios' : 'Crear insignia'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
