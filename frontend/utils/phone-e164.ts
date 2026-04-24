/** Strip to digits for national significant number input. */
export function nationalDigitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

/** Build E.164-style string (leading +, no spaces). */
export function buildE164Phone(dialCode: string, nationalInput: string): string {
  const dial = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  const n = nationalDigitsOnly(nationalInput);
  return `${dial}${n}`;
}
