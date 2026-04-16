<script setup lang="ts">
import { TrendingUp, TrendingDown } from 'lucide-vue-next';
import { formatCurrency } from '~/utils/demo-data';

const props = defineProps<{
  label: string;
  /** Sayaç animasyonunun hedefi (React `MetricCard.value`). */
  value: number;
  /** `plain`: tam sayı; `currency`: `formatCurrency(animated)`. */
  displayMode: 'plain' | 'currency';
  trend: number;
  sparkData: number[];
  color: string;
}>();

const valueRef = toRef(props, 'value');
const animated = useCountUp(valueRef);

const displayText = computed(() =>
  props.displayMode === 'currency'
    ? formatCurrency(animated.value)
    : String(animated.value),
);

const isPositive = computed(() => props.trend > 0);
const trendAbs = computed(() => Math.abs(props.trend));
</script>

<template>
  <div
    class="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <div class="mb-3 flex items-start justify-between">
      <p class="text-sm font-medium text-[#64748B]">{{ label }}</p>
      <span
        class="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
        :class="
          isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
        "
      >
        <TrendingUp v-if="isPositive" class="h-3 w-3" />
        <TrendingDown v-else class="h-3 w-3" />
        {{ trendAbs }}%
      </span>
    </div>
    <div
      class="mb-3 text-2xl font-bold text-[#0A1628]"
      style="font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui"
    >
      {{ displayText }}
    </div>
    <div class="h-10">
      <ChartsSparklineAreaChart
        :key="label"
        :spark-data="sparkData"
        :color="color"
      />
    </div>
  </div>
</template>
