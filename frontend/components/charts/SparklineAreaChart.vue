<script setup lang="ts">
import VChart from 'vue-echarts';
import { hexToRgba } from '~/utils/chartColors';

const props = defineProps<{
  sparkData: number[];
  color: string;
}>();

const option = computed(() => ({
  animation: false,
  grid: { left: 0, right: 0, top: 2, bottom: 0 },
  xAxis: {
    type: 'category',
    show: false,
    boundaryGap: false,
    data: props.sparkData.map((_, i) => String(i)),
  },
  yAxis: {
    type: 'value',
    show: false,
    splitLine: { show: false },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color: props.color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0.05, color: hexToRgba(props.color, 0.2) },
            { offset: 0.95, color: hexToRgba(props.color, 0) },
          ],
        },
      },
      data: props.sparkData,
    },
  ],
}));
</script>

<template>
  <ClientOnly>
    <VChart class="h-10 w-full min-h-[40px]" :option="option" autoresize />
    <template #fallback>
      <div class="h-10 w-full animate-pulse rounded bg-slate-100" />
    </template>
  </ClientOnly>
</template>
