// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
      apiBase: "http://localhost:3002/api",
    },
  },
  experimental: {
    appManifest: true,
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
});
