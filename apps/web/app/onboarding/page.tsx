import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OnboardingClient } from '@/components/onboarding/onboarding-client';
import { requireSession } from '@/lib/auth-helpers';

export const metadata: Metadata = { title: 'Bienvenido' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const target = callbackUrl ?? '/';
  const session = await requireSession('/onboarding');

  // Ya completado: no re-mostrar el onboarding.
  if (session.user.onboardingCompleted) redirect(target);

  return <OnboardingClient callbackUrl={target} userName={session.user.name ?? undefined} />;
}
