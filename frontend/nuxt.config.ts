// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="node" />
/** Vercel build; tek env bazen child process’e geçmeyebildiği için birkaç sinyal. */
const isVercel = Boolean(
  process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.VERCEL_URL,
);
const publicApiBase = process.env.NUXT_PUBLIC_API_BASE?.trim() ?? "";

// Vercel'de API base mutlaka prod URL olmalı; aksi halde client bundle'a localhost gömülür.
if (isVercel && !publicApiBase) {
  throw new Error(
    "NUXT_PUBLIC_API_BASE eksik. Vercel → Environment Variables içine örn. " +
      "`https://<render-app>.onrender.com/api` ekleyip redeploy edin.",
  );
}

export default defineNuxtConfig({
  // Vercel: dış bırakılan `vue-router` vb. /var/task node_modules’ta yok (ERR_MODULE_NOT_FOUND).
  // Sadece `VERCEL=1` ile koşullamak yetersiz; bazı build’lerde o env nuxt child’a gitmiyor.
  // `noExternals: true` her `nuxt build` için güvenli; sadece çıktı biraz büyür.
  nitro: {
    ...(isVercel ? { preset: "vercel" as const } : {}),
    noExternals: true,
  },
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxtjs/i18n"],
  css: ["~/assets/css/main.css"],
  i18n: {
    defaultLocale: "tr",
    strategy: "no_prefix",
    langDir: "locales",
    locales: [
      { code: "tr", name: "Turkce", file: "tr.json" },
      { code: "en", name: "English", file: "en.json" },
    ],
  },
  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap",
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // Not: `NUXT_PUBLIC_*` build-time'da client bundle'a gömülür.
      // Local dev için default localhost; prod (Vercel) için yukarıdaki guard zorunlu.
      apiBase: publicApiBase || "http://localhost:3002/api",
    },
  },
  experimental: {
    appManifest: true,
  },
  compatibilityDate: "2024-11-01",
  // Prod serverless (Vercel) ortamında devtools ek yük / uyumsuzluk riski: sadece local dev.
  devtools: { enabled: process.env.NODE_ENV === "development" },
});
