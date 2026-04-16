<script setup lang="ts">
import { Languages } from 'lucide-vue-next';

const props = withDefaults(defineProps<{ collapsed?: boolean }>(), {
  collapsed: false,
});

const { locale, locales, setLocale } = useI18n();

const options = computed(() =>
  (locales.value as Array<{ code: string; name?: string }>).map((l) => ({
    code: l.code,
    name: l.name ?? l.code.toUpperCase(),
    short: l.code.toUpperCase(),
  })),
);

async function switchLocale(code: string) {
  if (locale.value === code) return;
  await setLocale(code);
}

async function toggleLocale() {
  const next = options.value.find((opt) => opt.code !== locale.value);
  if (!next) return;
  await switchLocale(next.code);
}
</script>

<template>
  <button
    v-if="props.collapsed"
    type="button"
    class="flex w-full items-center justify-center rounded-xl p-2.5 text-white/50 transition-all hover:bg-white/5 hover:text-white"
    :title="`Language: ${locale.toUpperCase()}`"
    @click="toggleLocale"
  >
    <Languages class="h-5 w-5" />
  </button>

  <div v-else class="grid w-full grid-cols-2 gap-1">
    <button
      v-for="opt in options"
      :key="opt.code"
      type="button"
      class="flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
      :class="
        locale === opt.code
          ? 'bg-white/10 text-white'
          : 'text-white/50 hover:bg-white/5 hover:text-white'
      "
      :aria-pressed="locale === opt.code"
      :title="opt.name"
      @click="switchLocale(opt.code)"
    >
      {{ opt.short }}
    </button>
  </div>
</template>

