<script setup lang="ts">
import { formatCurrency } from '~/utils/demo-data';

const props = defineProps<{
  label: string;
  /** Sayaç animasyonunun hedefi (React `MetricCard.value`). */
  value: number;
  /** `plain`: tam sayı; `currency`: `formatCurrency(animated)`. */
  displayMode: 'plain' | 'currency';
}>();

const valueRef = toRef(props, 'value');
const animated = useCountUp(valueRef);

const displayText = computed(() =>
  props.displayMode === 'currency'
    ? formatCurrency(animated.value)
    : String(animated.value),
);

</script>

<template>
  <div
    class="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <div class="mb-3 flex items-start justify-between">
      <p class="text-sm font-medium text-[#64748B]">{{ label }}</p>
    </div>
    <div
      class="text-2xl font-bold text-[#0A1628]"
      style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
    >
      {{ displayText }}
    </div>
  </div>
</template>
