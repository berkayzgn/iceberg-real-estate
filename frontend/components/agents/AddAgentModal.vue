<script setup lang="ts">
import { toApiErrorInfo } from "~/utils/api-error";
import { AGENT_SPEC_KEYS, AGENT_TITLE_KEYS } from "~/utils/agent-labels";
import {
  PHONE_DIAL_OPTIONS,
  phoneDialLabel,
} from "~/utils/phone-dial-codes";
import { buildE164Phone, nationalDigitsOnly } from "~/utils/phone-e164";

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", id: string): void;
}>();

const agents = useAgentsStore();
const toast = useToastStore();
const { t, locale } = useI18n();

const form = reactive({
  name: "",
  title: "",
  email: "",
  dialCode: "+90",
  phoneNational: "",
  specialization: "",
});

const errors = reactive<Record<string, string>>({});

function reset() {
  form.name = "";
  form.title = "";
  form.email = "";
  form.dialCode = "+90";
  form.phoneNational = "";
  form.specialization = "";
  for (const k of Object.keys(errors)) delete errors[k];
}

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  if (!form.name.trim()) errors.name = t("agents.validation.nameRequired");
  if (!form.title.trim()) errors.title = t("agents.validation.titleRequired");
  if (!form.email.trim()) errors.email = t("agents.validation.emailRequired");
  const national = nationalDigitsOnly(form.phoneNational);
  if (!national.length) errors.phone = t("agents.validation.phoneRequired");
  else if (national.length < 7 || national.length > 15)
    errors.phone = t("agents.validation.phoneInvalid");
  if (!form.specialization.trim())
    errors.specialization = t("agents.validation.specializationRequired");
  return Object.keys(errors).length === 0;
}

async function create() {
  if (!validate()) return;
  try {
    const phone = buildE164Phone(form.dialCode, form.phoneNational);
    const created = await agents.addAgent({
      name: form.name,
      title: form.title,
      email: form.email,
      phone,
      specialization: form.specialization,
    });
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
            <option
              v-for="titleKey in AGENT_TITLE_KEYS"
              :key="titleKey"
              :value="titleKey"
            >
              {{ t(`agents.titles.${titleKey}`) }}
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
              v-for="specKey in AGENT_SPEC_KEYS"
              :key="specKey"
              :value="specKey"
            >
              {{ t(`agents.specializations.${specKey}`) }}
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
        <div class="sm:col-span-2">
          <p class="mb-1 text-xs font-medium text-[#64748B]">
            {{ t("agents.phone") }}
          </p>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <div class="sm:w-[min(100%,14rem)] sm:flex-shrink-0">
              <label class="sr-only" for="agent-dial-code">{{
                t("agents.countryCode")
              }}</label>
              <select
                id="agent-dial-code"
                v-model="form.dialCode"
                class="h-full w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0A1628] focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
              >
                <option
                  v-for="opt in PHONE_DIAL_OPTIONS"
                  :key="opt.dial"
                  :value="opt.dial"
                >
                  {{ phoneDialLabel(opt, locale) }}
                </option>
              </select>
            </div>
            <div class="min-w-0 flex-1">
              <label class="sr-only" for="agent-phone-national">{{
                t("agents.phoneLocal")
              }}</label>
              <input
                id="agent-phone-national"
                v-model="form.phoneNational"
                type="tel"
                inputmode="numeric"
                autocomplete="tel-national"
                class="w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm text-[#0A1628] placeholder:text-[#94A3B8] focus:border-[#D4A853] focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
                :placeholder="t('agents.phoneLocal')"
              />
            </div>
          </div>
          <p class="mt-1 text-xs text-[#94A3B8]">
            {{ t("agents.phoneLocalHint") }}
          </p>
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
