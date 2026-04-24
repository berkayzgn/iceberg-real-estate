export const AGENT_TITLE_KEYS = [
  "salesConsultant",
  "seniorSalesConsultant",
  "portfolioConsultant",
] as const;
export type AgentTitleKey = (typeof AGENT_TITLE_KEYS)[number];

export const LEGACY_TITLE_TO_KEY: Record<string, AgentTitleKey> = {
  "Satış Danışmanı": "salesConsultant",
  "Kıdemli Satış Danışmanı": "seniorSalesConsultant",
  "Portföy Danışmanı": "portfolioConsultant",
};

export const AGENT_SPEC_KEYS = [
  "residential",
  "luxury",
  "commercial",
  "leasing",
  "investment",
] as const;
export type AgentSpecKey = (typeof AGENT_SPEC_KEYS)[number];

export const LEGACY_SPEC_TO_KEY: Record<string, AgentSpecKey> = {
  Konut: "residential",
  "Lüks Konut": "luxury",
  Ticari: "commercial",
  Kiralama: "leasing",
  Yatırım: "investment",
};

export function canonicalTitleKey(stored: string): string {
  if (AGENT_TITLE_KEYS.includes(stored as AgentTitleKey)) return stored;
  return LEGACY_TITLE_TO_KEY[stored] ?? stored;
}

export function canonicalSpecKey(stored: string): string {
  if (AGENT_SPEC_KEYS.includes(stored as AgentSpecKey)) return stored;
  return LEGACY_SPEC_TO_KEY[stored] ?? stored;
}
