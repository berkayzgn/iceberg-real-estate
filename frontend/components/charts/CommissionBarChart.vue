<script setup lang="ts">
import VChart from 'vue-echarts';
import type { MonthlyData } from '~/utils/demo-data';
import { formatCurrency } from '~/utils/demo-data';

const props = defineProps<{
  chartData: MonthlyData[];
  legendAgency: string;
  legendAgents: string;
}>();

const option = computed(() => ({
  animation: true,
  animationDuration: 400,
  grid: {
    left: 10,
    right: 10,
    top: 8,
    bottom: 28,
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    renderMode: 'html',
    appendToBody: true,
    className: 'echarts-tooltip-wrap',
    formatter(
      params: Array<{ axisValue: string; seriesName: string; value: number; color: string }>,
    ) {
      if (!params?.length) return '';
      const label = params[0].axisValue;
      let sum = 0;
      const rows = params
        .map((p) => {
          sum += Number(p.value) || 0;
          return `<div class="flex items-center gap-2 mb-1">
            <div class="w-2.5 h-2.5 rounded-full" style="background:${p.color}"></div>
            <span class="text-[#64748B]">${p.seriesName}:</span>
            <span class="font-semibold text-[#0A1628]">${formatCurrency(Number(p.value))}</span>
          </div>`;
        })
        .join('');
      return `<div class="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg text-sm">
        <p class="font-semibold text-[#0A1628] mb-2">${label}</p>
        ${rows}
        <div class="border-t border-[#F1F5F9] mt-2 pt-2 flex justify-between">
          <span class="text-[#64748B]">Toplam:</span>
          <span class="font-bold text-[#0A1628]">${formatCurrency(sum)}</span>
        </div>
      </div>`;
    },
  },
  legend: {
    bottom: 0,
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { color: '#64748B', fontSize: 12 },
    data: [props.legendAgency, props.legendAgents],
  },
  xAxis: {
    type: 'category',
    data: props.chartData.map((d) => d.month),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94A3B8', fontSize: 12 },
  },
  yAxis: {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      lineStyle: { type: 'dashed', color: '#F1F5F9' },
    },
    axisLabel: {
      color: '#94A3B8',
      fontSize: 11,
      formatter: (v: number) => `₺${(v / 1000).toFixed(0)}k`,
    },
  },
  series: [
    {
      name: props.legendAgency,
      type: 'bar',
      data: props.chartData.map((d) => d.agencyShare),
      itemStyle: { color: '#0A1628', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 36,
    },
    {
      name: props.legendAgents,
      type: 'bar',
      data: props.chartData.map((d) => d.agentShare),
      itemStyle: { color: '#D4A853', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 36,
    },
  ],
}));
</script>

<template>
  <ClientOnly>
    <VChart class="h-[280px] w-full" :option="option" autoresize />
    <template #fallback>
      <div class="flex h-[280px] w-full items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
        Grafik yükleniyor…
      </div>
    </template>
  </ClientOnly>
</template>
