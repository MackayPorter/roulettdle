import { NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function logApiError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  const payload: Record<string, unknown> = { context, ...extra };

  if (error && typeof error === "object") {
    const e = error as SupabaseLikeError;
    if (e.message) payload.message = e.message;
    if (e.code) payload.code = e.code;
    if (e.details) payload.details = e.details;
    if (e.hint) payload.hint = e.hint;
  } else if (error instanceof Error) {
    payload.message = error.message;
    payload.stack = error.stack;
  } else {
    payload.raw = error;
  }

  console.error("[api]", JSON.stringify(payload, null, 2));
}

export function apiErrorResponse(
  context: string,
  error: unknown,
  status = 500,
  extra?: Record<string, unknown>,
) {
  logApiError(context, error, extra);

  const body: Record<string, unknown> = {
    message:
      error && typeof error === "object" && "message" in error
        ? String((error as SupabaseLikeError).message)
        : error instanceof Error
          ? error.message
          : "Server error",
    context,
  };

  if (isDev) {
    if (error && typeof error === "object") {
      const e = error as SupabaseLikeError;
      if (e.code) body.code = e.code;
      if (e.details) body.details = e.details;
      if (e.hint) body.hint = e.hint;
    }
    if (extra) body.debug = extra;
  }

  return NextResponse.json(body, { status });
}
