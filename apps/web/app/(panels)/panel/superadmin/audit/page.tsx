import type { Metadata } from 'next';
import { AuditTable } from '@/components/superadmin/audit-table';
import { listAuditLogs } from '@/lib/api/ops';
import { requireAccessToken } from '@/lib/auth-helpers';

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

      <AuditTable logs={logs} />
    </div>
  );
}
