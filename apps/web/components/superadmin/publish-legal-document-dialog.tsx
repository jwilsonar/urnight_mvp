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
import { PublishLegalDocumentForm } from './publish-legal-document-form';

/** Publica una nueva versión de documento legal vía modal. */
export function PublishLegalDocumentDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" weight="bold" />
          Publicar versión
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publicar nueva versión</DialogTitle>
          <DialogDescription>
            La nueva versión reemplaza a la vigente para ese tipo de documento.
          </DialogDescription>
        </DialogHeader>
        <PublishLegalDocumentForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
