export function formatDateForLocale(dateStr: string, lng: string) {
  const d = new Date(dateStr);
  const locale = lng === 'tr' ? 'tr-TR' : 'en-GB';
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}
