import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@urnight/ui";
import { Reveal } from "@/components/shared/reveal";

interface ConversionStat {
  value: string;
  label: string;
}

interface ConversionBenefit {
  icon: ReactNode;
  label: string;
}

interface ConversionSplitProps {
  eyebrow: string;
  title: string;
  description: string;
  stats: readonly ConversionStat[];
  benefits: readonly ConversionBenefit[];
  formTitle: string;
  formDescription: ReactNode;
  children: ReactNode;
}

/** Hero de conversión compartido para locales y promotores. */
export function ConversionSplit({
  eyebrow,
  title,
  description,
  stats,
  benefits,
  formTitle,
  formDescription,
  children,
}: ConversionSplitProps) {
  return (
    <section className="un-hero-glow border-b">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="un-eyebrow">{eyebrow}</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-y py-6 text-sm text-muted-foreground">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-heading text-3xl font-extrabold text-foreground">
                    {stat.value}
                  </dd>
                  <dt className="mt-1 leading-snug">{stat.label}</dt>
                </div>
              ))}
            </dl>

            <ul className="mt-10 space-y-4" aria-label="Beneficios">
              {benefits.map((benefit) => (
                <li key={benefit.label} className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-accent-border bg-accent text-lavender">
                    {benefit.icon}
                  </span>
                  <span className="pt-1.5 text-sm font-medium leading-relaxed sm:text-base">
                    {benefit.label}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="lg:sticky lg:top-24">
            <Card className="border-accent-border/60">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">
                  {formTitle}
                </CardTitle>
                <CardDescription>{formDescription}</CardDescription>
              </CardHeader>
              <CardContent>{children}</CardContent>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
