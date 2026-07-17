import type { Metadata } from 'next';
import { InvitadoLanding } from '@/components/promoter/invitado-landing';

export const metadata: Metadata = {
  title: 'Lista de invitados',
};

export default async function InvitadoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  return <InvitadoLanding codigo={codigo} />;
}
