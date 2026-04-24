<script setup lang="ts">
const confirm = useConfirmStore();

const panelRef = ref<HTMLDivElement | null>(null);

function onKeydown(e: KeyboardEvent) {
  if (!confirm.open) return;
  if (e.key === "Escape") {
    e.preventDefault();
    confirm.cancel();
  }
}

watch(
  () => confirm.open,
  (open) => {
    if (!open) return;
    requestAnimationFrame(() => {
      const btn = panelRef.value?.querySelector<HTMLButtonElement>(
        "button[data-autofocus]",
      );
      btn?.focus();
    });
  },
);
</script>

<template>
  <div
    v-if="confirm.open && confirm.request"
    class="fixed inset-0 z-[70] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    @keydown="onKeydown"
  >
    <div class="absolute inset-0 bg-black/40" @click="confirm.cancel()" />

    <div
      ref="panelRef"
      class="relative w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl"
    >
      <div class="mb-2 text-base font-semibold text-[#0A1628]">
        {{ confirm.request.title }}
      </div>
      <div class="text-sm text-[#64748B]">
        {{ confirm.request.message }}
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
          data-autofocus
          @click="confirm.cancel()"
        >
          {{ confirm.request.cancelText }}
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          :class="
            confirm.request.tone === 'danger' ? 'bg-red-600' : 'bg-[#0A1628]'
          "
          @click="confirm.accept()"
        >
          {{ confirm.request.confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

