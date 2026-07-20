import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LEGAL_DOC_TYPES, type LegalDocType } from '@urnight/contracts';
import { Button } from '@urnight/ui';
import { Reveal } from '@/components/shared/reveal';
import { getCurrentLegalDocument } from '@/lib/api/ops';
import { formatDateOnly } from '@/lib/utils';

// ISR: los documentos legales cambian rara vez; cacheamos por 1 hora.
export const revalidate = 3600;

/**
 * Documentos legales e informativos (pantallas "Legales" del prototipo).
 *
 * Cada tipo tiene contenido estático de respaldo con el estilo del DS. Para los
 * tipos que gestiona el backend (LEGAL_DOC_TYPES: terms/privacy/refund_policy),
 * además consultamos la versión vigente publicada por el superadmin y mostramos
 * su metadata + enlace al documento oficial. El resto (cookies, beneficiario,
 * cláusulas) son páginas informativas sólo-frontend enlazadas desde el footer.
 */
const DOCS = {
  terms: {
    crumb: 'Legales',
    title: 'Términos y condiciones',
    updated: 'Última actualización: mayo 2026',
    intro:
      'Estos términos regulan el uso de la plataforma RAVENUE y los servicios ofrecidos a través de ella.',
    sections: [
      [
        '1. Aceptación',
        'Al crear una cuenta o usar RAVENUE aceptas estos términos y condiciones, así como nuestras políticas de privacidad y de cookies.',
      ],
      [
        '2. Uso de la plataforma',
        'RAVENUE es una plataforma exclusiva para mayores de 18 años que conecta usuarios con eventos y locales. Debes brindar información veraz y mantener la confidencialidad de tu cuenta.',
      ],
      [
        '3. Compra de entradas y reservas',
        'Las compras y reservas se rigen por las condiciones de cada evento y local. RAVENUE actúa como intermediario tecnológico para la venta y gestión.',
      ],
      [
        '4. Responsabilidades',
        'El acceso final a cada local queda sujeto a sus normas de ingreso. Los locales son responsables de la prestación del servicio ofrecido.',
      ],
      [
        '5. Propiedad intelectual',
        'Todo el contenido, marca y diseño de RAVENUE están protegidos. No está permitida su reproducción sin autorización.',
      ],
    ],
  },
  privacy: {
    crumb: 'Legales',
    title: 'Políticas de privacidad',
    updated: 'Última actualización: mayo 2026',
    intro: 'Explicamos qué datos recopilamos, con qué fin y cómo los protegemos.',
    sections: [
      [
        'Datos que recopilamos',
        'Datos de registro (nombre, correo, documento, teléfono), información de compras y reservas, y datos de uso de la plataforma.',
      ],
      [
        'Cómo los usamos',
        'Para gestionar tu cuenta, procesar compras y reservas, verificar tu mayoría de edad, prevenir fraude y mejorar tu experiencia.',
      ],
      [
        'Protección',
        'Tus datos se almacenan cifrados y aplicamos medidas de seguridad para evitar accesos no autorizados.',
      ],
      [
        'Tus derechos',
        'Puedes acceder, rectificar o solicitar la eliminación de tus datos escribiéndonos desde el centro de ayuda.',
      ],
    ],
  },
  cookies: {
    crumb: 'Legales',
    title: 'Políticas de cookies',
    updated: 'Última actualización: mayo 2026',
    intro:
      'Usamos cookies para que la plataforma funcione correctamente y mejorar tu experiencia.',
    sections: [
      [
        '¿Qué son las cookies?',
        'Pequeños archivos que se guardan en tu dispositivo para recordar tus preferencias y mantener tu sesión activa.',
      ],
      [
        'Tipos de cookies',
        'Esenciales (necesarias para el funcionamiento), de rendimiento (analíticas anónimas) y de personalización (recordar tus filtros y preferencias).',
      ],
      [
        'Gestión',
        'Puedes limpiar las cookies desde el pie de página o desde la configuración de tu navegador en cualquier momento.',
      ],
    ],
  },
  beneficiario: {
    crumb: 'Legales',
    title: 'Declaración del Beneficiario Final',
    updated: 'Última actualización: mayo 2026',
    intro:
      'En cumplimiento de la normativa vigente, RAVENUE identifica a sus beneficiarios finales.',
    sections: [
      [
        'Definición',
        'Se entiende por beneficiario final a la persona natural que finalmente posee o controla a la empresa titular de la plataforma.',
      ],
      [
        'Declaración',
        'RAVENUE mantiene actualizada la identificación de sus beneficiarios finales conforme a la normativa de prevención de lavado de activos.',
      ],
      [
        'Transparencia',
        'Esta información se encuentra a disposición de las autoridades competentes cuando sea requerida.',
      ],
    ],
  },
  clausulas: {
    crumb: 'Legales',
    title: 'Cláusulas de usos adicionales',
    updated: 'Última actualización: mayo 2026',
    intro: 'Condiciones aplicables al consentimiento para usos adicionales de tus datos.',
    sections: [
      [
        'Alcance',
        'Al otorgar tu consentimiento para usos adicionales, autorizas el envío de beneficios, promociones y descuentos personalizados.',
      ],
      [
        'Carácter voluntario',
        'Este consentimiento es opcional y no condiciona el uso de la plataforma ni la compra de entradas o reservas.',
      ],
      [
        'Revocación',
        'Puedes revocar tu consentimiento en cualquier momento desde la configuración de tu cuenta o escribiéndonos al centro de ayuda.',
      ],
    ],
  },
  refund_policy: {
    crumb: 'Legales',
    title: 'Política de reembolsos',
    updated: 'Última actualización: mayo 2026',
    intro: 'Condiciones aplicables a la devolución de entradas compradas en RAVENUE.',
    sections: [
      [
        'Regla general',
        'Salvo cancelación del evento, las entradas adquiridas en RAVENUE no son reembolsables. Antes de comprar, revisa la fecha, el local y las condiciones del evento.',
      ],
      [
        'Cancelación del evento',
        'Si el organizador cancela un evento, gestionaremos la devolución del importe de la entrada según el medio de pago utilizado y los plazos del procesador.',
      ],
      [
        'Política de cada local',
        'Cada local y evento puede definir condiciones adicionales de reembolso o cambio. Estas se muestran en el detalle del evento antes de la compra.',
      ],
      [
        'Cómo solicitarlo',
        'Ante cualquier duda o solicitud, escríbenos desde el centro de ayuda indicando tu número de orden.',
      ],
    ],
  },
} as const;

