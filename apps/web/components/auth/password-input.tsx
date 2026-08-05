"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { forwardRef, useState, type ComponentProps } from "react";
import { Input, cn } from "@urnight/ui";

/**
 * Campo de contraseña con alternancia de visibilidad. El valor solo vive en el
 * input: alternar cambia el `type`, nunca copia ni guarda lo escrito.
 */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<typeof Input>, "type">
>(function PasswordInput({ className, ...props }, ref) {
  const t = useTranslations("common.password");
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((actual) => !actual)}
        aria-label={visible ? t("hide") : t("show")}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? (
          <EyeSlash className="size-4" weight="duotone" />
        ) : (
          <Eye className="size-4" weight="duotone" />
        )}
      </button>
    </div>
  );
});
