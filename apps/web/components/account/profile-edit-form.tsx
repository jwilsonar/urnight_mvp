"use client";

import { UploadSimple, UserCircle } from "@phosphor-icons/react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button, Input, Label } from "@urnight/ui";
import { StorageImage } from "@/lib/storage/storage-context";

const STORAGE_KEY = "ravenue:profile-draft";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

interface ProfileEditFormProps {
  initialEmail: string;
  initialPhone: string;
  initialImage?: string | null;
}

export function ProfileEditForm({
  initialEmail,
  initialPhone,
  initialImage,
}: ProfileEditFormProps) {
  const t = useTranslations("account.profile.form");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const profile = JSON.parse(stored) as { email?: string; phone?: string };
      if (profile.email) setEmail(profile.email);
      if (profile.phone !== undefined) setPhone(profile.phone);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function selectPhoto(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error(t("imageTypeError"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("imageSizeError"));
      return;
    }
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const nextErrors: { email?: string; phone?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) nextErrors.email = t("emailError");
    if (cleanPhone && cleanPhone.length < 6) {
      nextErrors.phone = t("phoneError");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ email: cleanEmail, phone: cleanPhone }),
    );
    toast.success(t("success"));
  }

  return (
    <form className="space-y-5 border-t pt-5" onSubmit={save} noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-accent-border bg-accent">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={t("previewAlt")}
              className="h-full w-full object-cover"
            />
          ) : initialImage ? (
            <StorageImage
              src={initialImage}
              alt={t("currentAlt")}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <UserCircle
              className="h-full w-full p-5 text-muted-foreground"
              weight="duotone"
            />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{t("photo")}</p>
          <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="profile-photo" className="cursor-pointer">
              <UploadSimple className="size-4" /> {t("choosePhoto")}
            </label>
          </Button>
          <input
            id="profile-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => selectPhoto(event.target.files?.[0])}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-email">{t("email")}</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (event.target.value.trim()) {
                setErrors((current) => ({ ...current, email: undefined }));
              }
            }}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "profile-email-error" : undefined}
            required
          />
          {errors.email ? (
            <p
              id="profile-email-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.email}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">{t("phone")}</Label>
          <Input
            id="profile-phone"
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setErrors((current) => ({ ...current, phone: undefined }));
            }}
            autoComplete="tel"
            placeholder="+51 999 999 999"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "profile-phone-error" : undefined}
          />
          {errors.phone ? (
            <p
              id="profile-phone-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <Button type="submit">{t("save")}</Button>
    </form>
  );
}
