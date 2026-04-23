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

export function toApiErrorInfo(
  error: unknown,
  fallbackMessage: string
): ApiErrorInfo {
  const payload = readPayload(error);
  const statusCode = resolveStatusCode(error, payload);

  let message = fallbackMessage;

  if (Array.isArray(payload?.message) && payload.message.length > 0) {
    message = payload.message.map(String).join(" | ");
  } else if (typeof payload?.message === "string" && payload.message.trim()) {
    message = payload.message;
  } else if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    message = payload.errors.map(String).join(" | ");
  } else if (error instanceof Error && error.message?.trim()) {
    // Avoid exposing generic HTTP phrases like "Bad Request" when no API detail exists.
    const raw = error.message;
    if (
      /\b(400|401|403|404|500)\b|Bad Request|Not Found|Failed to fetch/i.test(
        raw
      )
    ) {
      message = fallbackMessage;
    } else {
      message = raw;
    }
  }

  let title = "Hata";
  if (statusCode === 400) title = "Bu işlem yapılamaz";
  if (statusCode === 404) title = "Kayıt bulunamadı";
  if (statusCode && statusCode >= 500) title = "Sunucu hatası";

  return { message, title, statusCode };
}
