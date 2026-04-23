<script setup lang="ts">
import type { Agent, Transaction } from '~/utils/domain';
import { calculateCommission, formatCurrency } from '~/utils/domain';

const props = defineProps<{
  transaction: Transaction;
  getAgent: (id: string) => Agent | undefined;
  cardBg?: string;
}>();

const comm = computed(() => calculateCommission(props.transaction));
const listing = computed(() => props.getAgent(props.transaction.listingAgentId));
const selling = computed(() => props.getAgent(props.transaction.sellingAgentId));
const isSame = computed(
  () => props.transaction.listingAgentId === props.transaction.sellingAgentId,
);

const title = computed(() => props.transaction.propertyAddress.split(',')[0] ?? '');
const subtitle = computed(() =>
  props.transaction.propertyAddress.split(',').slice(1).join(',').trim(),
);
</script>

<template>
  <NuxtLink
    :to="`/transactions/${transaction.id}`"
    class="group block cursor-pointer rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    :style="{ backgroundColor: cardBg ?? '#ffffff' }"
  >
    <div class="mb-3 flex items-start justify-between gap-2">
      <p
        class="line-clamp-2 pr-2 text-sm font-semibold leading-snug text-[#0A1628]"
      >
        {{ title }}
      </p>
      <span
        class="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="
          transaction.propertyType === 'sale'
            ? 'bg-blue-50 text-blue-600'
            : 'bg-purple-50 text-purple-600'
        "
      >
        {{ transaction.propertyType === 'sale' ? 'Satış' : 'Kiralama' }}
      </span>
    </div>
    <p class="mb-3 truncate text-xs text-[#64748B]">{{ subtitle }}</p>
    <div class="mb-3 flex items-center justify-between">
      <span class="text-sm font-bold text-[#0A1628]">{{
        formatCurrency(transaction.transactionValue)
      }}</span>
      <TransactionStageBadge :stage="transaction.stage" size="sm" />
    </div>
    <div class="flex items-center justify-between">
      <div v-if="listing" class="flex items-center gap-1.5">
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
          :style="{ backgroundColor: listing.avatarColor }"
        >
          {{ listing.initials }}
        </div>
        <div
          v-if="!isSame && selling"
          class="-ml-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white"
          :style="{ backgroundColor: selling.avatarColor }"
        >
          {{ selling.initials }}
        </div>
      </div>
      <span class="text-xs font-semibold text-[#D4A853]">{{
        formatCurrency(comm.agentTotal)
      }}</span>
    </div>
  </NuxtLink>
</template>
