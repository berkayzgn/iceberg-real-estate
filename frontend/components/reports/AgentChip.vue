<script setup lang="ts">
import type { Agent } from '~/utils/demo-data';

withDefaults(
  defineProps<{
    agent: Agent;
    size?: 'sm' | 'md';
  }>(),
  { size: 'md' },
);
</script>

<template>
  <div class="flex items-center gap-2">
    <div
      class="flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
      :class="size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'"
      :style="{ backgroundColor: agent.avatarColor }"
    >
      {{ agent.initials }}
    </div>
    <span
      class="truncate font-medium text-[#0A1628]"
      :class="size === 'sm' ? 'text-xs' : 'text-sm'"
      >{{ agent.name }}</span
    >
  </div>
</template>
