import { defineStore } from "pinia";

export type ConfirmTone = "default" | "danger";

type ConfirmRequest = {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone: ConfirmTone;
};

type Pending = {
  request: ConfirmRequest;
  resolve: (v: boolean) => void;
};

export const useConfirmStore = defineStore("confirm", () => {
  const pending = ref<Pending | null>(null);

  const open = computed(() => pending.value !== null);
  const request = computed(() => pending.value?.request ?? null);

  function confirm(req: Partial<ConfirmRequest> & Pick<ConfirmRequest, "message">) {
    if (pending.value) {
      pending.value.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      pending.value = {
        request: {
          title: req.title ?? "",
          message: req.message,
          confirmText: req.confirmText ?? "Confirm",
          cancelText: req.cancelText ?? "Cancel",
          tone: req.tone ?? "default",
        },
        resolve,
      };
    });
  }

  function accept() {
    if (!pending.value) return;
    pending.value.resolve(true);
    pending.value = null;
  }

  function cancel() {
    if (!pending.value) return;
    pending.value.resolve(false);
    pending.value = null;
  }

  return { open, request, confirm, accept, cancel };
});

