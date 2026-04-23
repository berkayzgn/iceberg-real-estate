import { defineStore } from 'pinia';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([]);

  function push(item: Omit<ToastItem, 'id'> & { id?: string }, ttlMs = 2600) {
    const id = item.id ?? `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    toasts.value.unshift({ ...item, id });
    // `window` SSR / Node’da yok; serverless’ta `setTimeout` yeterli (toast zaten pratikte client’ta tetiklenir).
    setTimeout(() => dismiss(id), ttlMs);
    return id;
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function success(message: string, title?: string) {
    return push({ kind: 'success', message, title });
  }

  function error(message: string, title?: string) {
    return push({ kind: 'error', message, title });
  }

  function info(message: string, title?: string) {
    return push({ kind: 'info', message, title });
  }

  return { toasts, push, dismiss, success, error, info };
});

