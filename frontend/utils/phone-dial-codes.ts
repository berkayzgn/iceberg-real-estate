import type { Composer } from "vue-i18n";

export type PhoneDialOption = {
  dial: string;
  country: string;
};

export const PHONE_DIAL_OPTIONS: PhoneDialOption[] = [
  { dial: "+90", country: "turkey" },
  { dial: "+1", country: "usCanada" },
  { dial: "+44", country: "uk" },
  { dial: "+49", country: "germany" },
  { dial: "+33", country: "france" },
  { dial: "+39", country: "italy" },
  { dial: "+34", country: "spain" },
  { dial: "+31", country: "netherlands" },
  { dial: "+32", country: "belgium" },
  { dial: "+43", country: "austria" },
  { dial: "+41", country: "switzerland" },
  { dial: "+46", country: "sweden" },
  { dial: "+47", country: "norway" },
  { dial: "+45", country: "denmark" },
  { dial: "+48", country: "poland" },
  { dial: "+40", country: "romania" },
  { dial: "+359", country: "bulgaria" },
  { dial: "+30", country: "greece" },
  { dial: "+357", country: "cyprus" },
  { dial: "+994", country: "azerbaijan" },
  { dial: "+972", country: "israel" },
  { dial: "+971", country: "uae" },
  { dial: "+966", country: "saudiArabia" },
  { dial: "+7", country: "russiaKazakhstan" },
  { dial: "+380", country: "ukraine" },
  { dial: "+86", country: "china" },
  { dial: "+81", country: "japan" },
  { dial: "+82", country: "southKorea" },
  { dial: "+91", country: "india" },
  { dial: "+61", country: "australia" },
];

export function formatDialOptionLabel(
  opt: PhoneDialOption,
  t: Composer["t"],
): string {
  return `${t(`dialCountry.${opt.country}`)} (${opt.dial})`;
}
