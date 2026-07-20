'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@urnight/ui';
import { updatePreferences } from '@/lib/api/identity';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

const STORAGE_KEY = 'ravenue:notification-preferences';

type NotificationType = 'reminders' | 'eventUpdates' | 'promotions' | 'social';

interface NotificationSettings {
  channel: 'email' | 'push';
  scope: 'all' | 'favorites';
  types: Record<NotificationType, boolean>;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  channel: 'push',
  scope: 'favorites',
  types: {
    reminders: true,
    eventUpdates: true,
    promotions: false,
    social: true,
  },
};

const TYPE_OPTIONS: {
  key: NotificationType;
  label: string;
  description: string;
}[] = [
  {
    key: 'reminders',
    label: 'Recordatorios de eventos',
    description: 'Avisos antes de los eventos para los que tienes entradas.',
  },
  {
    key: 'eventUpdates',
    label: 'Cambios y novedades',
    description: 'Horarios, ubicaciones y nuevos eventos según tu alcance.',
  },
  {
    key: 'promotions',
    label: 'Promociones y beneficios',
    description: 'Ofertas, puntos y oportunidades de canje.',
  },
  {
    key: 'social',
    label: 'Invitaciones y amigos',
    description: 'Actividad de grupos, pases e invitaciones.',
  },
];

export function PreferencesForm() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<NotificationSettings>;
      setSettings({
        channel: parsed.channel === 'email' ? 'email' : 'push',
        scope: parsed.scope === 'all' ? 'all' : 'favorites',
        types: { ...DEFAULT_SETTINGS.types, ...parsed.types },
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const mutation = useApiMutation({
    mutationFn: () =>
      updatePreferences(
        {
          acceptsMarketing: settings.types.promotions,
          acceptsReminders: settings.types.reminders,
        },
        token,
      ),
    successMessage: 'Preferencias de notificaciones actualizadas.',
    invalidateKeys: [queryKeys.me],
  });

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    mutation.mutate(undefined);
  }

  function setType(key: NotificationType, checked: boolean) {
    setSettings((current) => ({
      ...current,
      types: { ...current.types, [key]: checked },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="notification-channel">Canal principal</Label>
          <Select
            value={settings.channel}
            onValueChange={(value) =>
              setSettings((current) => ({
                ...current,
                channel: value as NotificationSettings['channel'],
              }))
            }
          >
            <SelectTrigger id="notification-channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Correo</SelectItem>
              <SelectItem value="push">Mensaje / push</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notification-scope">Alcance</Label>
          <Select
            value={settings.scope}
            onValueChange={(value) =>
              setSettings((current) => ({
                ...current,
                scope: value as NotificationSettings['scope'],
              }))
            }
          >
            <SelectTrigger id="notification-scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cada evento</SelectItem>
              <SelectItem value="favorites">Solo favoritos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Tipos de aviso</legend>
        {TYPE_OPTIONS.map((option) => (
          <label
            key={option.key}
            htmlFor={`notification-${option.key}`}
            className="flex cursor-pointer items-start gap-3 rounded-md border bg-white/[0.02] p-3.5"
          >
            <Checkbox
              id={`notification-${option.key}`}
              checked={settings.types[option.key]}
              onCheckedChange={(checked) => setType(option.key, checked === true)}
            />
            <span className="space-y-1 leading-snug">
              <span className="block text-sm font-medium text-foreground">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <Button type="button" onClick={save} disabled={!token || mutation.isPending}>
        {mutation.isPending ? 'Guardando…' : 'Guardar preferencias'}
      </Button>
    </div>
  );
}
