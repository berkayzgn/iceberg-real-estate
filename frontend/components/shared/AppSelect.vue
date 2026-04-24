<script setup lang="ts">
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "radix-vue";
import { Check, ChevronDown, ChevronUp } from "lucide-vue-next";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    buttonClass?: string;
    contentClass?: string;
    optionClass?: string;
  }>(),
  {
    placeholder: "",
    disabled: false,
    buttonClass: "",
    contentClass: "",
    optionClass: "",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
}>();
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="(v) => emit('update:modelValue', String(v))"
  >
    <SelectTrigger
      class="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] px-3 py-2 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20 disabled:cursor-not-allowed disabled:opacity-60"
      :class="buttonClass"
    >
      <SelectValue :placeholder="placeholder" />
      <ChevronDown class="h-4 w-4 text-[#94A3B8]" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="6"
        class="z-[80] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl"
        :class="contentClass"
      >
        <SelectScrollUpButton class="flex items-center justify-center bg-white py-1">
          <ChevronUp class="h-4 w-4 text-[#64748B]" />
        </SelectScrollUpButton>

        <SelectViewport class="max-h-[320px] p-1">
          <SelectItem
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            :disabled="opt.disabled"
            class="relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-[#F1F5F9] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            :class="optionClass"
          >
            <SelectItemIndicator
              class="absolute left-2 inline-flex h-4 w-4 items-center justify-center text-[#D4A853]"
            >
              <Check class="h-4 w-4" />
            </SelectItemIndicator>
            <SelectItemText>{{ opt.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>

        <SelectScrollDownButton class="flex items-center justify-center bg-white py-1">
          <ChevronDown class="h-4 w-4 text-[#64748B]" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

