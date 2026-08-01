import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./lib/cn";

/*
 * Variantes según DS RAVENUE: primary carmín, secondary con fill sutil +
 * hairline y outline neutro. Alturas 34/44/52 y radios 8/12/16 del DS.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-[background-color,border-color,color,box-shadow,transform] motion-safe:active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-glow active:bg-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-transparent text-foreground transition-[border-color,color,background-color] hover:border-[var(--accent-border-subtle)] hover:bg-[var(--accent-soft-faint)] hover:text-foreground",
        secondary:
          "border border-border bg-secondary text-secondary-foreground transition-[border-color,color,background-color] hover:border-[var(--accent-border-subtle)] hover:bg-[var(--accent-soft-faint)] hover:text-foreground active:bg-[var(--accent-soft)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-[var(--action-link)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-[34px] rounded-sm px-3.5 text-xs",
        lg: "h-13 rounded-lg px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
