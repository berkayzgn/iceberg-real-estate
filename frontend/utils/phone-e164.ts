export function nationalDigitsOnly(input: string): string {
  return input.replace(/\D/g, "");
}

export function buildE164Phone(dialCode: string, nationalInput: string): string {
  const dial = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  const n = nationalDigitsOnly(nationalInput);
  return `${dial}${n}`;
}
