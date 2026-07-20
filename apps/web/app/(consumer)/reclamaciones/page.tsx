"use client";

/* Libro de Reclamaciones (obligatorio en Perú; enlazado desde el footer del
   prototipo). Demo frontend-only: el registro real del reclamo llega con el
   backend de soporte. */

import { BookOpen, Check } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
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
} from "@urnight/ui";

export default function ReclamacionesPage() {
  const [tipo, setTipo] = useState("reclamo");
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-success-border bg-success-soft">
          <Check className="size-9 text-success" weight="bold" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">
          Hoja registrada
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Tu {tipo} quedó registrado con el código{" "}
          <strong className="text-foreground">LR-2026-000123</strong>. Recibirás
          respuesta en un máximo de 15 días hábiles al correo indicado.
        </p>
        <div className="mt-4">
          <Badge variant="info">
            Demo — el registro real llega con el backend de soporte
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="rv-eyebrow flex items-center gap-2">
        <BookOpen className="size-4" weight="duotone" /> Ayuda
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Libro de Reclamaciones
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
        Conforme al Código de Protección y Defensa del Consumidor (Ley N.º
        29571), registra aquí tu queja o reclamo sobre los servicios de RAVENUE.
      </p>

      <form
        onSubmit={submit}
        className="mt-9 space-y-5 rounded-lg border bg-card p-6"
        aria-describedby="reclamaciones-required"
      >
        <p
          id="reclamaciones-required"
          className="text-sm text-muted-foreground"
        >
          Todos los campos son obligatorios.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lr-tipo">Tipo de solicitud</Label>
            <Select value={tipo} onValueChange={setTipo} name="tipo" required>
              <SelectTrigger id="lr-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reclamo">
                  Reclamo (producto o servicio)
                </SelectItem>
                <SelectItem value="queja">
                  Queja (atención al cliente)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lr-doc">Documento de identidad</Label>
            <Input id="lr-doc" required placeholder="DNI / CE" />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lr-nombre">Nombre completo</Label>
            <Input id="lr-nombre" required placeholder="Tu nombre" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lr-email">Correo electrónico</Label>
            <Input
              id="lr-email"
              type="email"
              required
              placeholder="tu@correo.com"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lr-detalle">Detalle del reclamo o queja</Label>
          <Textarea
            id="lr-detalle"
            required
            placeholder="Cuéntanos qué pasó, incluyendo fecha, evento o local si aplica…"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge variant="info">Demo — sin backend de soporte aún</Badge>
          <Button type="submit">Registrar hoja</Button>
        </div>
      </form>
    </div>
  );
}
