# ADR 0008 — Roadmap de autenticación multifactor

- **Estado:** Propuesto
- **Fecha:** 2026-07-30
- **Contexto:** Endurecimiento futuro del acceso a cuentas RAVENUE

## Estado actual

La ruta web `/2fa` es una demostración visual: presenta seis campos numéricos,
avance por teclado y un mensaje que alude a un código enviado al teléfono. No
valida códigos ni está conectada al API. Identity no tiene enrolamiento MFA,
secretos TOTP, desafíos OTP, códigos de recuperación, políticas por rol ni
persistencia del segundo factor. Por tanto, MFA no protege hoy ningún inicio de
sesión y la pantalla no debe presentarse como una garantía activa.

## Decisión de producto y seguridad

La primera opción será **TOTP** mediante una aplicación autenticadora. Evita
depender de cobertura móvil, correo o un proveedor de SMS, y ofrece una base
adecuada para administradores. El email OTP podrá añadirse después como factor
de recuperación o alternativa de menor seguridad. SMS queda en último lugar por
su costo, dependencia externa y exposición a SIM swapping.

Cada enrolamiento deberá incluir:

- secreto TOTP cifrado en reposo y nunca devuelto después de confirmarlo;
- verificación de un primer código antes de activar MFA;
- diez códigos de recuperación de un solo uso, almacenados con hash;
- revocación y regeneración con reautenticación reciente;
- rate-limit, bloqueo temporal y auditoría de enrolamiento, uso y recuperación.

MFA será obligatorio para `super_admin` y `admin_local`. Se habilitará después
para `promoter` y `validator`, y será optativo para cuentas consumidoras. La
sesión solo se emitirá tras completar el desafío cuando la cuenta lo requiera.

## Orden sugerido

1. Modelar puertos, casos de uso y persistencia de TOTP y recovery codes en
   Identity, con pruebas unitarias y e2e.
2. Implementar enrolamiento, confirmación, desafío de login y revocación.
3. Exigir TOTP a `super_admin`; medir soporte y recuperación.
4. Extender la obligación a `admin_local` y luego evaluar roles operativos.
5. Añadir email OTP como recuperación controlada y evaluar SMS solo si existe
   una necesidad de negocio validada.

## Consecuencia

La ruta `/2fa` seguirá marcada como demo hasta que el API emita y valide
desafíos reales. Este ADR no autoriza una implementación parcial ni almacenar
secretos o códigos en el navegador.

## Contrato de implementación

El **cómo** derivado de esta decisión —tablas, puertos, casos de uso, endpoints,
errores y límites— vive en [`docs/spec-mfa-identity.md`](../spec-mfa-identity.md),
pendiente de revisión. Dos preguntas quedan abiertas ahí y necesitan decisión
antes de implementar: qué ocurre con las cuentas de panel ya existentes que aún
no tienen MFA, y quién puede desbloquear a alguien que perdió el dispositivo y
sus códigos de recuperación.
