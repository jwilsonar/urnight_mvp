'use client';

import * as React from 'react';
import { Input, type InputProps } from './input';

export interface NumericFieldProps
  extends Omit<InputProps, 'type' | 'inputMode' | 'pattern' | 'onChange'> {
  maxDigits?: number;
  onValueChange: (value: string) => void;
}

export const NumericField = React.forwardRef<HTMLInputElement, NumericFieldProps>(
  ({ maxDigits, onValueChange, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      onChange={(event) => {
        const digits = event.currentTarget.value.replace(/\D/g, '');
        onValueChange(maxDigits ? digits.slice(0, maxDigits) : digits);
      }}
    />
  ),
);
NumericField.displayName = 'NumericField';
