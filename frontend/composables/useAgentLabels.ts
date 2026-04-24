import {
  AGENT_SPEC_KEYS,
  AGENT_TITLE_KEYS,
  canonicalSpecKey,
  canonicalTitleKey,
  type AgentSpecKey,
  type AgentTitleKey,
} from "~/utils/agent-labels";

export function useAgentLabels() {
  const { t } = useI18n();

  function formatTitle(stored: string): string {
    const key = canonicalTitleKey(stored);
    if (AGENT_TITLE_KEYS.includes(key as AgentTitleKey))
      return t(`agents.titles.${key}`);
    return stored;
  }

  function formatSpecialization(stored: string): string {
    const key = canonicalSpecKey(stored);
    if (AGENT_SPEC_KEYS.includes(key as AgentSpecKey))
      return t(`agents.specializations.${key}`);
    return stored;
  }

  function groupKeyForTitle(stored: string): string {
    return canonicalTitleKey(stored);
  }

  return { formatTitle, formatSpecialization, groupKeyForTitle };
}
