/// <reference types="node" />
import { fileURLToPath } from "node:url";
import { resolveModulePath } from "exsolve";

const appManifestStub = resolveModulePath("mocked-exports/empty", {
  from: fileURLToPath(import.meta.url),
});

const isVercel = Boolean(
  process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.VERCEL_URL,
);
const publicApiBase = process.env.NUXT_PUBLIC_API_BASE?.trim() ?? "";

if (isVercel && !publicApiBase) {
  throw new Error(
    "NUXT_PUBLIC_API_BASE is required on Vercel. Set it to your API origin including /api, then rebuild.",
  );
}

export default defineNuxtConfig({
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
      apiBase: publicApiBase || "http://localhost:3002/api",
    },
  },
  experimental: {
    appManifest: false,
  },
  vite: {
    resolve: {
      alias: {
        "#app-manifest": appManifestStub,
      },
    },
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: process.env.NODE_ENV === "development" },
});
