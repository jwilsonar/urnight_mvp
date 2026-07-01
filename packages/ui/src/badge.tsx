import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from './lib/cn';

/*
 * Pills de estado del DS: fill tintado + borde suave + foreground legible,
 * radio pill (reservado a chips/tags/badges). Tonos semánticos completos.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
  {
    variants: {
      variant: {
        default: 'border-accent-border bg-accent text-lavender',
        secondary: 'border-border bg-white/5 text-muted-foreground',
        destructive: 'border-error-border bg-error-soft text-error-fg',
        outline: 'text-foreground',
        success: 'border-success-border bg-success-soft text-success-fg',
        warning: 'border-warning-border bg-warning-soft text-warning-fg',
        info: 'border-info-border bg-info-soft text-info-fg',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
