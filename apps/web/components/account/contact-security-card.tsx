"use client";

import { EnvelopeSimple, Phone } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  changePhoneSchema,
  IDENTITY_ERROR_CODES,
  requestEmailChangeSchema,
  type ChangePhoneDto,
  type RequestEmailChangeDto,
} from "@urnight/contracts";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  NumericField,
  Skeleton,
} from "@urnight/ui";
import { PasswordInput } from "@/components/auth/password-input";
import { useMe } from "@/lib/api/auth/hooks";
import { ApiError } from "@/lib/api/client";
import {
  getErrorMessage,
  type ErrorMessageTranslator,
} from "@/lib/api/error-messages";
import { queryKeys } from "@/lib/api/query-keys";
import { changePhone, requestEmailChange } from "@/lib/api/users";

type EmailStep = "form" | "confirm" | "sent";

export function ContactSecurityCard() {
  const t = useTranslations("account.security.contact");
  const authErrors = useTranslations("auth.errors");
  const { data: session } = useSession();
  const profileQuery = useMe();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? "";
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<EmailStep>("form");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailErrors, setEmailErrors] = useState<{
    email?: string;
    password?: string;
    api?: string;
  }>({});
  const [emailPending, setEmailPending] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [phoneErrors, setPhoneErrors] = useState<{
    phone?: string;
    password?: string;
    api?: string;
  }>({});
  const [phonePending, setPhonePending] = useState(false);
  const translateError = ((key) => authErrors(key)) satisfies ErrorMessageTranslator;

  function resetEmailDialog() {
    setEmailStep("form");
    setNewEmail("");
    setEmailPassword("");
    setEmailErrors({});
  }

  function resetPhoneDialog() {
    setPhone("");
    setPhonePassword("");
    setPhoneErrors({});
  }

  function apiErrorMessage(error: unknown): string {
    if (
      error instanceof ApiError &&
      error.code === IDENTITY_ERROR_CODES.INVALID_CREDENTIALS
    ) {
      return t("errors.invalidPassword");
    }
    return getErrorMessage(error, translateError);
  }

  function reviewEmailChange() {
    const parsed = requestEmailChangeSchema.safeParse({
      newEmail,
      currentPassword: emailPassword,
    });
    if (!parsed.success) {
      const paths = new Set(parsed.error.issues.map((issue) => issue.path[0]));
      setEmailErrors({
        email: paths.has("newEmail") ? t("errors.invalidEmail") : undefined,
        password: paths.has("currentPassword")
          ? t("errors.passwordRequired")
          : undefined,
      });
      return;
    }
    setNewEmail(parsed.data.newEmail);
    setEmailErrors({});
    setEmailStep("confirm");
  }

  async function submitEmailChange() {
    if (!profileQuery.data || !token) return;
    const dto: RequestEmailChangeDto = {
      newEmail,
      currentPassword: emailPassword,
    };
    setEmailPending(true);
    setEmailErrors({});
    try {
      await requestEmailChange(dto, token);
      setEmailStep("sent");
    } catch (error) {
      setEmailErrors({ api: apiErrorMessage(error) });
    } finally {
      setEmailPending(false);
    }
  }

  async function submitPhoneChange() {
    if (!token) return;
    const parsed = changePhoneSchema.safeParse({
      phone,
      currentPassword: phonePassword,
    });
    if (!parsed.success) {
      const paths = new Set(parsed.error.issues.map((issue) => issue.path[0]));
      setPhoneErrors({
        phone: paths.has("phone") ? t("errors.invalidPhone") : undefined,
        password: paths.has("currentPassword")
          ? t("errors.passwordRequired")
          : undefined,
      });
      return;
    }

    setPhonePending(true);
    setPhoneErrors({});
    try {
      await changePhone(parsed.data satisfies ChangePhoneDto, token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      toast.success(t("phone.success"));
      setPhoneOpen(false);
      resetPhoneDialog();
    } catch (error) {
      setPhoneErrors({ api: apiErrorMessage(error) });
    } finally {
      setPhonePending(false);
    }
  }

  if (profileQuery.isPending) {
    return (
      <Card aria-busy="true" aria-label={t("loading")}>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("loadError")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => profileQuery.refetch()}>
            {t("retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const profile = profileQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <EnvelopeSimple className="size-5 text-rose" weight="duotone" />
            <Badge variant={profile.emailVerified ? "success" : "secondary"}>
              {profile.emailVerified ? t("email.verified") : t("email.unverified")}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("email.label")}</p>
            <p className="mt-1 break-all font-semibold">{profile.email}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
            {t("email.change")}
          </Button>
        </div>

        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <Phone className="size-5 text-rose" weight="duotone" />
          <div>
            <p className="text-sm text-muted-foreground">{t("phone.label")}</p>
            <p className="mt-1 font-semibold">{profile.phone ?? t("phone.notSet")}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPhoneOpen(true)}>
            {t("phone.change")}
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={emailOpen}
        onOpenChange={(open) => {
          if (emailPending) return;
          setEmailOpen(open);
          if (!open) resetEmailDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("email.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {emailStep === "confirm"
                ? t("email.confirmation", {
                    currentEmail: profile.email,
                    newEmail,
                  })
                : emailStep === "sent"
                  ? t("email.sentDescription", { email: newEmail })
                  : t("email.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          {emailErrors.api ? (
            <Alert variant="destructive">
              <AlertDescription>{emailErrors.api}</AlertDescription>
            </Alert>
          ) : null}
          {emailStep === "form" ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                reviewEmailChange();
              }}
              noValidate
            >
              <div className="space-y-2">
                <Label htmlFor="security-new-email">{t("email.newEmail")}</Label>
                <Input
                  id="security-new-email"
                  type="email"
                  autoComplete="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  aria-invalid={Boolean(emailErrors.email)}
                />
                {emailErrors.email ? (
                  <p className="text-sm text-destructive" role="alert">
                    {emailErrors.email}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="security-email-password">{t("password")}</Label>
                <PasswordInput
                  id="security-email-password"
                  autoComplete="current-password"
                  value={emailPassword}
                  onChange={(event) => setEmailPassword(event.target.value)}
                  aria-invalid={Boolean(emailErrors.password)}
                />
                {emailErrors.password ? (
                  <p className="text-sm text-destructive" role="alert">
                    {emailErrors.password}
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEmailOpen(false);
                    resetEmailDialog();
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit">{t("continue")}</Button>
              </DialogFooter>
            </form>
          ) : emailStep === "confirm" ? (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmailStep("form")} disabled={emailPending}>
                {t("back")}
              </Button>
              <Button type="button" onClick={() => void submitEmailChange()} disabled={emailPending}>
                {emailPending ? t("sending") : t("email.sendLink")}
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setEmailOpen(false);
                  resetEmailDialog();
                }}
              >
                {t("done")}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={phoneOpen}
        onOpenChange={(open) => {
          if (phonePending) return;
          setPhoneOpen(open);
          if (!open) resetPhoneDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("phone.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("phone.dialogDescription")}</DialogDescription>
          </DialogHeader>
          {phoneErrors.api ? (
            <Alert variant="destructive">
              <AlertDescription>{phoneErrors.api}</AlertDescription>
            </Alert>
          ) : null}
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitPhoneChange();
            }}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="security-phone">{t("phone.newPhone")}</Label>
              <NumericField
                id="security-phone"
                autoComplete="tel-national"
                value={phone}
                maxDigits={9}
                onValueChange={setPhone}
                aria-invalid={Boolean(phoneErrors.phone)}
              />
              {phoneErrors.phone ? (
                <p className="text-sm text-destructive" role="alert">
                  {phoneErrors.phone}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-phone-password">{t("password")}</Label>
              <PasswordInput
                id="security-phone-password"
                autoComplete="current-password"
                value={phonePassword}
                onChange={(event) => setPhonePassword(event.target.value)}
                aria-invalid={Boolean(phoneErrors.password)}
              />
              {phoneErrors.password ? (
                <p className="text-sm text-destructive" role="alert">
                  {phoneErrors.password}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPhoneOpen(false);
                  resetPhoneDialog();
                }}
                disabled={phonePending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={phonePending}>
                {phonePending ? t("saving") : t("phone.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
