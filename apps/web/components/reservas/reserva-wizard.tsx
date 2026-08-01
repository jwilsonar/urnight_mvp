"use client";

/**
 * Flujo de reserva de mesa del prototipo v3 (R1–R5) como wizard de una ruta.
 * DEMO frontend-only: mesas/botellas vienen de lib/mock/reservas.ts y el
 * paso final no cobra nada — el pago llega con el backend de reservas.
 */

import {
  ArrowLeft,
  ArrowRight,
  Cake,
  CalendarBlank,
  Check,
  Info,
  Lock,
  Minus,
  Plus,
  Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@urnight/ui";
import { PasesGrupo } from "@/components/reservas/pases-grupo";
import { otorgarCreditoDemo } from "@/lib/mock/credito";
import { leerPoliticaDemo } from "@/lib/mock/politica";
import {
  BOTELLAS_DEMO,
  calcularDesgloseDemo,
  emitirPasesDemo,
  EVENTO_DEMO,
  LLEGADAS_DEMO,
  MESAS_DEMO,
  type DesgloseReservaDemo,
  type MesaDemo,
  type PaseReservaDemo,
} from "@/lib/mock/reservas";

const STEPS = ["table", "details", "bottles", "summary", "done"] as const;
const RESERVA_ID_DEMO = "reserva-demo-4821";

function Stepper({ current }: { current: number }) {
  const t = useTranslations("reserva");

  return (
    <ol
      className="flex items-center justify-center gap-2 sm:gap-3"
      aria-label={t("progress")}
    >
      {STEPS.map((step, i) => (
        <li key={step} className="flex items-center gap-2 sm:gap-3">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full border text-xs font-bold transition-colors",
              i < current
                ? "border-transparent bg-primary text-primary-foreground"
                : i === current
                  ? "border-accent-border bg-accent text-foreground"
                  : "border-border text-muted-foreground",
            )}
          >
            {i < current ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span
            className={cn(
              "hidden text-xs font-semibold sm:inline",
              i === current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {t(`steps.${step}`)}
          </span>
          {i < STEPS.length - 1 ? (
            <span className="h-px w-4 bg-border sm:w-8" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function QtyStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (delta: number) => void;
}) {
  const t = useTranslations("reserva");

  return (
    <div className="flex items-center rounded-sm border bg-white/[0.04] p-0.5">
      <button
        type="button"
        aria-label={t("remove")}
        onClick={() => onChange(-1)}
        disabled={value === 0}
        className={cn(
          "flex size-7 items-center justify-center rounded-[6px] transition-colors",
          // Solo tiene sentido cuando hay algo que quitar; deshabilitado sin
          // que "0 → 0" haga nada. El hover ilumina para dar feedback táctil.
          value > 0
            ? "text-foreground hover:bg-white/10"
            : "text-foreground opacity-40",
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-[13px] font-bold">{value}</span>
      <button
        type="button"
        aria-label={t("add")}
        onClick={() => onChange(1)}
        // El "+" es la acción primaria del stepper: se mantiene morado SIEMPRE
        // (aunque ya haya botellas elegidas) como ancla visual estable de "así
        // se agrega". El hover lo aclara para confirmar que es clickeable.
        className="flex size-7 items-center justify-center rounded-[6px] bg-primary text-primary-foreground transition-colors hover:bg-primary/85"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function SummaryCard({ children }: { children: React.ReactNode }) {
  const t = useTranslations("reserva");

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-lg border bg-card p-5">
        <p className="rv-eyebrow mb-3">{t("summary.title")}</p>
        <div className="mb-3.5 flex gap-3 border-b pb-3.5">
          <div className="rv-img-ph size-16 shrink-0 rounded-sm">
            <span>{t("event.placeholder")}</span>
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-bold">{EVENTO_DEMO.title}</p>
            <p className="text-xs text-muted-foreground">
              {t("event.date")} · {EVENTO_DEMO.time}
            </p>
            <p className="text-xs text-muted-foreground">{EVENTO_DEMO.venue}</p>
          </div>
        </div>
        {children}
      </div>
    </aside>
  );
}

export function ReservaWizard() {
  const t = useTranslations("reserva");
  const format = useFormatter();
  const politica = leerPoliticaDemo("nocturna-club");
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"lista" | "planta">("lista");
  const [mesa, setMesa] = useState<MesaDemo | null>(null);
  const [size, setSize] = useState(4);
  const [time, setTime] = useState("11:30 PM");
  const [birthday, setBirthday] = useState(false);
  const [host, setHost] = useState("");
  const [hostError, setHostError] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [confirmacion, setConfirmacion] = useState<{
    desglose: DesgloseReservaDemo;
    pases: PaseReservaDemo[];
  } | null>(null);

  const bottlesTotal = BOTELLAS_DEMO.reduce(
    (sum, b) => sum + (cart[b.id] ?? 0) * b.price,
    0,
  );
  const inCart = BOTELLAS_DEMO.filter((b) => (cart[b.id] ?? 0) > 0);
  const total = (mesa?.deposit ?? 0) + bottlesTotal;
  const desglose = calcularDesgloseDemo(total, politica);
  const money = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "PEN",
      currencyDisplay: "narrowSymbol",
    });
  const tableLabel = (table: MesaDemo) => t(`tables.${table.id}.label`);
  const setQty = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));

  function pickMesa(m: MesaDemo) {
    if (m.status === "reserved") return;
    setMesa(m);
    setSize(Math.min(4, m.cap));
  }

  function confirmarReserva() {
    if (!mesa) return;
    const cleanHost = host.trim();
    if (!cleanHost) {
      setHostError(t("details.hostError"));
      setStep(1);
      return;
    }

    otorgarCreditoDemo(
      RESERVA_ID_DEMO,
      "nocturna-club",
      desglose.creditoConsumo,
    );
    setConfirmacion({
      desglose,
      pases: emitirPasesDemo(
        RESERVA_ID_DEMO,
        mesa.zonaId ?? "general",
        cleanHost,
        size,
      ),
    });
    setStep(4);
  }

  function continuar() {
    if (step === 1 && !host.trim()) {
      setHostError(t("details.hostError"));
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabecera del flujo: título + candado de reserva segura + stepper */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Lock className="size-3.5" /> {t("secure")}
          <Badge variant="info">{t("demo")}</Badge>
        </span>
      </div>
      <div className="mb-9 border-b pb-6">
        <Stepper current={step} />
      </div>

      {/* ===== Paso final (Listo) ocupa todo el ancho ===== */}
      {step === 4 ? (
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-6 flex size-24 items-center justify-center rounded-3xl border border-success-border bg-success-soft">
            <Check className="size-10 text-success" weight="bold" />
          </div>
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">
            {t("confirmation.title")}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {mesa
              ? t("confirmation.description", {
                  table: tableLabel(mesa),
                  count: size,
                  time,
                })
              : null}
          </p>
          <p className="mt-5 rounded-md border border-accent-border bg-accent px-6 py-4 font-mono text-2xl font-bold tracking-[0.2em] text-rose">
            UR-DEMO-4821
          </p>
          {confirmacion ? (
            <>
              <div className="mt-5 rounded-md border border-success-border bg-success-soft p-4 text-sm font-semibold text-success">
                {t("confirmation.creditActive", {
                  amount: money(confirmacion.desglose.creditoConsumo),
                })}
              </div>
              {!politica.reingresoPermitido ? (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-info">
                  <Info className="size-4 shrink-0" weight="duotone" />{" "}
                  {t("confirmation.noReentry")}
                </p>
              ) : null}
              <PasesGrupo pases={confirmacion.pases} />
            </>
          ) : null}
          <div className="mt-4">
            <Badge variant="info">{t("confirmation.backendDemo")}</Badge>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/events">{t("confirmation.moreEvents")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">{t("confirmation.home")}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            {/* ===== R1 · Mesa ===== */}
            {step === 0 ? (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-xl font-extrabold">
                    {t("table.title")}
                  </h2>
                  <div className="flex gap-1 rounded-md border bg-white/[0.04] p-1">
                    {(["lista", "planta"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        className={cn(
                          "rounded-sm px-3.5 py-2 text-xs font-semibold capitalize transition-colors",
                          view === v
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {t(`table.view.${v}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {view === "lista" ? (
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {MESAS_DEMO.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={m.status === "reserved"}
                        onClick={() => pickMesa(m)}
                        className={cn(
                          "overflow-hidden rounded-md border bg-card text-left transition-[border-color,box-shadow,opacity]",
                          mesa?.id === m.id &&
                            "border-accent-border bg-[var(--accent-soft-faint)]",
                          m.status === "reserved" &&
                            "cursor-not-allowed opacity-40",
                        )}
                      >
                        <div className="rv-img-ph h-[110px]">
                          <span>{t(`table.placeholder.${m.zone}`)}</span>
                        </div>
                        <div className="p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="rv-eyebrow">
                                {t(`table.zone.${m.zone}`)}
                              </p>
                              <p className="mt-0.5 text-[15px] font-bold">
                                {tableLabel(m)}
                              </p>
                            </div>
                            {m.hot && m.status === "available" ? (
                              <Badge variant="warning">
                                {t("table.fewLeft")}
                              </Badge>
                            ) : null}
                            {m.status === "reserved" ? (
                              <Badge variant="outline">
                                {t("table.reserved")}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />{" "}
                              {t("people", { count: m.cap })}
                            </span>
                            <span>
                              {t("table.minimum", { amount: money(m.min) })}
                            </span>
                            <span>
                              {t("table.deposit", { amount: money(m.deposit) })}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card p-5">
                    <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] border border-success-border bg-success-soft" />{" "}
                        {t("table.available")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] border border-warning-border bg-warning-soft" />{" "}
                        {t("table.fewLeft")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] border bg-white/10" />{" "}
                        {t("table.reserved")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] bg-primary" />{" "}
                        {t("table.selection")}
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 600 400"
                      className="w-full rounded-md border bg-background"
                      role="img"
                      aria-label={t("floor.aria")}
                    >
                      <rect
                        x="20"
                        y="20"
                        width="280"
                        height="180"
                        rx="8"
                        fill="var(--accent-soft-faint)"
                        stroke="var(--accent-border-subtle)"
                      />
                      <text
                        x="32"
                        y="42"
                        fill="var(--text-accent-soft)"
                        fontSize="11"
                        fontWeight="700"
                        letterSpacing="2"
                      >
                        {t("floor.danceFloor")}
                      </text>
                      <rect
                        x="320"
                        y="20"
                        width="260"
                        height="180"
                        rx="8"
                        fill="rgba(245,158,11,0.06)"
                        stroke="rgba(245,158,11,0.2)"
                      />
                      <text
                        x="332"
                        y="42"
                        fill="rgba(252,211,77,0.8)"
                        fontSize="11"
                        fontWeight="700"
                        letterSpacing="2"
                      >
                        {t("floor.vip")}
                      </text>
                      <rect
                        x="20"
                        y="220"
                        width="560"
                        height="160"
                        rx="8"
                        fill="var(--accent-hover-soft-faint)"
                        stroke="var(--accent-hover-border-subtle)"
                      />
                      <text
                        x="32"
                        y="242"
                        fill="var(--text-accent-soft)"
                        fontSize="11"
                        fontWeight="700"
                        letterSpacing="2"
                      >
                        {t("floor.lounge")}
                      </text>
                      <text
                        x="536"
                        y="42"
                        fill="rgba(160,160,176,0.8)"
                        fontSize="10"
                      >
                        {t("floor.bar")}
                      </text>
                      <text
                        x="270"
                        y="395"
                        fill="rgba(160,160,176,0.8)"
                        fontSize="10"
                      >
                        {t("floor.entrance")}
                      </text>
                      {MESAS_DEMO.map((m) => {
                        const isSel = mesa?.id === m.id;
                        const fill = isSel
                          ? "var(--color-primary)"
                          : m.status === "reserved"
                            ? "rgba(255,255,255,0.05)"
                            : m.hot
                              ? "rgba(245,158,11,0.3)"
                              : "rgba(34,197,94,0.3)";
                        const stroke = isSel
                          ? "var(--text-accent)"
                          : m.status === "reserved"
                            ? "rgba(255,255,255,0.12)"
                            : m.hot
                              ? "rgba(245,158,11,0.8)"
                              : "rgba(34,197,94,0.8)";
                        return (
                          <g
                            key={m.id}
                            onClick={() => pickMesa(m)}
                            className={
                              m.status === "reserved"
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            }
                          >
                            <rect
                              x={m.layout.x}
                              y={m.layout.y}
                              width={m.layout.w}
                              height={m.layout.h}
                              rx="6"
                              fill={fill}
                              stroke={stroke}
                              strokeWidth="1.5"
                            />
                            <text
                              x={m.layout.x + m.layout.w / 2}
                              y={m.layout.y + m.layout.h / 2 + 4}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize="11"
                              fontWeight="700"
                            >
                              {
                                tableLabel(m)
                                  .replace(/Mesa |Table |Box |Booth /, "")
                                  .split(" · ")[0]
                              }
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}

                <div className="mt-6 flex items-start gap-3.5 rounded-md border border-accent-border bg-accent-soft p-4 text-sm leading-relaxed text-muted-foreground">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-accent">
                    <Info className="size-4 text-rose" weight="duotone" />
                  </span>
                  <p>
                    <strong className="text-foreground">
                      {t("table.depositTitle")}
                    </strong>{" "}
                    {t("table.depositDescription")}
                  </p>
                </div>
              </>
            ) : null}

            {/* ===== R2 · Detalles ===== */}
            {step === 1 && mesa ? (
              <>
                <h2 className="mb-6 font-heading text-xl font-extrabold">
                  {t("details.title")}
                </h2>
                <div className="space-y-5 rounded-lg border bg-card p-6">
                  <div className="flex flex-col gap-2">
                    <Label>{t("details.eventDate")}</Label>
                    <div className="flex h-[46px] items-center gap-2.5 rounded-md border bg-white/[0.02] px-3.5 text-sm text-muted-foreground">
                      <CalendarBlank
                        className="size-4 text-rose"
                        weight="duotone"
                      />
                      {t("event.date")} · {EVENTO_DEMO.time}
                      <span className="ml-auto flex items-center gap-1 text-[11px]">
                        <Lock className="size-3" /> {t("details.fixedByEvent")}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label>{t("details.arrival")}</Label>
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LLEGADAS_DEMO.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="rw-size">{t("details.groupSize")}</Label>
                      <div className="flex h-[46px] items-center gap-3.5 rounded-md border bg-white/[0.04] px-3.5">
                        <input
                          id="rw-size"
                          type="range"
                          min={2}
                          max={mesa.cap}
                          value={size}
                          onChange={(e) => setSize(Number(e.target.value))}
                          className="flex-1 accent-primary"
                        />
                        <span className="min-w-14 text-right text-sm font-bold">
                          {t("people", { count: size })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("details.maximum", { count: mesa.cap })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rw-host">{t("details.host")}</Label>
                    <Input
                      id="rw-host"
                      value={host}
                      onChange={(e) => {
                        setHost(e.target.value);
                        if (e.target.value.trim()) setHostError("");
                      }}
                      placeholder={t("details.hostPlaceholder")}
                      autoComplete="name"
                      required
                      aria-invalid={Boolean(hostError)}
                      aria-describedby={hostError ? "rw-host-error" : undefined}
                    />
                    {hostError ? (
                      <p
                        id="rw-host-error"
                        className="text-sm text-destructive"
                        role="alert"
                      >
                        {hostError}
                      </p>
                    ) : null}
                  </div>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border p-3.5 transition-colors",
                      birthday
                        ? "border-accent-border bg-accent-soft"
                        : "bg-white/[0.02]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={birthday}
                      onChange={(e) => setBirthday(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-bold">
                        <Cake className="size-4 text-rose" weight="duotone" />{" "}
                        {t("details.birthday")}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t("details.birthdayHint")}
                      </span>
                    </span>
                    {birthday ? (
                      <Badge variant="warning">
                        🎂 {t("details.birthdayBadge")}
                      </Badge>
                    ) : null}
                  </label>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rw-notes">{t("details.notes")}</Label>
                    <Textarea
                      id="rw-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("details.notesPlaceholder")}
                    />
                  </div>
                </div>
              </>
            ) : null}

            {/* ===== R3 · Botellas ===== */}
            {step === 2 ? (
              <>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <h2 className="font-heading text-xl font-extrabold">
                    {t("bottles.title")}
                  </h2>
                  {/* Borde visible en vez de subrayado: define los límites del
                      botón y mantiene el lenguaje del DS (ghost/outline). */}
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-sm border border-accent-border px-3 py-1.5 text-sm font-bold text-rose transition-colors hover:bg-accent-soft"
                  >
                    {t("bottles.skip")} →
                  </button>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t("bottles.description")}
                </p>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {BOTELLAS_DEMO.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        "flex gap-3.5 rounded-md border bg-card p-3.5 transition-colors",
                        (cart[b.id] ?? 0) > 0 &&
                          "border-accent-border bg-[var(--accent-soft-faint)]",
                      )}
                    >
                      <div className="rv-img-ph h-[86px] w-20 shrink-0 rounded-sm">
                        <span>{t(`bottles.items.${b.id}.brand`)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="rv-eyebrow">
                          {t(`bottles.items.${b.id}.brand`)}
                        </p>
                        <p className="mt-0.5 text-sm font-bold">
                          {t(`bottles.items.${b.id}.name`)}
                        </p>
                        {b.promo ? (
                          <Badge variant="success" className="mt-1.5">
                            🎁 {t(`bottles.items.${b.id}.promo`)}
                          </Badge>
                        ) : null}
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[15px] font-extrabold">
                            {money(b.price)}
                          </span>
                          <QtyStepper
                            value={cart[b.id] ?? 0}
                            onChange={(d) => setQty(b.id, d)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {/* ===== R4 · Resumen (sin pago real) ===== */}
            {step === 3 && mesa ? (
              <>
                <h2 className="mb-6 font-heading text-xl font-extrabold">
                  {t("review.title")}
                </h2>
                <div className="space-y-4 rounded-lg border bg-card p-6 text-sm">
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">
                      {t("review.table")}
                    </span>
                    <strong>{tableLabel(mesa)}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">
                      {t("review.group")}
                    </span>
                    <strong>
                      {t("review.groupValue", { count: size, time })}
                    </strong>
                  </div>
                  {host ? (
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">
                        {t("review.host")}
                      </span>
                      <strong>{host}</strong>
                    </div>
                  ) : null}
                  {birthday ? (
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">
                        {t("review.birthday")}
                      </span>
                      <strong className="text-warning">
                        🎂 {t("review.yes")}
                      </strong>
                    </div>
                  ) : null}
                  {inCart.length > 0 ? (
                    <div className="border-b pb-3">
                      <p className="mb-2 text-muted-foreground">
                        {t("review.bottles")}
                      </p>
                      {inCart.map((b) => (
                        <div key={b.id} className="flex justify-between py-0.5">
                          <span>
                            {cart[b.id] ?? 0}× {t(`bottles.items.${b.id}.name`)}
                          </span>
                          <span>{money((cart[b.id] ?? 0) * b.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-start justify-between gap-4 text-base">
                    <span>
                      {t("review.advance", { percent: politica.adelantoPct })}
                    </span>
                    <strong className="shrink-0 tabular-nums">
                      {money(desglose.adelanto)}
                    </strong>
                  </div>
                  <div className="flex items-start justify-between gap-4 text-base">
                    <span>
                      <span className="block text-success">
                        {t("review.credit", {
                          percent: politica.splitConsumoPct,
                        })}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t("review.creditHint")}
                      </span>
                    </span>
                    <strong className="shrink-0 tabular-nums text-success">
                      {money(desglose.creditoConsumo)}
                    </strong>
                  </div>
                  {desglose.comisionServicio > 0 ? (
                    <div className="flex items-start justify-between gap-4 text-base">
                      <span>{t("review.serviceFee")}</span>
                      <strong className="shrink-0 tabular-nums">
                        {money(desglose.comisionServicio)}
                      </strong>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t pt-3 font-heading text-lg font-extrabold">
                    <span>{t("review.total")}</span>
                    <span className="tabular-nums">
                      {money(desglose.adelanto)}
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex items-start gap-3 rounded-md border border-info-border bg-info-soft p-4 text-sm leading-relaxed text-info">
                  <Info className="mt-0.5 size-4 shrink-0" weight="duotone" />
                  <p>{t("review.demoNotice")}</p>
                </div>
              </>
            ) : null}
          </div>

          {/* ===== Sidebar por paso ===== */}
          <SummaryCard>
            {mesa ? (
              <>
                <p className="text-sm font-bold">{tableLabel(mesa)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("summary.capacity", {
                    count: mesa.cap,
                    amount: money(mesa.min),
                  })}
                </p>
                <div className="my-3.5 space-y-1.5 border-y py-3.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("summary.deposit")}
                    </span>
                    <strong>{money(mesa.deposit)}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t("summary.appliedToSpend")}</span>
                    <span>{money(mesa.deposit)}</span>
                  </div>
                  {bottlesTotal > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("summary.bottles")}
                      </span>
                      <strong>{money(bottlesTotal)}</strong>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground">
                {t("summary.selectTable")}
              </p>
            )}
            {step === 3 ? (
              <Button className="w-full" onClick={confirmarReserva}>
                {t("confirm")} <Check className="size-4" />
              </Button>
            ) : (
              <Button className="w-full" disabled={!mesa} onClick={continuar}>
                {t("continue")} <ArrowRight className="size-4" />
              </Button>
            )}
            {step > 0 ? (
              <Button
                variant="secondary"
                className="mt-2 w-full"
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft className="size-4" /> {t("back")}
              </Button>
            ) : null}
          </SummaryCard>
        </div>
      )}
    </div>
  );
}
