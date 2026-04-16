import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const locales = [
  { code: 'en' as const, label: 'EN' },
  { code: 'tr' as const, label: 'TR' },
];

type Variant = 'dark' | 'light';

export function LanguageSwitcher({
  compact = false,
  variant = 'dark',
}: {
  compact?: boolean;
  variant?: Variant;
}) {
  const { i18n, t } = useTranslation();
  const isDark = variant === 'dark';

  return (
    <div
      className={`flex items-center gap-1 rounded-lg border p-0.5 ${compact ? '' : 'px-1'} ${
        isDark ? 'border-white/10 bg-white/5' : 'border-[#E2E8F0] bg-[#FAFBFC]'
      }`}
      role="group"
      aria-label={t('layout.language')}
    >
      {!compact && (
        <Languages
          className={`w-3.5 h-3.5 ml-1 flex-shrink-0 hidden sm:block ${isDark ? 'text-white/40' : 'text-[#94A3B8]'}`}
        />
      )}
      {locales.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => void i18n.changeLanguage(code)}
          className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
            i18n.language === code
              ? 'bg-[#D4A853] text-white'
              : isDark
                ? 'text-white/50 hover:text-white/80'
                : 'text-[#64748B] hover:text-[#0A1628]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
