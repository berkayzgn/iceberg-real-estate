<script setup lang="ts">
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-vue-next";
import { toApiErrorInfo } from "~/utils/api-error";

definePageMeta({
  layout: false,
});

const { t, locale } = useI18n();
const auth = useAuthStore();
const toast = useToastStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const submitting = ref(false);
const loginError = ref<string | null>(null);

watch([email, password], () => {
  loginError.value = null;
});

useHead({
  title: () => `${t("login.title")} · ${t("brand.name")}`,
  htmlAttrs: { lang: () => (locale.value === "tr" ? "tr" : "en") },
});

onMounted(() => {
  auth.hydrateFromStorage();
  if (auth.token) navigateTo("/");
});

async function submit() {
  submitting.value = true;
  loginError.value = null;
  try {
    await auth.login(email.value.trim(), password.value);
    password.value = "";
    await navigateTo("/");
  } catch (error) {
    const err = toApiErrorInfo(error, t("login.invalid"));
    const unauthorized =
      err.statusCode === 401 ||
      /invalid email or password/i.test(err.message);
    const message = unauthorized ? t("login.invalid") : err.message;
    loginError.value = message;
    toast.error(message, t("login.errorTitle"));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-[#0A1628] px-4 py-12"
  >
    <div class="mb-8 flex items-center gap-3 text-white">
      <div
        class="flex h-11 w-11 items-center justify-center rounded-xl"
        style="background-color: #d4a853"
      >
        <Building2 class="h-6 w-6 text-white" />
      </div>
      <div>
        <p
          class="text-lg font-bold tracking-tight"
          style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          {{ t("brand.name") }}
        </p>
        <p class="text-xs text-white/50">{{ t("brand.productSubtitle") }}</p>
      </div>
    </div>

    <form
      class="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl"
      @submit.prevent="submit"
    >
      <h1 class="text-xl font-semibold text-[#0A1628]">{{ t("login.title") }}</h1>
      <p class="mt-1 text-sm text-[#64748B]">{{ t("login.portalSubtitle") }}</p>

      <label class="mt-6 block text-sm font-medium text-[#0A1628]">
        {{ t("login.email") }}
        <div class="relative mt-1">
          <Mail
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            id="login-email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="username"
            required
            class="w-full rounded-xl border border-[#E2E8F0] py-2.5 pl-10 pr-3 text-sm text-[#0A1628] placeholder:text-[#94A3B8] focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
            :placeholder="t('login.emailPlaceholder')"
          />
        </div>
      </label>

      <label class="mt-4 block text-sm font-medium text-[#0A1628]">
        {{ t("login.password") }}
        <div class="relative mt-1">
          <Lock
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            name="password"
            autocomplete="current-password"
            required
            class="w-full rounded-xl border border-[#E2E8F0] py-2.5 pl-10 pr-12 text-sm text-[#0A1628] placeholder:text-[#94A3B8] focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
            :placeholder="t('login.passwordPlaceholder')"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0A1628]"
            :aria-label="showPassword ? t('login.hide') : t('login.show')"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </div>
      </label>

      <div
        v-if="loginError"
        class="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
        role="alert"
      >
        {{ loginError }}
      </div>

      <button
        type="submit"
        class="mt-6 w-full rounded-xl bg-[#D4A853] py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-60"
        :disabled="submitting"
      >
        {{ submitting ? t("login.submitting") : t("login.submit") }}
      </button>
    </form>

    <p class="mt-8 text-center text-xs text-white/40">
      {{ t("brand.copyright") }}
    </p>
  </div>
</template>
