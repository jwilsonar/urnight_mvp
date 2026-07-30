import {
  Prohibit,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { Badge, cn } from "@urnight/ui";

export type EventAvailability =
  | "onSale"
  | "almostFull"
  | "soldOut"
  | "cancelled";

export function EventStatusPill({
  status,
  className,
}: {
  status: EventAvailability;
  className?: string;
}) {
  const t = useTranslations("events.card");

  if (status === "onSale") {
    return (
      <Badge variant="success" className={cn("relative pl-2.5", className)}>
        <span className="relative flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        {t("status.published")}
      </Badge>
    );
  }

  if (status === "almostFull") {
    return (
      <Badge variant="warning" className={className}>
        <WarningCircle className="size-3.5" weight="fill" aria-hidden="true" />
        {t("almostFull")}
      </Badge>
    );
  }

  if (status === "soldOut") {
    return (
      <Badge variant="destructive" className={className}>
        <XCircle className="size-3.5" weight="fill" aria-hidden="true" />
        {t("soldOut")}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className={className}>
      <Prohibit className="size-3.5" weight="bold" aria-hidden="true" />
      {t("status.cancelled")}
    </Badge>
  );
}
