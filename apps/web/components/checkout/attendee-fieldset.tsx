'use client';

import { Trash, UserCircle } from '@phosphor-icons/react';
import type { Control } from 'react-hook-form';
import { DOCUMENT_TYPES } from '@urnight/contracts';
import {
  Button,
  Checkbox,
  FormControl,
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
import { DOCUMENT_LABELS, type CheckoutFormInput } from './checkout-form';

interface AttendeeFieldsetProps {
  control: Control<CheckoutFormInput>;
  index: number;
  onRemove?: () => void;
  /**
   * Atajo "Soy yo": solo en el asistente comprador y cuando la cuenta tiene
   * identidad reutilizable. Al activarlo, el padre rellena los campos con los
   * datos del registro y `locked` los bloquea para no re-tipearlos.
   */
  self?: { checked: boolean; onCheckedChange: (value: boolean) => void };
  locked?: boolean;
}

/** Campos de un asistente del checkout (nombre, documento, fecha de nacimiento). */
export function AttendeeFieldset({ control, index, onRemove, self, locked }: AttendeeFieldsetProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Asistente {index + 1}</p>
        {onRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash className="h-4 w-4" /> Quitar
          </Button>
        ) : null}
      </div>

      {self ? (
        <label className="flex cursor-pointer items-center gap-3 rounded-md border bg-muted/40 p-3">
          <Checkbox
            checked={self.checked}
            onCheckedChange={(value) => self.onCheckedChange(value === true)}
          />
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <UserCircle className="h-4 w-4 text-primary" weight="duotone" />
            Soy yo — usar los datos de mi cuenta
          </span>
        </label>
      ) : null}

      <FormField
        control={control}
        name={`attendees.${index}.fullName`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre completo</FormLabel>
            <FormControl>
              <Input placeholder="Nombre y apellido" {...field} disabled={locked} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={control}
          name={`attendees.${index}.documentType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documento</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={locked}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {DOCUMENT_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`attendees.${index}.documentNumber`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input inputMode="numeric" {...field} disabled={locked} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name={`attendees.${index}.birthDate`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha de nacimiento</FormLabel>
            <FormControl>
              <Input type="date" {...field} disabled={locked} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
