import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LEGAL_DOC_TYPES, type LegalDocType } from '@urnight/contracts';
import { Button } from '@urnight/ui';
import { getCurrentLegalDocument } from '@/lib/api/ops';
import { formatDateOnly } from '@/lib/utils';

// ISR: los documentos legales cambian rara vez; cacheamos por 1 hora.
export const revalidate = 3600;

/**
 * Copia de respaldo (fallback) por si el endpoint público de documentos legales
 * no responde: garantiza que las páginas legales nunca queden en blanco.
 */
const FALLBACK: Record<LegalDocType, { title: string; body: string }> = {
  terms: {
    title: 'Términos y condiciones',
    body: 'El uso de UrNight implica la aceptación de estos términos. El servicio está disponible solo para mayores de 18 años. La compra de entradas está sujeta a la disponibilidad y a las políticas de cada local y evento.',
  },
  privacy: {
    title: 'Política de privacidad',
    body: 'Tratamos tus datos personales conforme a la Ley de Protección de Datos Personales del Perú. Usamos tu información para procesar compras, emitir entradas y mejorar el servicio. Puedes solicitar el acceso o la eliminación de tus datos en cualquier momento.',
  },
  refund_policy: {
    title: 'Política de reembolsos',
    body: 'Las entradas adquiridas en UrNight están sujetas a la política de reembolsos de cada local y evento. Salvo cancelación del evento, las compras no son reembolsables. Ante cualquier duda, contáctanos antes de comprar.',
  },
};

function isLegalDocType(value: string): value is LegalDocType {
  return (LEGAL_DOC_TYPES as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  return { title: isLegalDocType(doc) ? FALLBACK[doc].title : 'Legal' };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isLegalDocType(doc)) notFound();

  const fallback = FALLBACK[doc];

  // Documento vigente real (publicado por el superadmin). Si falla, seguimos con el
  // texto de respaldo para no dejar la página legal vacía.
  const current = await getCurrentLegalDocument(doc, undefined, { revalidate }).catch(() => null);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight">{fallback.title}</h1>
      {current ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Versión {current.version} · vigente desde {formatDateOnly(current.publishedAt)}
        </p>
      ) : null}

      <p className="leading-relaxed text-muted-foreground">{fallback.body}</p>

      {current ? (
        <div className="mt-8">
          <Button asChild>
            <Link href={current.contentUrl} target="_blank" rel="noopener noreferrer">
              Ver documento completo
            </Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}
