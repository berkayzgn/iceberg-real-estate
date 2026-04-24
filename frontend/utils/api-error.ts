import type { Composer } from "vue-i18n";

type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  errors?: string[];
};

type ApiErrorInfo = {
  message: string;
  title: string;
  statusCode?: number;
};

function readPayload(error: unknown): ApiErrorPayload | null {
  if (!error || typeof error !== "object") return null;

  const maybe = error as {
    data?: unknown;
    response?: { _data?: unknown };
  };

  const direct = maybe.data;
  if (direct && typeof direct === "object") {
    return direct as ApiErrorPayload;
  }

  const nested = maybe.response?._data;
  if (nested && typeof nested === "object") {
    return nested as ApiErrorPayload;
  }

  return null;
}

function resolveStatusCode(error: unknown, payload: ApiErrorPayload | null) {
  if (payload?.statusCode) return payload.statusCode;

  if (!error || typeof error !== "object") return undefined;

  const maybe = error as {
    statusCode?: number;
    status?: number;
    response?: { status?: number };
  };

  return maybe.statusCode ?? maybe.status ?? maybe.response?.status;
}

function translateIfKey(raw: string, t: Composer["t"]): string {
  const m = raw.trim();
  if (m.startsWith("errors.")) return String(t(m));
  return m;
}

export function toApiErrorInfo(
  error: unknown,
  t: Composer["t"],
  fallbackMessageKey: string,
): ApiErrorInfo {
  const payload = readPayload(error);
  const statusCode = resolveStatusCode(error, payload);

  let message = String(t(fallbackMessageKey));

  if (Array.isArray(payload?.message) && payload.message.length > 0) {
    const parts = payload.message.map(String);
    message = parts.map((p) => (p.startsWith("errors.") ? String(t(p)) : p)).join(" | ");
  } else if (typeof payload?.message === "string" && payload.message.trim()) {
    message = translateIfKey(payload.message, t);
  } else if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    message = payload.errors.map(String).join(" | ");
  } else if (error instanceof Error && error.message?.trim()) {
    const raw = error.message;
    if (raw.startsWith("errors.")) {
      message = String(t(raw));
    } else if (
      /\b(400|401|403|404|500)\b|Bad Request|Not Found|Failed to fetch/i.test(
        raw,
      )
    ) {
      message = String(t(fallbackMessageKey));
    } else {
      message = raw;
    }
  }

  let title = String(t("errors.title"));
  if (statusCode === 400) title = String(t("errors.badRequestTitle"));
  if (statusCode === 404) title = String(t("errors.notFoundTitle"));
  if (statusCode && statusCode >= 500) title = String(t("errors.serverTitle"));

  return { message, title, statusCode };
}
