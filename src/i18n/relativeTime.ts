import type { TFunction } from 'i18next';

export function relativeTimeFromNow(iso: string, t: TFunction, formatDate: (d: string) => string) {
  const now = new Date();
  const d = new Date(iso);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return t('time.justNow');
  if (diff < 3600) return t('time.minutesAgo', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('time.hoursAgo', { count: Math.floor(diff / 3600) });
  if (diff < 604800) return t('time.daysAgo', { count: Math.floor(diff / 86400) });
  return formatDate(iso);
}
