import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MfaSecurityPanel } from "@/components/account/mfa-security-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.security");
  return { title: t("metadataTitle"), description: t("description") };
}

export default function AccountSecurityPage() {
  return <MfaSecurityPanel />;
}
