"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, Input, Label, Textarea } from "@urnight/ui";

const CONTACT_EMAIL = "soporte@ravenue.pe";

type ContactErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

export function ContactForm() {
  const t = useTranslations("contacto.form");
  const [errors, setErrors] = useState<ContactErrors>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const nextErrors: ContactErrors = {};

    if (name.length < 2) nextErrors.name = t("errors.name");
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = t("errors.email");
    if (subject.length < 3) nextErrors.subject = t("errors.subject");
    if (message.length < 10) nextErrors.message = t("errors.message");

    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      document.getElementById(`contact-${firstError}`)?.focus();
      return;
    }

    toast.success(t("success"));
    const body = `${t("mailName")}: ${name}\n${t("mailEmail")}: ${email}\n\n${message}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const fieldError = (field: keyof ContactErrors) =>
    errors[field] ? (
      <p
        id={`contact-${field}-error`}
        className="text-sm text-destructive"
        role="alert"
      >
        {errors[field]}
      </p>
    ) : null;

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">{t("name")}</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            required
          />
          {fieldError("name")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">{t("email")}</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            required
          />
          {fieldError("email")}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject">{t("subject")}</Label>
        <Input
          id="contact-subject"
          name="subject"
          aria-describedby={
            errors.subject ? "contact-subject-error" : undefined
          }
          aria-invalid={Boolean(errors.subject)}
          required
        />
        {fieldError("subject")}
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">{t("message")}</Label>
        <Textarea
          id="contact-message"
          name="message"
          className="min-h-36 resize-y"
          aria-describedby={
            errors.message ? "contact-message-error" : undefined
          }
          aria-invalid={Boolean(errors.message)}
          required
        />
        {fieldError("message")}
      </div>
      <Button type="submit" className="w-full sm:w-auto">
        {t("submit")}
      </Button>
    </form>
  );
}
