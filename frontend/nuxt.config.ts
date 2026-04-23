// https://nuxt.com/docs/api/configuration/nuxt-config
const isVercel = Boolean(process.env.VERCEL);
const publicApiBase = process.env.NUXT_PUBLIC_API_BASE?.trim() ?? "";

// Vercel'de API base mutlaka prod URL olmalı; aksi halde client bundle'a localhost gömülür.
if (isVercel && !publicApiBase) {
  throw new Error(
    "NUXT_PUBLIC_API_BASE eksik. Vercel → Environment Variables içine örn. " +
      "`https://<render-app>.onrender.com/api` ekleyip redeploy edin.",
  );
}

export default defineNuxtConfig({
  nitro: process.env.VERCEL ? { preset: "vercel" } : {},
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
  devtools: { enabled: true },
});
