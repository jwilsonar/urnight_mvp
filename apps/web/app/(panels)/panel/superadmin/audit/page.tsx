import { ClipboardText } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { listAuditLogs } from '@/lib/api/ops';
import { requireAccessToken } from '@/lib/auth-helpers';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Auditoría y logs' };

export default async function AuditPage() {
  const { token } = await requireAccessToken('/panel/superadmin/audit');
  const logs = await listAuditLogs(token).catch(() => []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">Auditoría y logs</h1>
        <p className="text-sm text-muted-foreground">
          Acciones sensibles (creación, publicación, suspensión, etc.) registradas en AUDIT_LOG.
        </p>
      </header>

      {logs.length === 0 ? (
        <EmptyState
          icon={<ClipboardText weight="duotone" />}
          title="Sin registros todavía"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Actor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell className="font-medium">{log.action}</TableCell>
                <TableCell>
                  {log.entityType}
                  {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ''}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {log.actorUserId ? log.actorUserId.slice(0, 8) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
