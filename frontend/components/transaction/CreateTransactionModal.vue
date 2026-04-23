<script setup lang="ts">
import { X, Building2, DollarSign, Users } from "lucide-vue-next";
import type { Agent, PropertyType } from "~/utils/domain";
import { formatCurrency } from "~/utils/domain";
import { toApiErrorInfo } from "~/utils/api-error";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "created", id: string): void;
}>();

const tx = useTransactionsStore();
const toast = useToastStore();
const agents = useAgentsStore();
const { t } = useI18n();
const NEW_AGENT_VALUE = "__new_agent__";
const showAddAgentModal = ref(false);
const addAgentTarget = ref<"listing" | "selling">("listing");

const form = reactive({
  propertyAddress: "",
  propertyType: "sale" as PropertyType,
  transactionValue: "",
  listingAgentId: "" as string,
  sellingAgentId: "" as string,
});

const errors = reactive<Record<string, string>>({});

const value = computed(() => Number.parseFloat(form.transactionValue) || 0);
const isSameAgent = computed(
  () => !!form.listingAgentId && form.listingAgentId === form.sellingAgentId
);

const company = computed(() => value.value * 0.5);
const agentTotal = computed(() => value.value * 0.5);
const listingAgentShare = computed(() =>
  isSameAgent.value ? agentTotal.value : agentTotal.value * 0.5
);
const sellingAgentShare = computed(() =>
  isSameAgent.value ? 0 : agentTotal.value * 0.5
);

function agent(id: string): Agent | undefined {
  return agents.findById(id);
}

function openAddAgent(target: "listing" | "selling") {
  addAgentTarget.value = target;
  showAddAgentModal.value = true;
}

function onListingAgentChange() {
  if (form.listingAgentId !== NEW_AGENT_VALUE) return;
  form.listingAgentId = "";
  openAddAgent("listing");
}

function onSellingAgentChange() {
  if (form.sellingAgentId !== NEW_AGENT_VALUE) return;
  form.sellingAgentId = "";
  openAddAgent("selling");
}

function onAgentCreated(id: string) {
  if (addAgentTarget.value === "listing") form.listingAgentId = id;
  if (addAgentTarget.value === "selling") form.sellingAgentId = id;
}

function reset() {
  form.propertyAddress = "";
  form.propertyType = "sale";
  form.transactionValue = "";
  form.listingAgentId = "";
  form.sellingAgentId = "";
  for (const k of Object.keys(errors)) delete errors[k];
}

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  if (!form.propertyAddress.trim())
    errors.propertyAddress = t("createTransaction.validation.addressRequired");
  if (!form.transactionValue || value.value <= 0)
    errors.transactionValue = t("createTransaction.validation.amountRequired");
  if (!form.listingAgentId)
    errors.listingAgentId = t("createTransaction.validation.listingRequired");
  if (!form.sellingAgentId)
    errors.sellingAgentId = t("createTransaction.validation.sellingRequired");
  return Object.keys(errors).length === 0;
}

