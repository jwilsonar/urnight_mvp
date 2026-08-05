import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InvitadoLanding } from "@/components/promoter/invitado-landing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guest");
  return { title: t("metadataTitle") };
}

export default async function InvitadoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  return <InvitadoLanding codigo={codigo} />;
}
