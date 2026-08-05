"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@urnight/ui";

export const EMPTY_OTP_DIGITS = ["", "", "", "", "", ""] as const;

interface OtpCodeInputProps {
  digits: readonly string[];
  onChange: (digits: string[]) => void;
  digitLabel: (position: number) => string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpCodeInput({
  digits,
  onChange,
  digitLabel,
  disabled = false,
  autoFocus = false,
}: OtpCodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function fillFrom(index: number, raw: string) {
    const pasted = raw.replace(/\D/g, "").slice(0, 6 - index);
    if (!pasted) return;
    const next = Array.from({ length: 6 }, (_, position) =>
      digits[position] ?? "",
    );
    for (const [offset, digit] of [...pasted].entries()) {
      next[index + offset] = digit;
    }
    onChange(next);
    refs.current[Math.min(index + pasted.length, 5)]?.focus();
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    fillFrom(index, event.clipboardData.getData("text"));
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-1.5 sm:gap-3">
      {Array.from({ length: 6 }, (_, index) => {
        const value = digits[index] ?? "";
        return (
          <input
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={value}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw.length > 1) {
                fillFrom(index, raw);
                return;
              }
              if (!/^\d?$/.test(raw)) return;
              const next = Array.from({ length: 6 }, (_, position) =>
                digits[position] ?? "",
              );
              next[index] = raw;
              onChange(next);
              if (raw && index < 5) refs.current[index + 1]?.focus();
            }}
            onPaste={(event) => handlePaste(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onFocus={(event) => event.currentTarget.select()}
            maxLength={1}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={digitLabel(index + 1)}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            className={cn(
              "h-12 w-9 rounded-md border-2 bg-background text-center font-heading text-xl font-extrabold outline-none transition-colors sm:h-16 sm:w-[52px] sm:text-2xl",
              value ? "border-accent-border" : "border-input",
              "focus-visible:border-accent-border focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        );
      })}
    </div>
  );
}