async function create() {
  if (!validate()) return;
  try {
    const created = await tx.addTransaction({
      propertyAddress: form.propertyAddress,
      propertyType: form.propertyType,
      transactionValue: value.value,
      listingAgentId: form.listingAgentId,
      sellingAgentId: form.sellingAgentId,
    });

    emit("created", created.id);
    toast.success(t("createTransaction.created"), t("common.panel"));
    reset();
    emit("close");
  } catch (error) {
    const err = toApiErrorInfo(error, t("createTransaction.createError"));
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
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="$emit('close')"
    />

    <div
      class="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      <div
        class="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5"
      >
        <div>
          <h2 class="text-base font-semibold text-[#0A1628]">
            {{ t("createTransaction.title") }}
          </h2>
          <p class="mt-0.5 text-sm text-[#64748B]">
            {{ t("createTransaction.subtitle") }}
          </p>
        </div>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
          :aria-label="t('common.close')"
          @click="$emit('close')"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form
        class="flex max-h-[calc(90vh-80px)] flex-col overflow-y-auto md:flex-row"
        @submit.prevent="create"
      >
        <div
          class="flex-1 space-y-5 border-b border-[#E2E8F0] p-6 md:border-b-0 md:border-r"
        >
          <div>
            <label class="mb-1.5 block text-sm font-medium text-[#0A1628]">
              <Building2 class="mr-1 inline h-4 w-4 text-[#64748B]" />
              {{ t("createTransaction.address") }}
            </label>
            <input
              v-model="form.propertyAddress"
              class="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
              :placeholder="t('createTransaction.addressPlaceholder')"
            />
            <p v-if="errors.propertyAddress" class="mt-1 text-xs text-red-500">
              {{ errors.propertyAddress }}
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-[#0A1628]">{{
              t("createTransaction.type")
            }}</label>
            <div class="flex gap-3">
              <button
                v-for="propertyTypeOption in (['sale', 'rental'] as const)"
                :key="propertyTypeOption"
                type="button"
                class="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all"
                :class="
                  form.propertyType === propertyTypeOption
                    ? 'border-[#D4A853] bg-[#FEF3C7] text-[#B45309]'
                    : 'border-[#E2E8F0] text-[#64748B] hover:border-[#D4A853]/50'
                "
                @click="form.propertyType = propertyTypeOption"
              >
                {{
                  propertyTypeOption === "sale"
                    ? t("transactions.sale")
                    : t("transactions.rental")
                }}
              </button>
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-[#0A1628]">
              <DollarSign class="mr-1 inline h-4 w-4 text-[#64748B]" />
              {{ t("createTransaction.serviceFee") }}
            </label>
            <input
              v-model="form.transactionValue"
              type="number"
              min="0"
              step="500"
              class="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
              :placeholder="'0'"
            />
            <p v-if="errors.transactionValue" class="mt-1 text-xs text-red-500">
              {{ errors.transactionValue }}
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-[#0A1628]">
              <Users class="mr-1 inline h-4 w-4 text-[#64748B]" />
              {{ t("transactions.listingAgent") }}
            </label>
            <select
              v-model="form.listingAgentId"
              class="w-full cursor-pointer rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
              @change="onListingAgentChange"
            >
              <option :value="NEW_AGENT_VALUE">
                {{ t("createTransaction.addNew") }}
              </option>
              <option value="">{{ t("createTransaction.select") }}</option>
              <option v-for="a in agents.agents" :key="a.id" :value="a.id">
                {{ a.name }} — {{ a.title }}
              </option>
            </select>
            <p v-if="errors.listingAgentId" class="mt-1 text-xs text-red-500">
              {{ errors.listingAgentId }}
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-[#0A1628]">{{
              t("transactions.sellingAgent")
            }}</label>
            <select
              v-model="form.sellingAgentId"
              class="w-full cursor-pointer rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#0A1628] transition-all focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20"
              @change="onSellingAgentChange"
            >
              <option :value="NEW_AGENT_VALUE">
                {{ t("createTransaction.addNew") }}
              </option>
              <option value="">{{ t("createTransaction.select") }}</option>
              <option v-for="a in agents.agents" :key="a.id" :value="a.id">
                {{ a.name }} — {{ a.title }}
              </option>
            </select>
            <p v-if="errors.sellingAgentId" class="mt-1 text-xs text-red-500">
              {{ errors.sellingAgentId }}
            </p>
          </div>
        </div>

        <div class="w-full bg-[#FAFBFC] p-6 md:w-72">
          <h3 class="mb-4 text-sm font-semibold text-[#0A1628]">
            {{ t("createTransaction.preview") }}
          </h3>

          <div v-if="value > 0" class="space-y-4">
            <div
              class="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
            >
              <div class="mb-1 text-xs text-[#64748B]">
                {{ t("reports.totalServiceFee") }}
              </div>
              <div class="text-xl font-bold text-[#0A1628]">
                {{ formatCurrency(value) }}
              </div>
            </div>

            <div class="space-y-2.5">
              <div
                class="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-3"
              >
                <div class="flex items-center gap-2">
                  <div class="h-2.5 w-2.5 rounded-full bg-[#0A1628]" />
                  <span class="text-xs font-medium text-[#64748B]">{{
                    t("createTransaction.agency50")
                  }}</span>
                </div>
                <span class="text-sm font-semibold text-[#0A1628]">{{
                  formatCurrency(company)
                }}</span>
              </div>

              <div
                v-if="isSameAgent"
                class="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-3"
              >
                <div class="flex items-center gap-2">
                  <div class="h-2.5 w-2.5 rounded-full bg-[#D4A853]" />
                  <span class="text-xs font-medium text-[#64748B]">{{
                    t("createTransaction.agent50")
                  }}</span>
                </div>
                <span class="text-sm font-semibold text-[#0A1628]">
                  {{ formatCurrency(listingAgentShare) }}
                </span>
              </div>

              <template v-else>
                <div
                  class="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-3"
                >
                  <div class="flex items-center gap-2">
                    <div class="h-2.5 w-2.5 rounded-full bg-[#D4A853]" />
                    <span class="text-xs font-medium text-[#64748B]">{{
                      t("createTransaction.listing25")
                    }}</span>
                  </div>
                  <span class="text-sm font-semibold text-[#0A1628]">
                    {{ formatCurrency(listingAgentShare) }}
                  </span>
                </div>
                <div
                  class="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-3"
                >
                  <div class="flex items-center gap-2">
                    <div class="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                    <span class="text-xs font-medium text-[#64748B]">{{
                      t("createTransaction.selling25")
                    }}</span>
                  </div>
                  <span class="text-sm font-semibold text-[#0A1628]">
                    {{ formatCurrency(sellingAgentShare) }}
                  </span>
                </div>
              </template>
            </div>

            <div class="flex h-3 overflow-hidden rounded-full gap-0.5">
              <div class="rounded-l-full bg-[#0A1628]" style="width: 50%" />
              <template v-if="isSameAgent">
                <div class="rounded-r-full bg-[#D4A853]" style="width: 50%" />
              </template>
              <template v-else>
                <div class="bg-[#D4A853]" style="width: 25%" />
                <div class="rounded-r-full bg-[#F59E0B]" style="width: 25%" />
              </template>
            </div>

            <div class="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <p class="text-xs text-[#64748B]">
                {{ t("transactions.listing") }}:
                {{ agent(form.listingAgentId)?.name ?? "—" }}
              </p>
              <p class="text-xs text-[#64748B]">
                {{ t("transactions.selling") }}:
                {{ agent(form.sellingAgentId)?.name ?? "—" }}
              </p>
            </div>
          </div>

          <div v-else class="py-8 text-center text-sm text-[#94A3B8]">
            {{ t("createTransaction.enterAmountForPreview") }}
          </div>
        </div>
      </form>

      <div
        class="flex items-center justify-end gap-3 border-t border-[#E2E8F0] bg-white px-6 py-4"
      >
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#F1F5F9]"
          @click="$emit('close')"
        >
          {{ t("common.cancel") }}
        </button>
        <button
          type="button"
          class="rounded-lg px-6 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style="background-color: #d4a853"
          @click="create"
        >
          {{ t("createTransaction.create") }}
        </button>
      </div>
    </div>
  </div>
  <AgentsAddAgentModal
    :open="showAddAgentModal"
    @close="showAddAgentModal = false"
    @created="onAgentCreated"
  />
</template>
