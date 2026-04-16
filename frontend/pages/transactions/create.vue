<script setup lang="ts">
const ui = useUiStore();

onMounted(() => {
  ui.openCreateTransaction();
});

onBeforeUnmount(() => {
  ui.closeCreateTransaction();
});
</script>

<template>
  <div class="mx-auto max-w-6xl p-6 lg:p-8">
    <div class="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <p class="text-sm text-[#64748B]">
        Modal açılıyor… Eğer açılmadıysa <NuxtLink to="/transactions" class="text-[#D4A853] hover:underline">listeye dön</NuxtLink>.
      </p>
    </div>
  </div>
</template>
