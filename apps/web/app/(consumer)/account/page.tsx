import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@urnight/ui";
import { FavoritesList } from "@/components/account/favorites-list";
import { PreferencesForm } from "@/components/account/preferences-form";
import { ProfileEditForm } from "@/components/account/profile-edit-form";
import { RedemptionsList } from "@/components/account/redemptions-list";
import { fetchMe } from "@/lib/api/auth/requests";
import { getSession } from "@/lib/auth-helpers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.profile");
  return { title: t("metadataTitle") };
}

export default async function AccountProfilePage() {
  const t = await getTranslations("account.profile");
  const session = await getSession();
  const user = session?.user;
  const roles = user?.roles ?? [];
  const profile = session?.accessToken
    ? await fetchMe(session.accessToken).catch(() => null)
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("name")}</span>
            <span className="font-medium">{user?.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{t("rolesLabel")}</span>
            <div className="flex flex-wrap justify-end gap-1">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {t.has(`roles.${role}`) ? t(`roles.${role}`) : role}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">{t("roles.user")}</Badge>
              )}
            </div>
          </div>
          <ProfileEditForm
            initialEmail={profile?.email ?? user?.email ?? ""}
            initialPhone={profile?.phone ?? ""}
            initialImage={profile?.avatarUrl ?? user?.image}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("favorites.title")}</CardTitle>
          <CardDescription>{t("favorites.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <FavoritesList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("redemptions.title")}</CardTitle>
          <CardDescription>{t("redemptions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RedemptionsList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("preferencesTitle")}</CardTitle>
          <CardDescription>{t("preferencesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm />
        </CardContent>
      </Card>
    </div>
  );
}
