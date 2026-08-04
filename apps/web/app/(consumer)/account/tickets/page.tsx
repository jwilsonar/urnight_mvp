import { Ticket } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { TicketResponse } from "@urnight/contracts";
import { AccountTicketItem } from "@/components/account/account-ticket-item";
import { SessionRecoveryState } from "@/components/account/session-recovery-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@urnight/ui";
import { getMyTickets } from "@/lib/api/tickets";
import { requireSession } from "@/lib/auth-helpers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.tickets");
  return { title: t("metadataTitle") };
}

export default async function MyTicketsPage() {
  const t = await getTranslations("account.tickets");
  const session = await requireSession("/account/tickets");
  if (!session.accessToken || session.error) {
    return <SessionRecoveryState />;
  }
  const token = session.accessToken;

  // Esta ruta no tiene error boundary propio: un fallo del API degradaría a la
  // cuenta entera. Lo contenemos aquí y distinguimos "sin entradas" de "error".
  let tickets: TicketResponse[];
  try {
    tickets = await getMyTickets(token);
  } catch {
    return (
      <ErrorState
        title={t("error.title")}
        description={t("error.description")}
      />
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="h-10 w-10" weight="duotone" />}
        title={t("empty.title")}
        description={t("empty.description")}
        action={
          <Button asChild>
            <Link href="/events">{t("empty.action")}</Link>
          </Button>
        }
      />
    );
  }

  // Próximas (evento aún por venir o sin fecha) vs. pasadas. La query ya ordena
  // por fecha ascendente; las pasadas se muestran de más reciente a más antigua.
  const now = Date.now();
  const isUpcoming = (t: TicketResponse) =>
    !t.eventStartsAt || new Date(t.eventStartsAt).getTime() >= now;
  const upcoming = tickets.filter(isUpcoming);
  const past = tickets.filter((t) => !isUpcoming(t)).reverse();

  return (
    <div className="space-y-8">
      {upcoming.length > 0 ? (
        <TicketSection title={t("upcoming")} tickets={upcoming} />
      ) : null}
      {past.length > 0 ? (
        <TicketSection title={t("past")} tickets={past} />
      ) : null}
    </div>
  );
}

function TicketSection({
  title,
  tickets,
}: {
  title: string;
  tickets: TicketResponse[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">{tickets.length}</span>
      </div>
      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <AccountTicketItem key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </section>
  );
}
