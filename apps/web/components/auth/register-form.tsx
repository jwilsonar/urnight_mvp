"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import {
  DOCUMENT_TYPES,
  registerSchema,
  type RegisterDto,
} from "@urnight/contracts";
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
import { registerAction } from "@/lib/auth-actions";

const DOCUMENT_LABELS: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  dni: "DNI",
  ce: "Carné de extranjería",
  passport: "Pasaporte",
};

/** Deja solo dígitos y quita el prefijo país 51 si viene pegado. */
function nationalDigits(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.length === 11 && d.startsWith("51") ? d.slice(2) : d;
}

function sanitizeDocument(
  raw: string,
  documentType: (typeof DOCUMENT_TYPES)[number],
): string {
  return documentType === "dni"
    ? raw.replace(/\D/g, "").slice(0, 8)
    : raw
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .slice(0, 20);
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
  return registerSchema
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
      const documentIsValid =
        values.documentType === "dni"
          ? /^\d{8}$/.test(values.documentNumber)
          : /^[A-Za-z0-9]{8,20}$/.test(values.documentNumber);

      if (!documentIsValid) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentNumber"],
          message:
            values.documentType === "dni"
              ? t("errors.dni")
              : t("errors.document"),
        });
      }
    });
}

export function RegisterForm({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const t = useTranslations("register.form");
  const registerFormSchema = useMemo(() => createRegisterFormSchema(t), [t]);
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
      errorMap: zodErrorMapEs,
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
        setFormError(result.error ?? "No pudimos crear tu cuenta.");
        for (const [field, messages] of Object.entries(
          result.fieldErrors ?? {},
        )) {
          form.setError(field as keyof RegisterDto, {
            message: messages[0] ?? "Dato inválido",
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
            <Label htmlFor="reg-nombres">Nombres</Label>
            <Input
              id="reg-nombres"
              autoComplete="given-name"
              placeholder="ej. Piero"
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
            <Label htmlFor="reg-apellidos">Apellidos</Label>
            <Input
              id="reg-apellidos"
              autoComplete="family-name"
              placeholder="ej. Rivera"
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
              ? "Nombres y apellidos son obligatorios."
              : (form.formState.errors.fullName.message ??
                "Ingresa tus nombres y apellidos.")}
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
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
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
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
                <FormLabel>Fecha de nacimiento</FormLabel>
                <FormControl>
                  <Input type="date" autoComplete="bday" {...field} />
                </FormControl>
                <FormDescription>Debes ser mayor de 18 años.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="w-full sm:max-w-[14rem]">
                <FormLabel>Celular</FormLabel>
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
                <FormLabel>Documento</FormLabel>
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
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DOCUMENT_LABELS[type]}
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
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode={documentType === "dni" ? "numeric" : "text"}
                    autoComplete="off"
                    placeholder="Documento"
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
                Quiero recibir novedades y promociones por correo.
              </FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>
    </Form>
  );
}
