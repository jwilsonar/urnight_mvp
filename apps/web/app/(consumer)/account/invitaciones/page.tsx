import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@urnight/ui";
import { PromoterInvitations } from "@/components/account/promoter-invitations";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.invitations");
  return { title: t("title") };
}

export default async function AccountInvitationsPage() {
  const t = await getTranslations("account.invitations");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <PromoterInvitations />
      </CardContent>
    </Card>
  );
}
