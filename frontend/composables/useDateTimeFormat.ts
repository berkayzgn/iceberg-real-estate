export function useDateTimeFormat() {
  const { t, locale } = useI18n();

  function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr);
    const loc = locale.value === "tr" ? "tr-TR" : "en-GB";
    return d.toLocaleDateString(loc, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function timeAgo(dateStr: string): string {
    void locale.value;
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return String(t("time.justNow"));
    if (diff < 3600) {
      return String(t("time.minutesAgo", { n: Math.floor(diff / 60) }));
    }
    if (diff < 86400) {
      return String(t("time.hoursAgo", { n: Math.floor(diff / 3600) }));
    }
    if (diff < 604800) {
      return String(t("time.daysAgo", { n: Math.floor(diff / 86400) }));
    }
    return formatDateShort(dateStr);
  }

  return { formatDateShort, timeAgo };
}
