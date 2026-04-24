import type { Composer } from "vue-i18n";

type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  errors?: string[];
  fieldErrors?: Record<string, string[]>;
};

type ApiErrorInfo = {
  message: string;
  title: string;
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;
};

function translateValidatorMessage(raw: string, t: Composer["t"]): string {
  const m = raw.trim();
  if (!m) return m;
  if (m.startsWith("errors.")) return String(t(m));

  // class-validator default messages (common ones we hit in CRUD)
  // e.g. "propertyAddress must be longer than or equal to 5 characters"
  const minLen = m.match(/must be longer than or equal to (\d+) characters/i);
  if (minLen?.[1]) return String(t("validation.minLength", { n: Number(minLen[1]) }));

  const maxLen = m.match(/must be shorter than or equal to (\d+) characters/i);
  if (maxLen?.[1]) return String(t("validation.maxLength", { n: Number(maxLen[1]) }));

  if (/must be an email/i.test(m)) return String(t("validation.email"));
  if (/must be a mongodb id/i.test(m)) return String(t("validation.mongoId"));
  if (/must be a number conforming to the specified constraints/i.test(m))
    return String(t("validation.number"));
  if (/must be a positive number/i.test(m)) return String(t("validation.positive"));
  if (/must be a string/i.test(m)) return String(t("validation.string"));

  const oneOf = m.match(/must be one of the following values: (.+)$/i);
  if (oneOf?.[1]) return String(t("validation.oneOf", { values: oneOf[1] }));

  return m;
}

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
    message = parts.map((p) => translateValidatorMessage(p, t)).join(" | ");
  } else if (typeof payload?.message === "string" && payload.message.trim()) {
    message = translateIfKey(payload.message, t);
  } else if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    message = payload.errors.map((p) => translateValidatorMessage(String(p), t)).join(" | ");
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

  const fieldErrors =
    payload?.fieldErrors && typeof payload.fieldErrors === "object"
      ? Object.fromEntries(
          Object.entries(payload.fieldErrors).map(([k, v]) => [
            k,
            Array.isArray(v) ? v.map((p) => translateValidatorMessage(String(p), t)) : [],
          ]),
        )
      : undefined;

  return { message, title, statusCode, fieldErrors };
}
