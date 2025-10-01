import type { AuthError } from "@supabase/supabase-js";

const MISSING_USER_SNIPPET = "User from sub claim in JWT does not exist";

type WithMessage = {
  message?: unknown;
  error_description?: unknown;
};

export function extractAuthErrorMessage(error: unknown): string {
  if (!error) {
    return "Unexpected error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const { message, error_description: description } = error as WithMessage;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    if (typeof description === "string" && description.trim().length > 0) {
      return description;
    }
  }

  return "Unexpected error";
}

export function isSupabaseUserMissingError(error: unknown): error is AuthError {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as AuthError & { status?: number };
  const message = extractAuthErrorMessage(error);

  return authError.status === 403 && message.includes(MISSING_USER_SNIPPET);
}
