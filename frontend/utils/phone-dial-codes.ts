/** Country / region calling codes for agent phone entry (E.164 prefix). */
export type PhoneDialOption = {
  dial: string;
  nameTr: string;
  nameEn: string;
};

export const PHONE_DIAL_OPTIONS: PhoneDialOption[] = [
  { dial: "+90", nameTr: "Türkiye", nameEn: "Turkey" },
  { dial: "+1", nameTr: "ABD / Kanada", nameEn: "United States / Canada" },
  { dial: "+44", nameTr: "Birleşik Krallık", nameEn: "United Kingdom" },
  { dial: "+49", nameTr: "Almanya", nameEn: "Germany" },
  { dial: "+33", nameTr: "Fransa", nameEn: "France" },
  { dial: "+39", nameTr: "İtalya", nameEn: "Italy" },
  { dial: "+34", nameTr: "İspanya", nameEn: "Spain" },
  { dial: "+31", nameTr: "Hollanda", nameEn: "Netherlands" },
  { dial: "+32", nameTr: "Belçika", nameEn: "Belgium" },
  { dial: "+43", nameTr: "Avusturya", nameEn: "Austria" },
  { dial: "+41", nameTr: "İsviçre", nameEn: "Switzerland" },
  { dial: "+46", nameTr: "İsveç", nameEn: "Sweden" },
  { dial: "+47", nameTr: "Norveç", nameEn: "Norway" },
  { dial: "+45", nameTr: "Danimarka", nameEn: "Denmark" },
  { dial: "+48", nameTr: "Polonya", nameEn: "Poland" },
  { dial: "+40", nameTr: "Romanya", nameEn: "Romania" },
  { dial: "+359", nameTr: "Bulgaristan", nameEn: "Bulgaria" },
  { dial: "+30", nameTr: "Yunanistan", nameEn: "Greece" },
  { dial: "+357", nameTr: "Kıbrıs", nameEn: "Cyprus" },
  { dial: "+994", nameTr: "Azerbaycan", nameEn: "Azerbaijan" },
  { dial: "+972", nameTr: "İsrail", nameEn: "Israel" },
  { dial: "+971", nameTr: "BAE", nameEn: "United Arab Emirates" },
  { dial: "+966", nameTr: "Suudi Arabistan", nameEn: "Saudi Arabia" },
  { dial: "+7", nameTr: "Rusya / Kazakistan", nameEn: "Russia / Kazakhstan" },
  { dial: "+380", nameTr: "Ukrayna", nameEn: "Ukraine" },
  { dial: "+86", nameTr: "Çin", nameEn: "China" },
  { dial: "+81", nameTr: "Japonya", nameEn: "Japan" },
  { dial: "+82", nameTr: "Güney Kore", nameEn: "South Korea" },
  { dial: "+91", nameTr: "Hindistan", nameEn: "India" },
  { dial: "+61", nameTr: "Avustralya", nameEn: "Australia" },
];

export function phoneDialLabel(opt: PhoneDialOption, locale: string): string {
  const name = locale === "tr" ? opt.nameTr : opt.nameEn;
  return `${name} (${opt.dial})`;
}
