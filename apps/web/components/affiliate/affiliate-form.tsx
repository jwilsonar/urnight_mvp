"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "@phosphor-icons/react";
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
    },
  });

  const mutation = useApiMutation({
    mutationFn: (values: SubmitAffiliationDto) => submitAffiliation(values),
    setError: form.setError,
    successMessage: t("successToast"),
    onSuccess: (affiliation) => setSubmitted(affiliation),
  });

  function onSubmit(values: AffiliateFormValues) {
    mutation.mutate({
      ...values,
      socials: blank(values.socials),
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
        onSubmit={form.handleSubmit(onSubmit)}
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

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? t("sending") : t("submit")}
        </Button>
      </form>
    </Form>
  );
}
