export function normalizeCommissionReasonKey(reason: string): string {
  if (
    reason === "same_agent" ||
    reason === "different_agents" ||
    reason === "fallback"
  ) {
    return reason;
  }
  if (/aynı kişi|Same agent handles/i.test(reason)) return "same_agent";
  if (/farklı|Listing and selling agents are different/i.test(reason)) {
    return "different_agents";
  }
  if (reason === "Varsayılan hesaplama") return "fallback";
  return "fallback";
}
