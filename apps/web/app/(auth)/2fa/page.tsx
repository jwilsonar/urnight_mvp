import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { MfaChallengeForm } from "@/components/auth/mfa-challenge-form";
import { getSession } from "@/lib/auth-helpers";
import { readPendingMfaChallenge } from "@/lib/auth/mfa-challenge";
import { isSafeInternalPath } from "@/lib/utils/paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("twoFactor");
  return { title: t("metadataTitle") };
}

export default async function TwoFaPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallback = isSafeInternalPath(callbackUrl)
    ? callbackUrl
    : "/post-login";
  const [session, challenge] = await Promise.all([
    getSession(),
    readPendingMfaChallenge(),
  ]);

  if (session?.user) redirect(safeCallback);

  const initialSeconds = challenge
    ? Math.max(
        0,
        Math.ceil((Date.parse(challenge.expiresAt) - Date.now()) / 1000),
      )
    : 0;

  return (
    <AuthShell>
      <MfaChallengeForm
        callbackUrl={safeCallback}
        expiresAt={challenge?.expiresAt}
        initialSeconds={initialSeconds}
      />
    </AuthShell>
  );
}
