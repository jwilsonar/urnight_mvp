export function autoSubmitOtpCode(
  digits: readonly string[],
  lastSubmittedCode: string | null,
  blocked: boolean,
): string | null {
  if (blocked || digits.length !== 6 || digits.some((digit) => !/^\d$/.test(digit))) {
    return null;
  }
  const code = digits.join("");
  return code === lastSubmittedCode ? null : code;
}

export function secondsUntil(isoDate: string, now = Date.now()): number {
  const target = Date.parse(isoDate);
  if (!Number.isFinite(target)) return 0;
  return Math.max(0, Math.ceil((target - now) / 1000));
}
