import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/lib/auth-helpers";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("account");
  const session = await requireSession("/account");
  // Onboarding pendiente: completarlo antes de usar la cuenta.
  if (session.user.onboardingCompleted === false) {
    redirect("/onboarding?callbackUrl=/account");
  }
  return (
    /* Dos columnas desde `lg`: la navegación a la izquierda y el contenido al
       lado, en vez de trece pestañas apiladas en tres o cuatro filas que
       empujaban el perfil hacia abajo. */
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-heading text-2xl font-bold tracking-tight">
        {t("title")}
      </h1>
      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <AccountNav />
        <div className="mt-6 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}
