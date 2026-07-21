"use client";

import { Star } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { TicketResponse } from "@urnight/contracts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@urnight/ui";
import { ReviewForm } from "@/components/trust/review-form";
import { TicketCard } from "@/components/tickets/ticket-card";

/** Entrada en la billetera + acción de reseña cuando ya fue usada (asistencia verificada). */
export function AccountTicketItem({ ticket }: { ticket: TicketResponse }) {
  const t = useTranslations("account.tickets.review");
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <TicketCard ticket={ticket} />
      {ticket.status === "used" ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Star className="h-4 w-4" /> {t("action")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>
            <ReviewForm
              eventId={ticket.eventId}
              ticketId={ticket.id}
              onDone={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
