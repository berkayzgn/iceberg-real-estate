<script setup lang="ts">
const toast = useToastStore();

function pill(kind: string) {
  if (kind === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (kind === 'error') return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-slate-50 text-slate-700 border-slate-100';
}
</script>

<template>
  <div class="pointer-events-none fixed right-4 top-4 z-[60] flex w-[320px] flex-col gap-2">
    <div
      v-for="t in toast.toasts"
      :key="t.id"
      class="pointer-events-auto rounded-2xl border bg-white p-3 shadow-lg"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="mb-1 flex items-center gap-2">
            <span
              class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold"
              :class="pill(t.kind)"
            >
              {{ t.kind }}
            </span>
            <p v-if="t.title" class="truncate text-sm font-semibold text-[#0A1628]">
              {{ t.title }}
            </p>
          </div>
          <p class="text-sm text-[#64748B]">{{ t.message }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-xs font-semibold text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#64748B]"
          @click="toast.dismiss(t.id)"
        >
          Kapat
        </button>
      </div>
    </div>
  </div>
</template>

