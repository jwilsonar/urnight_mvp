'use client';

import { Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@urnight/ui';
import { CreateSupportTicketForm } from './create-support-ticket-form';

/** Abre un ticket de soporte vía modal. */
export function CreateSupportTicketDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" weight="bold" />
          Abrir ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Abrir un ticket</DialogTitle>
          <DialogDescription>
            Registra un nuevo ticket de soporte interno. Requiere rol admin_local.
          </DialogDescription>
        </DialogHeader>
        <CreateSupportTicketForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
