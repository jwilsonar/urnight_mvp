import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_DOC_TYPES, type LegalDocType, type LegalDocumentResponse } from '@urnight/contracts';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@urnight/ui';
import { PublishLegalDocumentDialog } from '@/components/superadmin/publish-legal-document-dialog';
import { getSession } from '@/lib/auth-helpers';
import { getCurrentLegalDocument } from '@/lib/api/ops';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Documentos legales' };

interface LegalDocumentDefinition {
  slug: string;
  title: string;
  docType?: LegalDocType;
}

const LEGAL_DOCUMENTS: readonly LegalDocumentDefinition[] = [
  { slug: 'terms', title: 'Términos y condiciones', docType: 'terms' },
  { slug: 'privacy', title: 'Políticas de privacidad', docType: 'privacy' },
  { slug: 'cookies', title: 'Políticas de cookies' },
  { slug: 'beneficiario', title: 'Declaración del Beneficiario Final' },
  { slug: 'clausulas', title: 'Cláusulas de usos adicionales' },
  { slug: 'refund_policy', title: 'Política de reembolsos', docType: 'refund_policy' },
];

export default async function SuperAdminLegalPage() {
  const session = await getSession();
  const token = session?.accessToken;

  // `GET /legal-documents/current` devuelve UN documento por `docType` y puede
  // devolver 404 si aún no hay versión publicada: consultamos cada tipo y
  // descartamos los faltantes.
  const settled = await Promise.allSettled(LEGAL_DOC_TYPES.map((docType) => getCurrentLegalDocument(docType, token)));
  const current = settled
    .filter((result): result is PromiseFulfilledResult<LegalDocumentResponse> => result.status === 'fulfilled')
    .map((result) => result.value);
  const currentByType = new Map(current.map((document) => [document.docType, document]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold">Documentos legales</h1>
          <p className="text-sm text-muted-foreground">Consulta los documentos vigentes y publica nuevas versiones.</p>
        </header>
        <PublishLegalDocumentDialog />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">Catálogo legal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Incluye todos los documentos enlazados desde el footer público.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEGAL_DOCUMENTS.map((definition) => {
            const doc = definition.docType ? currentByType.get(definition.docType) : undefined;
            return (
              <Card key={definition.slug} className="p-0">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{definition.title}</CardTitle>
                    <Badge variant={doc ? 'secondary' : 'outline'} className="shrink-0">
                      {doc ? `v${doc.version}` : definition.docType ? 'Sin publicar' : 'Frontend'}
                    </Badge>
                  </div>
                  <CardDescription>
                    {doc
                      ? `Publicado el ${formatDate(doc.publishedAt)}`
                      : definition.docType
                        ? 'Aún no tiene una versión publicada.'
                        : 'Documento informativo gestionado como contenido estático.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3 p-5 pt-0">
                  <Link
                    href={`/legal/${definition.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-rose hover:underline"
                  >
                    Ver página pública
                    <ArrowSquareOut className="h-4 w-4" />
                  </Link>
                  {doc ? (
                    <a
                      href={doc.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Archivo vigente
                      <ArrowSquareOut className="h-4 w-4" />
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
