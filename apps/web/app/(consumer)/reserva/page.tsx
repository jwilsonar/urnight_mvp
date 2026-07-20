import type { Metadata } from 'next';
import { ReservaWizard } from '@/components/reservas/reserva-wizard';

export const metadata: Metadata = {
  title: 'Reserva tu mesa',
  description: 'Elige tu mesa, arma tu noche y asegura tu box con RAVENUE.',
};

/** Flujo R1–R5 del prototipo. Demo frontend-only hasta tener backend de reservas. */
export default function ReservaPage() {
  return <ReservaWizard />;
}
