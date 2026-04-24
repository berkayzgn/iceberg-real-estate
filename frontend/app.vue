<script setup lang="ts">
const { t, locale } = useI18n();

useHead({
  title: () => t('brand.name'),
  htmlAttrs: { lang: () => (locale.value === 'tr' ? 'tr' : 'en') },
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
