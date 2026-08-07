"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@urnight/ui";

/** Claves de `legal.docs.*` en los mensajes. */
export type LegalDocKey =
  | "terms"
  | "privacy"
  | "cookies"
  | "beneficiario"
  | "clausulas";

interface LegalCopy {
  crumb: string;
  title: string;
  updated: string;
  intro: string;
  sections: [string, string][];
}

/**
 * Muestra un documento legal en un diálogo, sin sacar a la persona del
 * formulario que está llenando.
 *
 * Antes el enlace abría `/legal/terms` en otra pestaña: para aceptar los
 * términos había que abandonar el registro, leer y volver. El contenido sale
 * del mismo catálogo i18n que la página pública, así que no hay dos versiones
 * que puedan divergir.
 */
export function LegalDialog({
  doc,
  trigger,
}: {
  doc: LegalDocKey;
  trigger: ReactNode;
}) {
  const t = useTranslations("legal");
  const entry = t.raw(`docs.${doc}`) as LegalCopy;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {entry.title}
          </DialogTitle>
          <DialogDescription>{entry.updated}</DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {entry.intro}
        </p>
        <div className="space-y-5">
          {entry.sections.map(([title, body]) => (
            <section key={title}>
              <h3 className="mb-1.5 font-heading text-base font-bold">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </section>
          ))}
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/legal/${doc}`} target="_blank" rel="noopener noreferrer">
            {t("viewDocument")}
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