type DocKey = keyof typeof DOCS;

/** ¿La ruta corresponde a un documento con contenido (estático o gestionado)? */
function isDocKey(value: string): value is DocKey {
  return Object.prototype.hasOwnProperty.call(DOCS, value);
}

/** ¿El tipo lo gestiona el backend? (subconjunto con versión publicada). */
function isLegalDocType(value: string): value is LegalDocType {
  return (LEGAL_DOC_TYPES as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const entry = isDocKey(doc) ? DOCS[doc] : null;
  return { title: entry?.title ?? 'Legal', description: entry?.intro };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isDocKey(doc)) notFound();

  const entry = DOCS[doc];

  // Documento vigente real (publicado por el superadmin) sólo para los tipos que
  // gestiona el backend. Si falla o no existe, seguimos con el respaldo estático
  // para no dejar la página legal en blanco (y no romper el build ISR sin API).
  const current = isLegalDocType(doc)
    ? await getCurrentLegalDocument(doc, undefined, { revalidate }).catch(() => null)
    : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="rv-eyebrow">{entry.crumb}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {entry.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {current
            ? `Versión ${current.version} · vigente desde ${formatDateOnly(current.publishedAt)}`
            : entry.updated}
        </p>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {entry.intro}
        </p>
      </Reveal>
      <div className="mt-10 space-y-8">
        {entry.sections.map(([title, body], i) => (
          <Reveal key={title} delay={i * 50}>
            <section>
              <h2 className="mb-2.5 font-heading text-xl font-bold">{title}</h2>
              <p className="leading-relaxed text-muted-foreground">{body}</p>
            </section>
          </Reveal>
        ))}
      </div>
      {current ? (
        <div className="mt-10">
          <Button asChild>
            <Link href={current.contentUrl} target="_blank" rel="noopener noreferrer">
              Ver documento oficial completo
            </Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}
