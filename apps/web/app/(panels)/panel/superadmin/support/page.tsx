import { Info } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@urnight/ui';
import { CreateSupportTicketDialog } from '@/components/superadmin/create-support-ticket-dialog';
import { ResolveSupportTicketForm } from '@/components/superadmin/resolve-support-ticket-form';

export const metadata: Metadata = { title: 'Soporte interno' };

export default function SuperAdminSupportPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold">Soporte interno</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el estado de los tickets de soporte. La plataforma no expone un listado de tickets, por lo que se
            opera por ID.
          </p>
        </header>
        <CreateSupportTicketDialog />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-0">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Actualizar estado de un ticket</CardTitle>
            <CardDescription>Marca un ticket como en progreso, resuelto o cerrado por su ID.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <ResolveSupportTicketForm />
          </CardContent>
        </Card>

        <Alert className="lg:sticky lg:top-20">
          <Info className="h-4 w-4" />
          <AlertTitle>Apertura reservada a administrador de local</AlertTitle>
          <AlertDescription>
            La apertura de tickets está reservada al rol <code>admin_local</code>. Una cuenta de super administrador sin
            ese rol recibirá un error de permisos.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
