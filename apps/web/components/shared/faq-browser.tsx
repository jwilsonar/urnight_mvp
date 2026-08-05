"use client";

import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger } from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";

const CATEGORIES = ["all", "purchases", "reservations", "account"] as const;
type FaqCategory = (typeof CATEGORIES)[number];
type FaqItem = {
  category: Exclude<FaqCategory, "all">;
  question: string;
  answer: string;
};

function normalize(value: string, locale: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase(locale);
}

function FaqList({
  category,
  query,
  faqs,
  locale,
}: {
  category: FaqCategory;
  query: string;
  faqs: FaqItem[];
  locale: string;
}) {
  const t = useTranslations("faq.browser");
  const normalizedQuery = normalize(query.trim(), locale);
  const results = faqs.filter((faq) => {
    const inCategory = category === "all" || faq.category === category;
    const searchableText = normalize(`${faq.question} ${faq.answer}`, locale);
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
        <p className="mt-3 font-heading font-bold">{t("empty.title")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("empty.description")}
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
  const t = useTranslations("faq.browser");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const faqs = t.raw("items") as FaqItem[];

  return (
    <Reveal>
      <div className="relative">
        <label htmlFor="faq-search" className="sr-only">
          {t("searchLabel")}
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
          placeholder={t("searchPlaceholder")}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="all" className="mt-5">
        <TabsList
          className="grid h-auto w-full grid-cols-4"
          aria-label={t("categoriesAria")}
        >
          {CATEGORIES.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="px-2 text-xs sm:text-sm"
            >
              {t(`categories.${category}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((category) => (
          <TabsContent key={category} value={category} className="mt-6">
            <FaqList
              category={category}
              query={query}
              faqs={faqs}
              locale={locale}
            />
          </TabsContent>
        ))}
      </Tabs>
    </Reveal>
  );
}
