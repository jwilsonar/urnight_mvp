"use client";

import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";

const CATEGORIES = ["Todas", "Compras", "Reservas", "Cuenta"] as const;

/** Las seis preguntas originales, clasificadas para navegación por pestañas. */
const FAQS = [
  {
    category: "Compras",
    question: "¿Cómo compro una entrada?",
    answer:
      "Elige el evento, selecciona el tipo de entrada y la cantidad, ingresa tus datos y paga de forma segura. Recibirás tu QR en “Mis entradas”.",
  },
  {
    category: "Reservas",
    question: "¿Puedo reservar una mesa?",
    answer:
      "Sí. En el detalle del local o evento elige “Reservar mesa”, selecciona la zona, paga el depósito y recibe tu confirmación con QR.",
  },
  {
    category: "Compras",
    question: "¿Cómo funciona el ingreso con QR?",
    answer:
      "Muestra el código QR de tu entrada o reserva en la puerta del local. Es único e intransferible.",
  },
  {
    category: "Compras",
    question: "¿Puedo cancelar una compra?",
    answer:
      "Las cancelaciones dependen de la política de cada evento. Encuentra la opción en el detalle de tu entrada o reserva.",
  },
  {
    category: "Cuenta",
    question: "¿Por qué piden mi documento?",
    answer:
      "RAVENUE es solo para mayores de 18 años. Validamos tu documento automáticamente por la seguridad de la comunidad.",
  },
  {
    category: "Cuenta",
    question: "¿Cómo afilio mi local?",
    answer:
      "Ingresa a “Afiliar mi local”, completa los datos de tu negocio y nuestro equipo revisará tu solicitud.",
  },
] as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function FaqList({
  category,
  query,
}: {
  category: (typeof CATEGORIES)[number];
  query: string;
}) {
  const normalizedQuery = normalize(query.trim());
  const results = FAQS.filter((faq) => {
    const inCategory = category === "Todas" || faq.category === category;
    const searchableText = normalize(`${faq.question} ${faq.answer}`);
    return inCategory && searchableText.includes(normalizedQuery);
  });

  if (results.length === 0) {
    return (
      <div
        role="status"
        className="rounded-lg border bg-card px-5 py-10 text-center"
      >
        <MagnifyingGlass
          className="mx-auto size-7 text-rose"
          weight="duotone"
          aria-hidden
        />
        <p className="mt-3 font-heading font-bold">
          No encontramos esa pregunta
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Prueba con otra palabra o revisa una categoría diferente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-live="polite">
      {results.map((faq, index) => (
        <Reveal key={faq.question} delay={index * 50}>
          <details className="group rounded-md border bg-card transition-colors open:border-accent-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              {faq.question}
              <CaretDown className="size-4 shrink-0 text-rose transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </details>
        </Reveal>
      ))}
    </div>
  );
}

/** Búsqueda y categorías cliente; el acordeón conserva details/summary nativo. */
export function FaqBrowser() {
  const [query, setQuery] = useState("");

  return (
    <Reveal>
      <div className="relative">
        <label htmlFor="faq-search" className="sr-only">
          Buscar una pregunta
        </label>
        <MagnifyingGlass
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="faq-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busca una pregunta…"
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="Todas" className="mt-5">
        <TabsList
          className="grid h-auto w-full grid-cols-4"
          aria-label="Categorías de preguntas"
        >
          {CATEGORIES.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-2 text-xs sm:text-sm"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <FaqList category={category} query={query} />
          </TabsContent>
        ))}
      </Tabs>
    </Reveal>
  );
}
