"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginDto } from "@urnight/contracts";
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@urnight/ui";
import { loginAction } from "@/lib/auth-actions";
import { toBaseLocale } from "@/lib/i18n/config";
import { zodErrorMapEn } from "@/lib/validation/zod-en";
import { zodErrorMapEs } from "@/lib/validation/zod-es";

export function LoginForm({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const t = useTranslations("login.form");
  const locale = toBaseLocale(useLocale());
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginDto>({
    // path/async completan el tipo ParseParams del resolver (runtime solo usa
    // errorMap para traducir los mensajes por defecto de Zod).
    resolver: zodResolver(loginSchema, {
      errorMap: locale === "en" ? zodErrorMapEn : zodErrorMapEs,
      path: [],
      async: true,
    }),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginDto) {
    setFormError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.ok) {
        setFormError(result.error ?? t("errors.loginFailed"));
        for (const [field, messages] of Object.entries(
          result.fieldErrors ?? {},
        )) {
          form.setError(field as keyof LoginDto, {
            message: messages[0] ?? t("errors.invalidField"),
          });
        }
        return;
      }
      // Navegación dura a propósito (igual que RegisterForm): un router.push +
      // refresh solo re-renderiza server components, y los client components
      // con useSession (navbar, favoritos) se quedaban mostrando "invitado"
      // hasta un F5 manual. El reload completo rehidrata la sesión en todos.
      window.location.assign(callbackUrl);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Form>
  );
}
