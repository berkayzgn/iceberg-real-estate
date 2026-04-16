import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@propex.co');
  const [password, setPassword] = useState('propex2026');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const ok = login(email, password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError(t('login.invalidCredentials'));
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: '#0A1628' }}
    >
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="dark" />
      </div>
      {/* Background gradients */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #D4A853 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-[420px]">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #D4A853, #F0C26A, #D4A853)' }} />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{ backgroundColor: '#D4A853' }}
              >
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-[#0A1628] text-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {t('login.title')}
              </h1>
              <p className="text-[#64748B] text-sm mt-1 text-center">
                {t('login.subtitle')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0A1628] mb-1.5">
                  {t('login.email')}
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-[#0A1628] text-sm bg-[#FAFBFC] focus:outline-none focus:border-[#D4A853] focus:ring-2 focus:ring-[#D4A853]/20 transition-all"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0A1628] mb-1.5">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-[#E2E8F0] text-[#0A1628] text-sm bg-[#FAFBFC] focus:outline-none focus:border-[#D4A853] focus:ring-2 focus:ring-[#D4A853]/20 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                    aria-label={showPw ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[#64748B] cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  {t('login.rememberMe')}
                </label>
                <button type="button" className="text-[#D4A853] font-medium hover:underline">
                  {t('login.forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: '#D4A853' }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t('login.signingIn')}</>
                ) : (
                  t('login.signIn')
                )}
              </button>
            </form>

            {/* Hint */}
            <p className="text-center text-xs text-[#94A3B8] mt-6">
              {t('login.demoHint')}
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
