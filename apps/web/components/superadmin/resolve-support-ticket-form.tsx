'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  resolveSupportTicketSchema,
  type ResolveSupportTicketDto,
  type SupportTicketResponse,
} from '@urnight/contracts';
import {
  Badge,
  Button,
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@urnight/ui';
import { resolveSupportTicket } from '@/lib/api/ops';
import { useApiMutation } from '@/lib/api/use-api-mutation';
import { formatDate, isUuid } from '@/lib/utils';

const STATUSES = ['in_progress', 'resolved', 'closed'] as const;
// Tipado abierto: `ticket.status` viene del backend y puede traer estados fuera
// de STATUSES (p. ej. 'open'); el `?? ticket.status` cubre el fallback honesto.
const STATUS_LABELS: Record<string, string> = {
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

/**
 * Actualiza el estado de un ticket de soporte (POST /support-tickets/:id/status).
 * Como no existe un listado de tickets, se opera por ID. Un Dialog confirma el
 * cambio con el schema `resolveSupportTicketSchema`.
 */
export function ResolveSupportTicketForm() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [ticketId, setTicketId] = useState('');
  const [ticketIdError, setTicketIdError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [updated, setUpdated] = useState<SupportTicketResponse | null>(null);

  const form = useForm<ResolveSupportTicketDto>({
    resolver: zodResolver(resolveSupportTicketSchema),
    defaultValues: { status: 'in_progress' },
  });

  const mutation = useApiMutation({
    mutationFn: (values: ResolveSupportTicketDto) =>
      resolveSupportTicket(ticketId.trim(), values, token),
    setError: form.setError,
    successMessage: (ticket) =>
      `Ticket ${ticket.ticketCode} → ${STATUS_LABELS[ticket.status] ?? ticket.status}.`,
    onSuccess: (ticket) => {
      setUpdated(ticket);
      setOpen(false);
    },
  });

  function onOpenDialog() {
    const id = ticketId.trim();
    if (!isUuid(id)) {
      setTicketIdError('Ingresa un UUID de ticket válido.');
      return;
    }
    setTicketIdError(null);
    setOpen(true);
  }

  function onConfirm(values: ResolveSupportTicketDto) {
    mutation.mutate(values);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ticket-id">ID del ticket</Label>
        <div className="flex gap-2">
          <Input
            id="ticket-id"
            placeholder="UUID del ticket"
            value={ticketId}
            onChange={(event) => {
              setTicketId(event.target.value);
              if (ticketIdError) setTicketIdError(null);
            }}
          />
          <Button type="button" onClick={onOpenDialog}>
            Actualizar estado
          </Button>
        </div>
        {ticketIdError ? <p className="text-sm text-destructive">{ticketIdError}</p> : null}
      </div>

      {updated ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
          <span className="font-medium">{updated.ticketCode}</span>
          <Badge variant="secondary">
            {STATUS_LABELS[updated.status] ?? updated.status}
          </Badge>
          <span className="text-muted-foreground">{updated.subject}</span>
          <span className="ml-auto text-muted-foreground">{formatDate(updated.createdAt)}</span>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar estado del ticket</DialogTitle>
            <DialogDescription>
              Aplica un nuevo estado al ticket <code>{ticketId.trim()}</code>.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onConfirm)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuevo estado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={mutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Aplicando…' : 'Aplicar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
