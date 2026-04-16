<script setup lang="ts">
definePageMeta({ layout: 'blank' });

const session = useSessionStore();
const { t } = useI18n();

const email = ref('admin@propex.co');
const password = ref('propex2026');
const showPw = ref(false);
const loading = ref(false);
const error = ref('');

const grainStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'repeat',
  backgroundSize: '200px 200px',
} as const;

const gridStyle = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
  backgroundSize: '60px 60px',
} as const;

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  await new Promise((r) => setTimeout(r, 900));
  const ok = session.login(email.value, password.value);
  loading.value = false;
  if (ok) {
    await navigateTo('/');
  } else {
    error.value = t('login.invalid');
  }
}
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
    style="background-color: #0a1628"
  >
    <div class="absolute right-4 top-4 z-20">
      <SharedLanguageSwitcher />
    </div>
    <!-- background gradients -->
    <div
      class="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full opacity-10"
      style="background: radial-gradient(circle, #D4A853 0%, transparent 70%); transform: translate(30%, -30%)"
    />
    <div
      class="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full opacity-5"
      style="background: radial-gradient(circle, #3B82F6 0%, transparent 70%); transform: translate(-30%, 30%)"
    />

    <!-- grain -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.03]"
      :style="grainStyle"
    />

    <!-- grid lines -->
    <div
      class="pointer-events-none absolute inset-0 opacity-[0.04]"
      :style="gridStyle"
    />

    <div class="relative w-full max-w-[420px]">
      <div class="overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div
          class="h-1 w-full"
          style="background: linear-gradient(90deg, #D4A853, #F0C26A, #D4A853)"
        />

        <div class="p-8">
          <div class="mb-8 flex flex-col items-center">
            <div
              class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
              style="background-color: #d4a853"
            >
              <span class="text-2xl font-bold text-white">P</span>
            </div>
            <h1
              class="text-center text-xl font-bold text-[#0A1628]"
              style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
            >
              {{ t('login.title') }}
            </h1>
            <p class="mt-1 text-center text-sm text-[#64748B]">
              {{ t('login.subtitle') }}
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-[#0A1628]">{{ t('login.email') }}</label>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="w-full rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] px-4 py-3 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
                placeholder="admin@propex.co"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-[#0A1628]">{{ t('login.password') }}</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPw ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  class="w-full rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] px-4 py-3 pr-11 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#64748B]"
                  :aria-label="showPw ? t('login.hide') : t('login.show')"
                  @click="showPw = !showPw"
                >
                  <span class="text-xs font-semibold">{{ showPw ? t('login.hide') : t('login.show') }}</span>
                </button>
              </div>
            </div>

            <div
              v-if="error"
              class="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600"
            >
              {{ error }}
            </div>

            <button
              type="submit"
              class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style="background-color: #d4a853"
              :disabled="loading"
            >
              <span v-if="loading">{{ t('login.submitting') }}</span>
              <span v-else>{{ t('login.submit') }}</span>
            </button>
          </form>

          <p class="mt-6 text-center text-xs text-[#94A3B8]">
            {{ t('login.hint') }}
          </p>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-white/20">
        PropEx • 2026
      </p>
    </div>
  </div>
</template>
