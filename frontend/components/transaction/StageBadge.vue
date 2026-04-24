<script setup lang="ts">
import type { Stage } from '~/utils/domain';
import { STAGE_COLORS } from '~/utils/domain';

const props = withDefaults(
  defineProps<{ stage: Stage; size?: 'sm' | 'md' }>(),
  { size: 'md' },
);

const { t } = useI18n();
const colors = computed(() => STAGE_COLORS[props.stage]);
const label = computed(() => String(t(`stages.${props.stage}`)));
const cls = computed(() =>
  props.size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
);
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-medium"
    :class="cls"
    :style="{ backgroundColor: colors.bg, color: colors.text }"
  >
    {{ label }}
  </span>
</template>
