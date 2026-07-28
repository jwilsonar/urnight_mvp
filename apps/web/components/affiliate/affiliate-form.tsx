"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import {
  submitAffiliationSchema,
  type AffiliationResponse,
  type SubmitAffiliationDto,
} from "@urnight/contracts";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from "@urnight/ui";
import { submitAffiliation } from "@/lib/api/companies";
import { useApiMutation } from "@/lib/api/use-api-mutation";

/** Limpia strings opcionales vacíos a undefined (no enviar campos en blanco). */
function blank(value?: string): string | undefined {
  return value && value.trim() ? value : undefined;
}

/** El API admite estos datos vacíos, pero el formulario público los necesita para dar seguimiento. */
function createAffiliateFormSchema(
  t: ReturnType<typeof useTranslations<"affiliate.form">>,
) {
  return submitAffiliationSchema.extend({
    commercialName: z
      .string()
      .trim()
      .min(2, t("errors.commercialName"))
      .max(200),
    legalName: z.string().trim().min(2, t("errors.legalName")).max(200),
    ruc: z.string().regex(/^\d{11}$/, t("errors.ruc")),
    address: z.string().trim().min(1, t("errors.address")).max(255),
    contactName: z.string().trim().min(1, t("errors.contactName")).max(160),
    contactEmail: z
      .string()
      .trim()
      .min(1, t("errors.contactEmail"))
      .email(t("errors.email"))
      .max(160),
    contactPhone: z
      .string()
      .trim()
      .min(6, t("errors.contactPhone"))
      .max(20, t("errors.phoneLong")),
    termsAccepted: z.preprocess(
      (value) => value,
      z.literal(true, {
        errorMap: () => ({ message: t("errors.termsAccepted") }),
      }),
    ),
    legalDeclarationAccepted: z.preprocess(
      (value) => value,
      z.literal(true, {
        errorMap: () => ({ message: t("errors.legalDeclarationAccepted") }),
      }),
    ),
  });
}

type AffiliateFormValues = z.output<
  ReturnType<typeof createAffiliateFormSchema>
>;

/** Formulario público de solicitud de afiliación (POST /affiliation-requests). */
export function AffiliateForm() {
  const t = useTranslations("affiliate.form");
  const affiliateFormSchema = useMemo(() => createAffiliateFormSchema(t), [t]);
  const [submitted, setSubmitted] = useState<AffiliationResponse | null>(null);
  const [legalAttempted, setLegalAttempted] = useState(false);

  const form = useForm<
    z.input<typeof affiliateFormSchema>,
    unknown,
    AffiliateFormValues
  >({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: {
      legalName: "",
      ruc: "",
      commercialName: "",
      address: "",
      socials: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      termsAccepted: false,
      legalDeclarationAccepted: false,
    },
  });
  const termsAccepted = form.watch("termsAccepted") === true;
  const legalDeclarationAccepted =
    form.watch("legalDeclarationAccepted") === true;
  const legalReady = termsAccepted && legalDeclarationAccepted;

  const mutation = useApiMutation({
    mutationFn: (values: SubmitAffiliationDto) => submitAffiliation(values),
    setError: form.setError,
    successMessage: t("successToast"),
    onSuccess: (affiliation) => setSubmitted(affiliation),
  });

  function onSubmit(values: AffiliateFormValues) {
    const payload = submitAffiliationSchema.parse({
      ...values,
      socials: blank(values.socials),
    });
    mutation.mutate(payload);
  }

  function revealLegalErrors() {
    setLegalAttempted(true);
    void form
      .trigger(["termsAccepted", "legalDeclarationAccepted"])
      .then(() => {
        form.setFocus(
          termsAccepted ? "legalDeclarationAccepted" : "termsAccepted",
        );
      });
  }

  if (submitted) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>{t("successTitle")}</AlertTitle>
        <AlertDescription>
          {t.rich("successDescription", {
            venue: submitted.commercialName,
            status: t(`status.${submitted.status}`),
            strong: (chunks: React.ReactNode) => (
              <span className="font-medium">{chunks}</span>
            ),
          })}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          if (!legalReady) {
            event.preventDefault();
            revealLegalErrors();
            return;
          }
          void form.handleSubmit(onSubmit)(event);
        }}
        className="space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="commercialName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("commercialName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("commercialNamePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="legalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("legalName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("legalNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ruc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("ruc")}</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  placeholder={t("rucPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("address")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("addressPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contact")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("contactPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("phone")}</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+51 9XX XXX XXX"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="socials"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("socials")}{" "}
                <span className="text-muted-foreground">{t("optional")}</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder={t("socialsPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>{t("socialsHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex min-h-[5.75rem] flex-row items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    className="mt-1"
                    checked={field.value === true}
                    onCheckedChange={(checked) => {
                      field.onChange(checked === true);
                      if (legalAttempted) {
                        void form.trigger("termsAccepted");
                      }
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <div className="min-w-0 flex-1">
                  <FormLabel className="block min-h-[5.75rem] cursor-pointer font-normal leading-relaxed text-muted-foreground">
                    {t.rich("legal.termsConsent", {
                      terms: (chunks) => (
                        <Link
                          href="/legal/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground underline underline-offset-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {chunks}
                        </Link>
                      ),
                      privacy: (chunks) => (
                        <Link
                          href="/legal/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground underline underline-offset-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="legalDeclarationAccepted"
            render={({ field }) => (
              <FormItem className="flex min-h-[5.75rem] flex-row items-start gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    className="mt-1"
                    checked={field.value === true}
                    onCheckedChange={(checked) => {
                      field.onChange(checked === true);
                      if (legalAttempted) {
                        void form.trigger("legalDeclarationAccepted");
                      }
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <div className="min-w-0 flex-1">
                  <FormLabel className="block min-h-[5.75rem] cursor-pointer font-normal leading-relaxed text-muted-foreground">
                    {t("legal.declaration")}
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          disabled={mutation.isPending}
          aria-disabled={!legalReady}
        >
          {mutation.isPending ? t("sending") : t("submit")}
        </Button>
      </form>
    </Form>
  );
}
