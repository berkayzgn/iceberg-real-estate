<script setup lang="ts">
import { toApiErrorInfo } from "~/utils/api-error";

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", id: string): void;
}>();

const agents = useAgentsStore();
const toast = useToastStore();
const { t } = useI18n();

const TITLE_OPTIONS = [
  "Satış Danışmanı",
  "Kıdemli Satış Danışmanı",
  "Portföy Danışmanı",
] as const;
const SPECIALIZATION_OPTIONS = [
  "Konut",
  "Lüks Konut",
  "Ticari",
  "Kiralama",
  "Yatırım",
] as const;

const form = reactive({
  name: "",
  title: "",
  email: "",
  phone: "",
  specialization: "",
});

const errors = reactive<Record<string, string>>({});

function reset() {
  form.name = "";
  form.title = "";
  form.email = "";
  form.phone = "";
  form.specialization = "";
  for (const k of Object.keys(errors)) delete errors[k];
}

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  if (!form.name.trim()) errors.name = t("agents.validation.nameRequired");
  if (!form.title.trim()) errors.title = t("agents.validation.titleRequired");
  if (!form.email.trim()) errors.email = t("agents.validation.emailRequired");
  if (!form.phone.trim()) errors.phone = t("agents.validation.phoneRequired");
  if (!form.specialization.trim())
    errors.specialization = t("agents.validation.specializationRequired");
  return Object.keys(errors).length === 0;
}

async function create() {
  if (!validate()) return;
  try {
    const created = await agents.addAgent(form);
    toast.success(t("agents.added"), t("common.panel"));
    emit("created", created.id);
    reset();
    emit("close");
  } catch (error) {
    const err = toApiErrorInfo(error, t("agents.addError"));
    toast.error(err.message, err.title);
  }
}

watch(
  () => props.open,
  (v) => {
    if (!v) reset();
  }
);
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[60] flex items-center justify-center p-4"
  >
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />
    <div
      class="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl"
    >
      <h3 class="text-base font-semibold text-[#0A1628]">
        {{ t("agents.newAgent") }}
      </h3>
      <p class="mt-1 text-sm text-[#64748B]">
        {{ t("agents.appearsInSelections") }}
      </p>

      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <input
            v-model="form.name"
            class="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm"
            :placeholder="t('agents.nameSurname')"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-red-500">
            {{ errors.name }}
          </p>
        </div>
        <div>
          <select
            v-model="form.title"
            class="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm"
          >
            <option value="" disabled>{{ t("agents.selectTitle") }}</option>
            <option v-for="title in TITLE_OPTIONS" :key="title" :value="title">
              {{ title }}
            </option>
          </select>
          <p v-if="errors.title" class="mt-1 text-xs text-red-500">
            {{ errors.title }}
          </p>
        </div>
        <div>
          <select
            v-model="form.specialization"
            class="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm"
          >
            <option value="" disabled>
              {{ t("agents.selectSpecialization") }}
            </option>
            <option
              v-for="specialization in SPECIALIZATION_OPTIONS"
              :key="specialization"
              :value="specialization"
            >
              {{ specialization }}
            </option>
          </select>
          <p v-if="errors.specialization" class="mt-1 text-xs text-red-500">
            {{ errors.specialization }}
          </p>
        </div>
        <div>
          <input
            v-model="form.email"
            class="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm"
            :placeholder="t('login.email')"
          />
          <p v-if="errors.email" class="mt-1 text-xs text-red-500">
            {{ errors.email }}
          </p>
        </div>
        <div>
          <input
            v-model="form.phone"
            class="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm"
            :placeholder="t('agents.phone')"
          />
          <p v-if="errors.phone" class="mt-1 text-xs text-red-500">
            {{ errors.phone }}
          </p>
        </div>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#64748B] hover:bg-[#F8FAFC]"
          @click="$emit('close')"
        >
          {{ t("common.cancel") }}
        </button>
        <button
          type="button"
          class="rounded-lg bg-[#D4A853] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          @click="create"
        >
          {{ t("agents.add") }}
        </button>
      </div>
    </div>
  </div>
</template>
