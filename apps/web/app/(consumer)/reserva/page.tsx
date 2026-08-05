import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ReservaWizard } from "@/components/reservas/reserva-wizard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reserva.metadata");
  return { title: t("title"), description: t("description") };
}

/** Flujo R1–R5 del prototipo. Demo frontend-only hasta tener backend de reservas. */
export default function ReservaPage() {
  return <ReservaWizard />;
}
