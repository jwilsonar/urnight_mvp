'use client';

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
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';
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
} from '@urnight/ui';
import {
  BOTELLAS_DEMO,
  EVENTO_DEMO,
  LLEGADAS_DEMO,
  MESAS_DEMO,
  type MesaDemo,
} from '@/lib/mock/reservas';

const STEPS = ['Mesa', 'Detalles', 'Botellas', 'Resumen', 'Listo'];

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label="Progreso de la reserva">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2 sm:gap-3">
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-full border text-xs font-bold transition-colors',
              i < current
                ? 'border-primary bg-primary text-primary-foreground'
                : i === current
                  ? 'border-primary bg-accent text-lavender'
                  : 'border-border text-muted-foreground',
            )}
          >
            {i < current ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span
            className={cn(
              'hidden text-xs font-semibold sm:inline',
              i === current ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {label}
          </span>
          {i < STEPS.length - 1 ? <span className="h-px w-4 bg-border sm:w-8" /> : null}
        </li>
      ))}
    </ol>
  );
}

function QtyStepper({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center rounded-sm border bg-white/[0.04] p-0.5">
      <button
        type="button"
        aria-label="Quitar"
        onClick={() => onChange(-1)}
        className={cn('flex size-7 items-center justify-center rounded-[6px]', value > 0 ? 'text-foreground' : 'text-muted-foreground')}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-[13px] font-bold">{value}</span>
      <button
        type="button"
        aria-label="Agregar"
        onClick={() => onChange(1)}
        className={cn(
          'flex size-7 items-center justify-center rounded-[6px] text-foreground',
          value === 0 && 'bg-primary text-primary-foreground',
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function SummaryCard({ children }: { children: React.ReactNode }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-lg border bg-card p-5">
        <p className="un-eyebrow mb-3">Resumen</p>
        <div className="mb-3.5 flex gap-3 border-b pb-3.5">
          <div className="un-img-ph size-16 shrink-0 rounded-sm">
            <span>Evento</span>
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-bold">{EVENTO_DEMO.title}</p>
            <p className="text-xs text-muted-foreground">
              {EVENTO_DEMO.date} · {EVENTO_DEMO.time}
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
  const [step, setStep] = useState(0);
  const [view, setView] = useState<'lista' | 'planta'>('lista');
  const [mesa, setMesa] = useState<MesaDemo | null>(null);
  const [size, setSize] = useState(4);
  const [time, setTime] = useState('11:30 PM');
  const [birthday, setBirthday] = useState(false);
  const [host, setHost] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});

  const bottlesTotal = BOTELLAS_DEMO.reduce((sum, b) => sum + (cart[b.id] ?? 0) * b.price, 0);
  const inCart = BOTELLAS_DEMO.filter((b) => (cart[b.id] ?? 0) > 0);
  const setQty = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));

  function pickMesa(m: MesaDemo) {
    if (m.status === 'reserved') return;
    setMesa(m);
    setSize(Math.min(4, m.cap));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Cabecera del flujo: título + candado de reserva segura + stepper */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
          Reserva tu mesa
        </h1>
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Lock className="size-3.5" /> Reserva segura
          <Badge variant="info">Demo</Badge>
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
          <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">¡Mesa reservada!</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {mesa?.label} para {size} personas · llegada {time}. Presenta el código al ingresar:
          </p>
          <p className="mt-5 rounded-md border border-accent-border bg-accent px-6 py-4 font-mono text-2xl font-bold tracking-[0.2em] text-lavender">
            UR-DEMO-4821
          </p>
          <div className="mt-4">
            <Badge variant="info">Demo — la reserva real y el QR llegan con el backend</Badge>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/events">Ver más eventos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Volver al inicio</Link>
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
                  <h2 className="font-heading text-xl font-extrabold">Elige tu mesa</h2>
                  <div className="flex gap-1 rounded-md border bg-white/[0.04] p-1">
                    {(['lista', 'planta'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        className={cn(
                          'rounded-sm px-3.5 py-2 text-xs font-semibold capitalize transition-colors',
                          view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {v === 'planta' ? 'Vista de planta' : 'Lista'}
                      </button>
                    ))}
                  </div>
                </div>

                {view === 'lista' ? (
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {MESAS_DEMO.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={m.status === 'reserved'}
                        onClick={() => pickMesa(m)}
                        className={cn(
                          'overflow-hidden rounded-md border bg-card text-left transition-[border-color,box-shadow,opacity]',
                          mesa?.id === m.id && 'border-primary shadow-glow',
                          m.status === 'reserved' && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        <div className="un-img-ph h-[110px]">
                          <span>
                            {m.zone === 'Pista' ? 'Mesa · Pista' : m.zone === 'VIP' ? 'Box · VIP' : 'Lounge · Premium'}
                          </span>
                        </div>
                        <div className="p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="un-eyebrow">{m.zone}</p>
                              <p className="mt-0.5 text-[15px] font-bold">{m.label}</p>
                            </div>
                            {m.hot && m.status === 'available' ? (
                              <Badge variant="warning">{m.hot}</Badge>
                            ) : null}
                            {m.status === 'reserved' ? <Badge variant="outline">Reservada</Badge> : null}
                          </div>
                          <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="size-3" /> {m.cap} pax
                            </span>
                            <span>Mín. S/ {m.min}</span>
                            <span>Depósito S/ {m.deposit}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card p-5">
                    <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] border border-success-border bg-success-soft" /> Disponible
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] border border-warning-border bg-warning-soft" /> Pocas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] border bg-white/10" /> Reservada
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-[3px] bg-primary" /> Tu selección
                      </span>
                    </div>
                    <svg viewBox="0 0 600 400" className="w-full rounded-md border bg-[#0e0e1a]" role="img" aria-label="Plano del local">
                      <rect x="20" y="20" width="280" height="180" rx="8" fill="rgba(108,77,255,0.06)" stroke="rgba(108,77,255,0.2)" />
                      <text x="32" y="42" fill="rgba(184,168,255,0.7)" fontSize="11" fontWeight="700" letterSpacing="2">PISTA</text>
                      <rect x="320" y="20" width="260" height="180" rx="8" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.2)" />
                      <text x="332" y="42" fill="rgba(252,211,77,0.8)" fontSize="11" fontWeight="700" letterSpacing="2">BOX VIP</text>
                      <rect x="20" y="220" width="560" height="160" rx="8" fill="rgba(143,120,255,0.06)" stroke="rgba(143,120,255,0.2)" />
                      <text x="32" y="242" fill="rgba(184,168,255,0.7)" fontSize="11" fontWeight="700" letterSpacing="2">LOUNGE</text>
                      <text x="536" y="42" fill="rgba(160,160,176,0.8)" fontSize="10">⬆ Barra</text>
                      <text x="270" y="395" fill="rgba(160,160,176,0.8)" fontSize="10">⬇ Entrada principal</text>
                      {MESAS_DEMO.map((m) => {
                        const isSel = mesa?.id === m.id;
                        const fill = isSel
                          ? 'var(--color-primary)'
                          : m.status === 'reserved'
                            ? 'rgba(255,255,255,0.05)'
                            : m.hot
                              ? 'rgba(245,158,11,0.3)'
                              : 'rgba(34,197,94,0.3)';
                        const stroke = isSel
                          ? 'var(--text-accent)'
                          : m.status === 'reserved'
                            ? 'rgba(255,255,255,0.12)'
                            : m.hot
                              ? 'rgba(245,158,11,0.8)'
                              : 'rgba(34,197,94,0.8)';
                        return (
                          <g
                            key={m.id}
                            onClick={() => pickMesa(m)}
                            className={m.status === 'reserved' ? 'cursor-not-allowed' : 'cursor-pointer'}
                          >
                            <rect x={m.layout.x} y={m.layout.y} width={m.layout.w} height={m.layout.h} rx="6" fill={fill} stroke={stroke} strokeWidth="1.5" />
                            <text
                              x={m.layout.x + m.layout.w / 2}
                              y={m.layout.y + m.layout.h / 2 + 4}
                              textAnchor="middle"
                              fill="#fff"
                              fontSize="11"
                              fontWeight="700"
                            >
                              {(m.label.split(' · ')[0] ?? m.label).replace(/Mesa |Box /, '')}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}

                <div className="mt-6 flex items-start gap-3.5 rounded-md border border-accent-border bg-accent-soft p-4 text-sm leading-relaxed text-muted-foreground">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-accent">
                    <Info className="size-4 text-lavender" weight="duotone" />
                  </span>
                  <p>
                    <strong className="text-foreground">Tu depósito se descuenta del consumo en el local.</strong>{' '}
                    No es un cargo extra — si consumes más del mínimo, solo pagas la diferencia en caja.
                  </p>
                </div>
              </>
            ) : null}

            {/* ===== R2 · Detalles ===== */}
            {step === 1 && mesa ? (
              <>
                <h2 className="mb-6 font-heading text-xl font-extrabold">Detalles de tu reserva</h2>
                <div className="space-y-5 rounded-lg border bg-card p-6">
                  <div className="flex flex-col gap-2">
                    <Label>Fecha del evento</Label>
                    <div className="flex h-[46px] items-center gap-2.5 rounded-md border bg-white/[0.02] px-3.5 text-sm text-muted-foreground">
                      <CalendarBlank className="size-4 text-lavender" weight="duotone" />
                      {EVENTO_DEMO.date} · {EVENTO_DEMO.time}
                      <span className="ml-auto flex items-center gap-1 text-[11px]">
                        <Lock className="size-3" /> Fijada por el evento
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label>Hora estimada de llegada</Label>
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
                      <Label htmlFor="rw-size">Tamaño del grupo</Label>
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
                        <span className="min-w-14 text-right text-sm font-bold">{size} pax</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Máx. {mesa.cap} para esta mesa</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rw-host">Nombre del anfitrión (opcional)</Label>
                    <Input
                      id="rw-host"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="ej. Piero Rivera"
                    />
                  </div>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md border p-3.5 transition-colors',
                      birthday ? 'border-primary bg-accent-soft' : 'bg-white/[0.02]',
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
                        <Cake className="size-4 text-lavender" weight="duotone" /> Es mi cumpleaños
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        Avisamos al local — pueden tener una sorpresa preparada
                      </span>
                    </span>
                    {birthday ? <Badge variant="warning">🎂 Birthday</Badge> : null}
                  </label>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="rw-notes">Notas para el venue (opcional)</Label>
                    <Textarea
                      id="rw-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ej. Llegamos un poco tarde, tenemos un amigo alérgico al maní…"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {/* ===== R3 · Botellas ===== */}
            {step === 2 ? (
              <>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <h2 className="font-heading text-xl font-extrabold">Preventa de botellas</h2>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-sm font-bold text-lavender hover:underline"
                  >
                    Saltar →
                  </button>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  Aprovecha precios de preventa. Las dejan listas en tu mesa cuando llegues.
                </p>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {BOTELLAS_DEMO.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        'flex gap-3.5 rounded-md border bg-card p-3.5 transition-colors',
                        (cart[b.id] ?? 0) > 0 && 'border-primary',
                      )}
                    >
                      <div className="un-img-ph h-[86px] w-20 shrink-0 rounded-sm">
                        <span>{b.brand}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="un-eyebrow">{b.brand}</p>
                        <p className="mt-0.5 text-sm font-bold">{b.name}</p>
                        {b.promo ? (
                          <Badge variant="success" className="mt-1.5">
                            🎁 {b.promo}
                          </Badge>
                        ) : null}
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[15px] font-extrabold">S/ {b.price}</span>
                          <QtyStepper value={cart[b.id] ?? 0} onChange={(d) => setQty(b.id, d)} />
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
                <h2 className="mb-6 font-heading text-xl font-extrabold">Revisa tu reserva</h2>
                <div className="space-y-4 rounded-lg border bg-card p-6 text-sm">
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">Mesa</span>
                    <strong>{mesa.label}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-3">
                    <span className="text-muted-foreground">Grupo</span>
                    <strong>
                      {size} pax · llegada {time}
                    </strong>
                  </div>
                  {host ? (
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">Anfitrión</span>
                      <strong>{host}</strong>
                    </div>
                  ) : null}
                  {birthday ? (
                    <div className="flex justify-between border-b pb-3">
                      <span className="text-muted-foreground">Cumpleaños</span>
                      <strong className="text-warning">🎂 Sí</strong>
                    </div>
                  ) : null}
                  {inCart.length > 0 ? (
                    <div className="border-b pb-3">
                      <p className="mb-2 text-muted-foreground">Botellas en preventa</p>
                      {inCart.map((b) => (
                        <div key={b.id} className="flex justify-between py-0.5">
                          <span>
                            {cart[b.id] ?? 0}× {b.name}
                          </span>
                          <span>S/ {(cart[b.id] ?? 0) * b.price}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex justify-between text-base">
                    <span>Depósito (aplica a consumo)</span>
                    <strong>S/ {mesa.deposit}</strong>
                  </div>
                  {bottlesTotal > 0 ? (
                    <div className="flex justify-between text-base">
                      <span>Botellas</span>
                      <strong>S/ {bottlesTotal}</strong>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t pt-3 font-heading text-lg font-extrabold">
                    <span>Total al confirmar</span>
                    <span>S/ {mesa.deposit + bottlesTotal}</span>
                  </div>
                </div>
                <div className="mt-5 flex items-start gap-3 rounded-md border border-info-border bg-info-soft p-4 text-sm leading-relaxed text-info">
                  <Info className="mt-0.5 size-4 shrink-0" weight="duotone" />
                  <p>
                    Vista de demostración: el cobro del depósito se habilitará cuando exista el
                    backend de reservas. Confirmar no genera ningún cargo.
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {/* ===== Sidebar por paso ===== */}
          <SummaryCard>
            {mesa ? (
              <>
                <p className="text-sm font-bold">{mesa.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {mesa.cap} personas máx · Mínimo S/ {mesa.min}
                </p>
                <div className="my-3.5 space-y-1.5 border-y py-3.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depósito</span>
                    <strong>S/ {mesa.deposit}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Aplicable a consumo</span>
                    <span>S/ {mesa.deposit}</span>
                  </div>
                  {bottlesTotal > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Botellas</span>
                      <strong>S/ {bottlesTotal}</strong>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground">
                Selecciona una mesa para continuar.
              </p>
            )}
            {step === 3 ? (
              <Button className="w-full" onClick={() => setStep(4)}>
                Confirmar reserva <Check className="size-4" />
              </Button>
            ) : (
              <Button className="w-full" disabled={!mesa} onClick={() => setStep((s) => s + 1)}>
                Continuar <ArrowRight className="size-4" />
              </Button>
            )}
            {step > 0 ? (
              <Button variant="secondary" className="mt-2 w-full" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="size-4" /> Volver
              </Button>
            ) : null}
          </SummaryCard>
        </div>
      )}
    </div>
  );
}
