import * as React from 'react';
import { cn } from './lib/cn';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        // Patrón .field del DS: fill suave, focus ring amatista pegado al borde.
        'flex min-h-20 w-full rounded-md border border-border bg-field px-3.5 py-2.5 text-sm transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
