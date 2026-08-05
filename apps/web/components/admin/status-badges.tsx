import type { ComponentProps } from "react";
import type {
  EventResponse,
  LocalResponse,
  TicketTypeResponse,
} from "@urnight/contracts";
import { Badge } from "@urnight/ui";
import { EventStatusPill } from "@/components/catalog/event-status-pill";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const LOCAL_STATUS: Record<
  LocalResponse["status"],
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Borrador", variant: "secondary" },
  active: { label: "Activo", variant: "success" },
  inactive: { label: "Inactivo", variant: "outline" },
  suspended: { label: "Suspendido", variant: "destructive" },
};

const EVENT_STATUS: Record<
  EventResponse["status"],
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Borrador", variant: "secondary" },
  scheduled: { label: "Programado", variant: "outline" },
  published: { label: "Publicado", variant: "success" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  finished: { label: "Finalizado", variant: "outline" },
};

const TICKET_STATUS: Record<
  TicketTypeResponse["status"],
  { label: string; variant: BadgeVariant }
> = {
  active: { label: "Activo", variant: "success" },
  paused: { label: "Pausado", variant: "secondary" },
  sold_out: { label: "Agotado", variant: "destructive" },
};

const TIER_LABELS: Record<TicketTypeResponse["tierCode"], string> = {
  general: "General",
  vip: "VIP",
  premium: "Premium",
};

export function LocalStatusBadge({
  status,
}: {
  status: LocalResponse["status"];
}) {
  const { label, variant } = LOCAL_STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function EventStatusBadge({
  status,
}: {
  status: EventResponse["status"];
}) {
  if (status === "published") return <EventStatusPill status="onSale" />;
  if (status === "cancelled") return <EventStatusPill status="cancelled" />;
  const { label, variant } = EVENT_STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function TicketStatusBadge({
  status,
}: {
  status: TicketTypeResponse["status"];
}) {
  if (status === "sold_out") return <EventStatusPill status="soldOut" />;
  const { label, variant } = TICKET_STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function VerifiedBadge({ isVerified }: { isVerified: boolean }) {
  return isVerified ? (
    <Badge variant="success">Verificado</Badge>
  ) : (
    <Badge variant="outline">Sin verificar</Badge>
  );
}

export function tierLabel(tierCode: TicketTypeResponse["tierCode"]): string {
  return TIER_LABELS[tierCode];
}
