import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { LEGAL_DOC_TYPES, type LegalDocType } from "@urnight/contracts";
import { Button } from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";
import { getCurrentLegalDocument } from "@/lib/api/ops";

export const revalidate = 3600;

const DOC_CONFIG = {
  terms: "https://cdn.ravenue.pe/legal/terminos-y-condiciones.pdf",
  privacy: "https://cdn.ravenue.pe/legal/politica-de-privacidad.pdf",
  cookies: "https://cdn.ravenue.pe/legal/politica-de-cookies.pdf",
  beneficiario:
    "https://cdn.ravenue.pe/legal/declaracion-beneficiario-final.pdf",
  clausulas: "https://cdn.ravenue.pe/legal/clausulas-usos-adicionales.pdf",
  refund_policy: "https://cdn.ravenue.pe/legal/politica-de-reembolsos.pdf",
} as const;

type DocKey = keyof typeof DOC_CONFIG;
type LegalCopy = {
  crumb: string;
  title: string;
  updated: string;
  intro: string;
  sections: [string, string][];
};

function isDocKey(value: string): value is DocKey {
  return Object.prototype.hasOwnProperty.call(DOC_CONFIG, value);
}

function isLegalDocType(value: string): value is LegalDocType {
  return (LEGAL_DOC_TYPES as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return Object.keys(DOC_CONFIG).map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const t = await getTranslations("legal");
  if (!isDocKey(doc)) return { title: t("fallbackTitle") };
  const entry = t.raw(`docs.${doc}`) as LegalCopy;
  return { title: entry.title, description: entry.intro };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  if (!isDocKey(doc)) notFound();

  const t = await getTranslations("legal");
  const format = await getFormatter();
  const entry = t.raw(`docs.${doc}`) as LegalCopy;
  const current = isLegalDocType(doc)
    ? await getCurrentLegalDocument(doc, undefined, { revalidate }).catch(
        () => null,
      )
    : null;
  const documentUrl = current?.contentUrl ?? DOC_CONFIG[doc];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Reveal>
        <p className="rv-eyebrow">{entry.crumb}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {entry.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {current
            ? t("publishedVersion", {
                version: current.version,
                date: format.dateTime(new Date(current.publishedAt), {
                  dateStyle: "long",
                }),
              })
            : entry.updated}
        </p>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {entry.intro}
        </p>
      </Reveal>
      <div className="mt-10 space-y-8">
        {entry.sections.map(([title, body], index) => (
          <Reveal key={title} delay={index * 50}>
            <section>
              <h2 className="mb-2.5 font-heading text-xl font-bold">{title}</h2>
              <p className="leading-relaxed text-muted-foreground">{body}</p>
            </section>
          </Reveal>
        ))}
      </div>
      <div className="mt-10">
        <Button asChild>
          <Link href={documentUrl} target="_blank" rel="noopener noreferrer">
            {t("viewDocument")}
          </Link>
        </Button>
      </div>
    </article>
  );
}
