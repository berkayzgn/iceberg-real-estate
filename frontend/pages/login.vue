<script setup lang="ts">
import { toApiErrorInfo } from "~/utils/api-error";

definePageMeta({
  layout: false,
});

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBC5JZusNWq14jTGshhyXCulFEVsqJtVUpDvJFwMZoBLPgwBbpWvJ7ChLL4gDx5oPnsjTBrEgKMC82VTTnSO3yo4Oplj0nru_JfuxcbbPIusyUhu-2tWxmXWUVtCSjrRyqEuM0KtVI-g4lYcBEVMYe0_eKuF7eFJWBC30INbtOz0zKlYMuTpNVbd9b01EVQ8bUFXXAguxPsGWt96By_uD1Dm1nHyCleQ2nfR-KqQMIw7h9uxEH6xrGyMNzvwlDZc4Kv7R6nQUsWvrk";

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
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap",
    },
  ],
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
    class="flex min-h-screen w-full bg-white font-['Inter',ui-sans-serif,system-ui,sans-serif] text-base text-[#0A1628]"
  >
    <!-- Sol: görsel + marka (panel laciverti) -->
    <div
      class="relative hidden w-1/2 overflow-hidden bg-[#E8EDF5] lg:block"
    >
      <img
        :src="HERO_IMAGE"
        alt=""
        class="absolute inset-0 h-full w-full object-cover"
        width="1200"
        height="1600"
        decoding="async"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-[#0A1628]/90 via-[#0A1628]/35 to-transparent"
      />
      <div class="absolute bottom-12 left-10 right-10 text-white lg:bottom-16 lg:left-16 lg:right-16">
        <h2
          class="mb-3 text-3xl font-semibold leading-tight tracking-tight"
          style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
        >
          {{ t("login.heroTitle") }}
        </h2>
        <p class="max-w-md text-lg leading-relaxed text-white/85">
          {{ t("login.heroBody") }}
        </p>
      </div>
    </div>

    <!-- Sağ: form (Iceberg renkleri) -->
    <div
      class="flex w-full items-center justify-center bg-[#FAFBFC] p-6 lg:w-1/2 lg:p-10"
    >
      <div class="w-full max-w-md">
        <div class="mb-12 text-center lg:mb-14">
          <div
            class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
            style="background-color: #d4a853"
          >
            <span
              class="material-symbols-outlined text-[26px] text-white"
              aria-hidden="true"
              style="
                font-variation-settings:
                  'FILL' 1,
                  'wght' 400,
                  'GRAD' 0,
                  'opsz' 24;
              "
              >domain</span
            >
          </div>
          <h1
            class="mb-1 text-2xl font-semibold text-[#0A1628]"
            style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
          >
            {{ t("brand.name") }}
          </h1>
          <p class="text-sm text-[#64748B]">
            {{ t("login.portalSubtitle") }}
          </p>
        </div>

        <form class="space-y-6" @submit.prevent="submit">
          <div>
            <label
              class="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#0A1628]"
              for="login-email"
            >
              {{ t("login.email") }}
            </label>
            <div class="relative">
              <div
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <span
                  class="material-symbols-outlined text-[20px] text-[#64748B]"
                  aria-hidden="true"
                  >mail</span
                >
              </div>
              <input
                id="login-email"
                v-model="email"
                type="email"
                name="email"
                autocomplete="username"
                required
                class="block w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-3 text-sm text-[#0A1628] placeholder:text-[#94A3B8] focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/25"
                :placeholder="t('login.emailPlaceholder')"
              />
            </div>
          </div>

          <div>
            <label
              class="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#0A1628]"
              for="login-password"
            >
              {{ t("login.password") }}
            </label>
            <div class="relative">
              <div
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <span
                  class="material-symbols-outlined text-[20px] text-[#64748B]"
                  aria-hidden="true"
                  >lock</span
                >
              </div>
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                required
                class="block w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-11 text-sm text-[#0A1628] placeholder:text-[#94A3B8] focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/25"
                :placeholder="t('login.passwordPlaceholder')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-[#64748B] transition-colors hover:text-[#0A1628]"
                :aria-label="showPassword ? t('login.hide') : t('login.show')"
                @click="showPassword = !showPassword"
              >
                <span class="material-symbols-outlined text-[20px]" aria-hidden="true">{{
                  showPassword ? "visibility_off" : "visibility"
                }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="loginError"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            {{ loginError }}
          </div>

          <div class="pt-1">
            <button
              type="submit"
              class="w-full rounded-lg bg-[#D4A853] px-4 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#D4A853] focus:ring-offset-2 disabled:opacity-60"
              :disabled="submitting"
            >
              {{ submitting ? t("login.submitting") : t("login.submit") }}
            </button>
          </div>
        </form>

        <p class="mt-10 text-center text-xs text-[#94A3B8]">
          {{ t("brand.copyright") }}
        </p>
      </div>
    </div>
  </div>
</template>
