"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import {
  DOCUMENT_TYPES,
  MIN_BIRTH_DATE,
  documentRuleFor,
  maxAdultBirthDate,
  refineDocumentPair,
  registerObjectSchema,
  type RegisterDto,
} from "@urnight/contracts";
import { toBaseLocale } from "@/lib/i18n/config";
import { zodErrorMapEn } from "@/lib/validation/zod-en";
import { zodErrorMapEs } from "@/lib/validation/zod-es";
import {
  Alert,
  AlertDescription,
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@urnight/ui";
import { PasswordInput } from "@/components/auth/password-input";
import { registerAction } from "@/lib/auth-actions";

/** Deja solo dígitos y quita el prefijo país 51 si viene pegado. */
function nationalDigits(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 11 && d.startsWith("51") ? d.slice(2) : d;
}

/**
 * Recorta y limpia según el tipo de documento. El largo sale de DOCUMENT_RULES,
 * así que un CE deja de admitir 20 caracteres solo porque no es DNI. Se opera
 * sobre texto para no perder los ceros iniciales de un DNI como 04483215.
 */
function sanitizeDocument(
  raw: string,
  documentType: (typeof DOCUMENT_TYPES)[number],
): string {
  const rule = documentRuleFor(documentType);
  const cleaned = rule.digitsOnly
    ? raw.replace(/\D/g, "")
    : raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return cleaned.slice(0, rule.maxLength);
}

/**
 * Schema del FORMULARIO (no del contrato). Endurece el teléfono respecto a
 * contracts —que lo deja opcional min(6)— porque, por ahora, la UX lo trata
 * como obligatorio y los celulares en Perú son de 9 dígitos. El resto de reglas
 * las hereda de `registerSchema` (source of truth). El valor que se envía al API
 * sigue siendo un string válido para su regla min(6)-max(20).
 */
function createRegisterFormSchema(
  t: ReturnType<typeof useTranslations<"register.form">>,
) {
  return registerObjectSchema
    .extend({
      password: z
        .string()
        .min(8, t("errors.passwordLength"))
        .max(72, t("errors.passwordLong"))
        .regex(/[A-Z]/, t("errors.passwordUppercase"))
        .regex(/[a-z]/, t("errors.passwordLowercase"))
        .regex(/\d/, t("errors.passwordNumber"))
        .regex(/[^A-Za-z0-9\s]/, t("errors.passwordSymbol")),
      documentNumber: z.string().trim(),
      phone: z
        .string()
        .trim()
        .min(1, t("errors.phoneRequired"))
        .regex(/^9\d{8}$/, t("errors.phone")),
    })
    .superRefine((values, context) => {
      // La regla la pone el contrato (DOCUMENT_RULES), no este formulario: el
      // largo real de un CE o un pasaporte no es el de un DNI, y tenerlo escrito
      // en dos sitios garantizaba que se separaran.
      const rule = documentRuleFor(values.documentType);
      refineDocumentPair(
        values,
        context,
        values.documentType === "dni"
          ? t("errors.dni")
          : t("errors.documentLength", {
              min: rule.minLength,
              max: rule.maxLength,
            }),
      );
    });
}

export function RegisterForm({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const t = useTranslations("register.form");
  const locale = toBaseLocale(useLocale());
  const registerFormSchema = useMemo(() => createRegisterFormSchema(t), [t]);
  const maxBirthDate = useMemo(() => maxAdultBirthDate(), []);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  // Nombres y apellidos separados (feedback): permitirá comparar contra el
  // documento en la validación de identidad. El API recibe fullName compuesto.
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");

  const form = useForm<
    z.input<typeof registerFormSchema>,
    unknown,
    z.output<typeof registerFormSchema>
  >({
    resolver: zodResolver(registerFormSchema, {
      errorMap: locale === "en" ? zodErrorMapEn : zodErrorMapEs,
      path: [],
      async: true,
    }),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      birthDate: "",
      documentType: "dni",
      documentNumber: "",
      phone: "",
      acceptsMarketing: false,
    },
  });

  // El error de fullName lo dispara el submit; marcamos en rojo el subcampo
  // vacío que lo causó.
  const fullNameError = Boolean(form.formState.errors.fullName);
  const nombresError = fullNameError && nombres.trim() === "";
  const apellidosError = fullNameError && apellidos.trim() === "";
  const documentType = form.watch("documentType");

  function onSubmit(values: z.output<typeof registerFormSchema>) {
    setFormError(null);
    // Se envía el número normalizado a 9 dígitos (nacional), válido para el
    // contrato (min 6, max 20).
    const payload: RegisterDto = {
      ...values,
      phone: nationalDigits(values.phone ?? ""),
    };
    startTransition(async () => {
      const result = await registerAction(payload);
      if (!result.ok) {
        setFormError(result.error ?? t("errors.createFailed"));
        for (const [field, messages] of Object.entries(
          result.fieldErrors ?? {},
        )) {
          form.setError(field as keyof RegisterDto, {
            message: messages[0] ?? t("errors.invalidField"),
          });
        }
        return;
      }
      // Recarga completa: garantiza que header y SessionProvider tomen la
      // sesión nueva (con router.push quedaba visualmente "como invitado").
      window.location.assign(callbackUrl);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          // Compone fullName desde los dos campos antes de que valide el schema.
          form.setValue(
            "fullName",
            `${nombres.trim()} ${apellidos.trim()}`.trim(),
          );
          void form.handleSubmit(onSubmit)(event);
        }}
        className="space-y-4"
        noValidate
      >
        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {/* Campos separados; se componen en fullName antes de validar/enviar.
            Como no son campos RHF, el error de `fullName` no los pinta solo:
            marcamos en rojo el que esté vacío cuando el submit falla. */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="reg-nombres">{t("firstName")}</Label>
            <Input
              id="reg-nombres"
              autoComplete="given-name"
              placeholder={t("firstNamePlaceholder")}
              value={nombres}
              onChange={(event) => setNombres(event.target.value)}
              aria-invalid={nombresError}
              className={cn(
                nombresError &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-apellidos">{t("lastName")}</Label>
            <Input
              id="reg-apellidos"
              autoComplete="family-name"
              placeholder={t("lastNamePlaceholder")}
              value={apellidos}
              onChange={(event) => setApellidos(event.target.value)}
              aria-invalid={apellidosError}
              className={cn(
                apellidosError &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
          </div>
        </div>
        {form.formState.errors.fullName ? (
          <p className="text-sm font-medium text-destructive">
            {nombresError || apellidosError
              ? t("errors.fullNameRequired")
              : (form.formState.errors.fullName.message ??
                t("errors.fullName"))}
          </p>
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
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>{t("passwordHelper")}</FormDescription>
              <FormMessage role="alert" aria-live="polite" />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem className="w-full sm:max-w-[14rem]">
                <FormLabel>{t("birthDate")}</FormLabel>
                <FormControl>
                  {/* max/min bloquean en el propio calendario las fechas que
                      el esquema rechazaría después: nada futuro y nada de
                      menores de 18. Así el error no llega a ocurrir. */}
                  <Input
                    type="date"
                    autoComplete="bday"
                    max={maxBirthDate}
                    min={MIN_BIRTH_DATE}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("birthDateHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="w-full sm:max-w-[14rem]">
                <FormLabel>{t("phone")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="9XX XXX XXX"
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(
                        nationalDigits(event.target.value).slice(0, 9),
                      )
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>{t("phoneHint")}</FormDescription>
                <FormMessage role="alert" aria-live="polite" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("documentType")}</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    const nextDocumentType =
                      value as (typeof DOCUMENT_TYPES)[number];
                    field.onChange(nextDocumentType);
                    form.setValue(
                      "documentNumber",
                      sanitizeDocument(
                        form.getValues("documentNumber"),
                        nextDocumentType,
                      ),
                    );
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("documentTypePlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`documentTypes.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("documentNumber")}</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode={documentType === "dni" ? "numeric" : "text"}
                    autoComplete="off"
                    placeholder={t("documentNumberPlaceholder")}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(
                        sanitizeDocument(event.target.value, documentType),
                      )
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage role="alert" aria-live="polite" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="acceptsMarketing"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              </FormControl>
              <FormLabel className="font-normal leading-snug text-muted-foreground">
                {t("marketing")}
              </FormLabel>
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
