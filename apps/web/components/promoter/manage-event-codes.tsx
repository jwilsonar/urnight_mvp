'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Plus, QrCode, ShareNetwork } from '@phosphor-icons/react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type {
  AssignmentItemResponse,
  RedemptionCodeResponse,
  RedemptionCodeStatus,
} from '@urnight/contracts';
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@urnight/ui';
import { DataTable } from '@/components/panels/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import {
  generateRedemptionCode,
  listMyAssignments,
  listMyRedemptionCodes,
} from '@/lib/api/promoters';
import { queryKeys } from '@/lib/api/query-keys';
import { useApiMutation } from '@/lib/api/use-api-mutation';

const STATUS_BADGE: Record<RedemptionCodeStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'Activo', variant: 'default' },
  redeemed: { label: 'Canjeado', variant: 'secondary' },
  revoked: { label: 'Revocado', variant: 'destructive' },
  expired: { label: 'Expirado', variant: 'outline' },
};

function formatCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

/** Gestión de los códigos de canje generados para un evento asignado (#13). */
export function ManageRedemptionCodes({ promoterEventId }: { promoterEventId: string }) {
  const { data: session, status } = useSession();
  const token = session?.accessToken;
  const enabled = status === 'authenticated' && Boolean(token);
  const [genOpen, setGenOpen] = useState(false);
  const [ticketTypeId, setTicketTypeId] = useState<string>('');

  const assignmentsQuery = useQuery({
    queryKey: queryKeys.myAssignments,
    queryFn: () => listMyAssignments(token),
    enabled,
  });
  const assignment = (assignmentsQuery.data ?? []).find((a) => a.id === promoterEventId);

  const codesQuery = useQuery({
    queryKey: queryKeys.redemptionCodes(promoterEventId),
    queryFn: () => listMyRedemptionCodes(promoterEventId, token),
    enabled,
  });

  const generate = useApiMutation({
    mutationFn: () => generateRedemptionCode({ promoterEventId, ticketTypeId }, token),
    successMessage: 'Código de canje generado.',
    invalidateKeys: [queryKeys.redemptionCodes(promoterEventId), queryKeys.myAssignments],
    onSuccess: () => {
      setGenOpen(false);
      setTicketTypeId('');
    },
  });

  async function share(code: RedemptionCodeResponse) {
    try {
      await navigator.clipboard.writeText(code.shareUrl);
      toast.success('Enlace copiado al portapapeles.');
    } catch {
      toast.error('No se pudo copiar. Enlace: ' + code.shareUrl);
    }
  }

  const columns: ColumnDef<RedemptionCodeResponse>[] = [
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => <span className="font-mono font-medium">{formatCode(row.original.code)}</span>,
    },
    {
      accessorKey: 'ticketTypeName',
      header: 'Tipo de entrada',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.ticketTypeName ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      filterFn: 'equalsString',
      cell: ({ row }) => {
        const s = STATUS_BADGE[row.original.status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      accessorKey: 'clicks',
      header: 'Clics',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.clicks}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            size="sm"
            variant="outline"
            disabled={row.original.status !== 'active'}
            onClick={() => share(row.original)}
          >
            <ShareNetwork className="h-4 w-4" /> Compartir
          </Button>
        </div>
      ),
    },
  ];

  const ticketOptions: AssignmentItemResponse[] = assignment?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 text-muted-foreground">
            <Link href="/panel/promoter">
              <ArrowLeft className="h-4 w-4" /> Mis eventos
            </Link>
          </Button>
          <h1 className="truncate font-heading text-2xl font-bold">
            {assignment ? assignment.event.name : 'Gestionar códigos de canje'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Genera y comparte códigos de canje de entrada gratis para este evento.
          </p>
        </div>
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <Button onClick={() => setGenOpen(true)}>
            <Plus className="h-4 w-4" weight="bold" /> Generar código de canje
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generar código de canje</DialogTitle>
              <DialogDescription>
                Elige el tipo de entrada. Cada código de canje sirve para una entrada gratis y
                descuenta 1 de tu cupo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Tipo de entrada</Label>
              <Select value={ticketTypeId} onValueChange={setTicketTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ticketOptions.map((it) => (
                    <SelectItem key={it.ticketTypeId} value={it.ticketTypeId} disabled={it.remaining <= 0}>
                      {it.ticketTypeName} — cupo restante: {it.remaining}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenOpen(false)} disabled={generate.isPending}>
                Cancelar
              </Button>
              <Button
                disabled={generate.isPending || !ticketTypeId}
                onClick={() => {
                  if (!ticketTypeId) {
                    toast.error('Selecciona un tipo de entrada.');
                    return;
                  }
                  generate.mutate(undefined);
                }}
              >
                {generate.isPending ? 'Generando…' : 'Generar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Códigos de canje</CardTitle>
          <CardDescription>
            Comparte el enlace de un código de canje activo: lleva al checkout con la entrada gratis
            aplicada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={codesQuery.data ?? []}
            isLoading={codesQuery.isPending}
            isError={codesQuery.isError}
            onRetry={() => codesQuery.refetch()}
            searchColumn="code"
            searchPlaceholder="Buscar código…"
            emptyState={
              <EmptyState
                icon={<QrCode weight="duotone" />}
                title="Aún no generaste códigos de canje"
                description="Genera el primero para compartirlo con tu audiencia."
                action={<Button onClick={() => setGenOpen(true)}>Generar código de canje</Button>}
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
