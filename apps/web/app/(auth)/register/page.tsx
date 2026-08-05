import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@urnight/ui";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "@/components/auth/register-form";
import { getSession } from "@/lib/auth-helpers";
import { isSafeInternalPath } from "@/lib/utils/paths";
import { roleHomePath } from "@/lib/utils/rbac";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("register.metadata");
  return { title: t("title"), description: t("description") };
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback = isSafeInternalPath(callbackUrl)
    ? callbackUrl
    : undefined;
  const t = await getTranslations("register");

  const session = await getSession();
  if (session?.user) {
    redirect(
      safeCallback && safeCallback !== "/"
        ? safeCallback
        : roleHomePath(session.user.roles),
    );
  }

  // Tras registrarse, /post-login resuelve el destino por rol (server-side).
  const target = safeCallback
    ? `/post-login?callbackUrl=${encodeURIComponent(safeCallback)}`
    : "/post-login";
  const loginHref = safeCallback
    ? `/login?callbackUrl=${encodeURIComponent(safeCallback)}`
    : "/login";
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <AuthShell
      heroLabel={t("hero.label")}
      hero={
        <div>
          <p className="font-heading text-3xl font-extrabold leading-tight">
            {t("hero.title")}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">
            {t("hero.description")}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <span className="rv-chip">🎟️ {t("hero.tickets")}</span>
            <span className="rv-chip">❤️ {t("hero.favorites")}</span>
            <span className="rv-chip">+18</span>
          </div>
        </div>
      }
    >
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-strong hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {t("back")}
        </Link>
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <span className="hidden sm:inline">{t("hasAccount")}</span>
          <Button size="sm" asChild>
            <Link href={loginHref}>{t("logIn")}</Link>
          </Button>
        </div>
      </div>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight">
        {t("title")}
      </h1>
      <p className="mb-7 mt-1.5 text-muted-foreground">{t("subtitle")}</p>

      <div className="space-y-4">
        <RegisterForm callbackUrl={target} />
        {googleEnabled ? (
          <>
            <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("continueWith")}
              <span className="h-px flex-1 bg-border" />
            </div>
            <GoogleButton callbackUrl={target} />
          </>
        ) : null}
      </div>
    </AuthShell>
  );
}
