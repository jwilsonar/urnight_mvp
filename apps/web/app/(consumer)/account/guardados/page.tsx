import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@urnight/ui";
import { FavoritesList } from "@/components/account/favorites-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.saved");
  return { title: t("title") };
}

/**
 * Guardados del usuario, separados por tipo (eventos / locales) con pestañas.
 * Reutiliza FavoritesList con su nuevo prop `filter`.
 */
export default async function SavedPage() {
  const t = await getTranslations("account.saved");
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">{t("events")}</TabsTrigger>
          <TabsTrigger value="locals">{t("venues")}</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="pt-4">
          <FavoritesList filter="event" />
        </TabsContent>
        <TabsContent value="locals" className="pt-4">
          <FavoritesList filter="local" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
