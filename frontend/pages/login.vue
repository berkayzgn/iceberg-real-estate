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
    class="flex min-h-screen w-full bg-surface-container-lowest font-['Inter',ui-sans-serif,system-ui,sans-serif] text-base leading-6 text-on-surface"
  >
    <!-- Left: hero -->
    <div
      class="relative hidden w-1/2 overflow-hidden bg-surface-variant lg:block"
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
        class="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"
      />
      <div
        class="absolute bottom-16 left-16 right-16 text-on-primary"
      >
        <h2
          class="mb-2 text-[32px] font-semibold leading-10 tracking-tight text-on-primary"
        >
          {{ t("login.heroTitle") }}
        </h2>
        <p class="max-w-md text-lg leading-7 text-on-primary/80">
          {{ t("login.heroBody") }}
        </p>
      </div>
    </div>

    <!-- Right: form -->
    <div
      class="flex w-full items-center justify-center bg-surface-container-lowest p-6 lg:w-1/2 lg:p-10"
    >
      <div class="w-full max-w-md">
        <div class="mb-16 text-center">
          <div
            class="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-on-primary"
          >
            <span
              class="material-symbols-outlined text-[26px]"
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
          <h1 class="mb-2 text-2xl font-semibold leading-8 text-on-surface">
            {{ t("brand.name") }}
          </h1>
          <p class="text-sm leading-5 text-on-surface-variant">
            {{ t("login.portalSubtitle") }}
          </p>
        </div>

        <form class="space-y-6" @submit.prevent="submit">
          <div>
            <label
              class="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface"
              for="login-email"
            >
              {{ t("login.email") }}
            </label>
            <div class="relative">
              <div
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <span
                  class="material-symbols-outlined text-[20px] text-outline"
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
                class="block w-full rounded-sm border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-3 text-sm leading-5 text-on-surface placeholder:text-outline/80 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                :placeholder="t('login.emailPlaceholder')"
              />
            </div>
          </div>

          <div>
            <label
              class="mb-2 block text-xs font-semibold uppercase tracking-wider text-on-surface"
              for="login-password"
            >
              {{ t("login.password") }}
            </label>
            <div class="relative">
              <div
                class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <span
                  class="material-symbols-outlined text-[20px] text-outline"
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
                class="block w-full rounded-sm border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-10 text-sm leading-5 text-on-surface placeholder:text-outline/80 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                :placeholder="t('login.passwordPlaceholder')"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-outline transition-colors hover:text-on-surface"
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
            class="rounded-sm border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
            role="alert"
          >
            {{ loginError }}
          </div>

          <div class="pt-2">
            <button
              type="submit"
              class="w-full rounded-sm border border-transparent bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
              :disabled="submitting"
            >
              {{ submitting ? t("login.submitting") : t("login.submit") }}
            </button>
          </div>
        </form>

        <p class="mt-10 text-center text-xs text-on-surface-variant/80">
          {{ t("brand.copyright") }}
        </p>
      </div>
    </div>
  </div>
</template>
