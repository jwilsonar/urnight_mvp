import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const DOCS = {
  terms: {
    title: 'Términos y condiciones',
    body: 'El uso de UrNight implica la aceptación de estos términos. El servicio está disponible solo para mayores de 18 años. La compra de entradas está sujeta a la disponibilidad y a las políticas de cada local y evento.',
  },
  privacy: {
    title: 'Política de privacidad',
    body: 'Tratamos tus datos personales conforme a la Ley de Protección de Datos Personales del Perú. Usamos tu información para procesar compras, emitir entradas y mejorar el servicio. Puedes solicitar el acceso o la eliminación de tus datos en cualquier momento.',
  },
} as const;

type DocKey = keyof typeof DOCS;

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  return { title: entry?.title ?? 'Legal' };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  if (!entry) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-3xl font-bold tracking-tight">{entry.title}</h1>
      <p className="leading-relaxed text-muted-foreground">{entry.body}</p>
    </article>
  );
}
