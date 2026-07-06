import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/shared/reveal';

/**
 * Documentos legales e informativos del prototipo (pantallas "Legales").
 * Contenido estático de frontend; cuando el backend de documentos legales
 * (panel superadmin → legal) publique versiones, esta página puede migrar a
 * leerlas del API sin cambiar la URL.
 */
const DOCS = {
  terms: {
    crumb: 'Legales',
    title: 'Términos y condiciones',
    updated: 'Última actualización: mayo 2026',
    intro:
      'Estos términos regulan el uso de la plataforma UrNight y los servicios ofrecidos a través de ella.',
    sections: [
      [
        '1. Aceptación',
        'Al crear una cuenta o usar UrNight aceptas estos términos y condiciones, así como nuestras políticas de privacidad y de cookies.',
      ],
      [
        '2. Uso de la plataforma',
        'UrNight es una plataforma exclusiva para mayores de 18 años que conecta usuarios con eventos y locales. Debes brindar información veraz y mantener la confidencialidad de tu cuenta.',
      ],
      [
        '3. Compra de entradas y reservas',
        'Las compras y reservas se rigen por las condiciones de cada evento y local. UrNight actúa como intermediario tecnológico para la venta y gestión.',
      ],
      [
        '4. Responsabilidades',
        'El acceso final a cada local queda sujeto a sus normas de ingreso. Los locales son responsables de la prestación del servicio ofrecido.',
      ],
      [
        '5. Propiedad intelectual',
        'Todo el contenido, marca y diseño de UrNight están protegidos. No está permitida su reproducción sin autorización.',
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
      'En cumplimiento de la normativa vigente, UrNight identifica a sus beneficiarios finales.',
    sections: [
      [
        'Definición',
        'Se entiende por beneficiario final a la persona natural que finalmente posee o controla a la empresa titular de la plataforma.',
      ],
      [
        'Declaración',
        'UrNight mantiene actualizada la identificación de sus beneficiarios finales conforme a la normativa de prevención de lavado de activos.',
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
    intro:
      'Condiciones aplicables al consentimiento para usos adicionales de tus datos.',
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
} as const;

type DocKey = keyof typeof DOCS;

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  return { title: entry?.title ?? 'Legal', description: entry?.intro };
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const entry = DOCS[doc as DocKey];
  if (!entry) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="un-eyebrow">{entry.crumb}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {entry.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{entry.updated}</p>
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
    </article>
  );
}
