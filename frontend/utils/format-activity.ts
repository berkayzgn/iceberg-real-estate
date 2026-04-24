import type { Composer } from "vue-i18n";
import type { ActivityEntry } from "~/utils/domain";

const SYSTEM_STAGE_NOTES = new Set([
  "Transaction created.",
  "Stage updated.",
  "Stage updated via board drag and drop.",
]);

export function formatActivityEntry(
  entry: ActivityEntry,
  t: Composer["t"],
): string {
  if (entry.type === "financial") {
    const key = entry.financialReasonKey;
    if (
      key === "same_agent" ||
      key === "different_agents" ||
      key === "fallback"
    ) {
      return String(t(`commission.reason.${key}`));
    }
    return String(t("commission.reason.fallback"));
  }
  if (entry.type === "stage_change") {
    const note = entry.note?.trim();
    if (note && !SYSTEM_STAGE_NOTES.has(note)) return note;
    if (entry.fromStage && entry.toStage && entry.fromStage === entry.toStage) {
      return String(t("activity.transactionCreated"));
    }
    if (entry.fromStage && entry.toStage) {
      return String(
        t("activity.stageChanged", {
          from: String(t(`stages.${entry.fromStage}`)),
          to: String(t(`stages.${entry.toStage}`)),
        }),
      );
    }
    return note ?? "";
  }
  return "";
}
