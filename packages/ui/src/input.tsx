import * as React from 'react';
import { cn } from './lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        // Patrón .field del DS: 46px, fill suave, focus ring amatista pegado al borde.
        'flex h-[46px] w-full rounded-md border border-border bg-field px-3.5 py-2 text-sm transition-[border-color,box-shadow,background-color] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
