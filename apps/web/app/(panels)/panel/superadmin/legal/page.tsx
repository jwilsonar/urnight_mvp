import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { LEGAL_DOC_TYPES, type LegalDocType, type LegalDocumentResponse } from '@urnight/contracts';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { EmptyState } from '@/components/shared/empty-state';
import { PublishLegalDocumentDialog } from '@/components/superadmin/publish-legal-document-dialog';
import { getSession } from '@/lib/auth-helpers';
import { getCurrentLegalDocument } from '@/lib/api/ops';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Documentos legales' };

const LEGAL_DOC_TYPE_LABELS: Record<LegalDocType, string> = {
  terms: 'Términos y condiciones',
  privacy: 'Política de privacidad',
  refund_policy: 'Política de reembolsos',
};

export default async function SuperAdminLegalPage() {
  const session = await getSession();
  const token = session?.accessToken;

  // `GET /legal-documents/current` devuelve UN documento por `docType` y puede
  // devolver 404 si aún no hay versión publicada: consultamos cada tipo y
  // descartamos los faltantes.
  const settled = await Promise.allSettled(
    LEGAL_DOC_TYPES.map((docType) => getCurrentLegalDocument(docType, token)),
  );
  const current = settled
    .filter(
      (result): result is PromiseFulfilledResult<LegalDocumentResponse> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold">Documentos legales</h1>
          <p className="text-sm text-muted-foreground">
            Consulta los documentos vigentes y publica nuevas versiones.
          </p>
        </header>
        <PublishLegalDocumentDialog />
      </div>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Vigentes</h2>
        {current.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {current.map((doc) => (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {LEGAL_DOC_TYPE_LABELS[doc.docType]}
                    </CardTitle>
                    <Badge variant="secondary">v{doc.version}</Badge>
                  </div>
                  <CardDescription>Publicado el {formatDate(doc.publishedAt)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href={doc.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Ver documento
                    <ArrowSquareOut className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin documentos vigentes"
            description="Aún no hay versiones publicadas. Publica la primera abajo."
          />
        )}
      </section>
    </div>
  );
}
