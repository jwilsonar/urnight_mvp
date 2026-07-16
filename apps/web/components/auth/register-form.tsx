'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DOCUMENT_TYPES, registerSchema, type RegisterDto } from '@urnight/contracts';
import { zodErrorMapEs } from '@/lib/validation/zod-es';
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
} from '@urnight/ui';
import { registerAction } from '@/lib/auth-actions';

const DOCUMENT_LABELS: Record<(typeof DOCUMENT_TYPES)[number], string> = {
  dni: 'DNI',
  ce: 'Carné de extranjería',
  passport: 'Pasaporte',
};

/** Deja solo dígitos y quita el prefijo país 51 si viene pegado. */
function nationalDigits(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d.length === 11 && d.startsWith('51') ? d.slice(2) : d;
}

/**
 * Schema del FORMULARIO (no del contrato). Endurece el teléfono respecto a
 * contracts —que lo deja opcional min(6)— porque, por ahora, la UX lo trata
 * como obligatorio y los celulares en Perú son de 9 dígitos. El resto de reglas
 * las hereda de `registerSchema` (source of truth). El valor que se envía al API
 * sigue siendo un string válido para su regla min(6)-max(20).
 */
const registerFormSchema = registerSchema.extend({
  phone: z
    .string()
    .trim()
    .min(1, 'Ingresa tu número de celular.')
    .refine((v) => /^9\d{8}$/.test(nationalDigits(v)), 'El celular debe tener 9 dígitos y empezar con 9.'),
});
type RegisterFormInput = z.input<typeof registerFormSchema>;
type RegisterFormOutput = z.output<typeof registerFormSchema>;

export function RegisterForm({ callbackUrl = '/' }: { callbackUrl?: string }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  // Nombres y apellidos separados (feedback): permitirá comparar contra el
  // documento en la validación de identidad. El API recibe fullName compuesto.
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');

  const form = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerFormSchema, { errorMap: zodErrorMapEs, path: [], async: true }),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      birthDate: '',
      documentType: 'dni',
      documentNumber: '',
      phone: '',
      acceptsMarketing: false,
    },
  });

  // El error de fullName lo dispara el submit; marcamos en rojo el subcampo
  // vacío que lo causó.
  const fullNameError = Boolean(form.formState.errors.fullName);
  const nombresError = fullNameError && nombres.trim() === '';
  const apellidosError = fullNameError && apellidos.trim() === '';

  function onSubmit(values: RegisterFormOutput) {
    setFormError(null);
    // Se envía el número normalizado a 9 dígitos (nacional), válido para el
    // contrato (min 6, max 20).
    const payload: RegisterDto = { ...values, phone: nationalDigits(values.phone ?? '') };
    startTransition(async () => {
      const result = await registerAction(payload);
      if (!result.ok) {
        setFormError(result.error ?? 'No pudimos crear tu cuenta.');
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(field as keyof RegisterDto, { message: messages[0] ?? 'Dato inválido' });
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
          form.setValue('fullName', `${nombres.trim()} ${apellidos.trim()}`.trim());
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
              className={cn(nombresError && 'border-destructive focus-visible:ring-destructive')}
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
              className={cn(apellidosError && 'border-destructive focus-visible:ring-destructive')}
            />
          </div>
        </div>
        {form.formState.errors.fullName ? (
          <p className="text-sm font-medium text-destructive">
            {nombresError || apellidosError
              ? 'Nombres y apellidos son obligatorios.'
              : (form.formState.errors.fullName.message ?? 'Ingresa tus nombres y apellidos.')}
          </p>
        ) : null}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="tu@correo.com" {...field} />
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
                <Input type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" {...field} />
              </FormControl>
              <FormDescription>
                Usa al menos 8 caracteres. Te recomendamos combinar letras y números.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de nacimiento</FormLabel>
              <FormControl>
                <Input type="date" autoComplete="bday" {...field} />
              </FormControl>
              <FormDescription>Debes ser mayor de 18 años.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Documento</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
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
                  <Input inputMode="numeric" placeholder="Documento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Celular</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9XX XXX XXX"
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>9 dígitos, empieza con 9.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptsMarketing"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value ?? false} onCheckedChange={(checked) => field.onChange(checked === true)} />
              </FormControl>
              <FormLabel className="font-normal leading-snug text-muted-foreground">
                Quiero recibir novedades y promociones por correo.
              </FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>
    </Form>
  );
}
