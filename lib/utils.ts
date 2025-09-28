import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  input: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale = "en-US",
) {
  if (!input) {
    return "TBD";
  }

  const date = typeof input === "string" || typeof input === "number" ? new Date(input) : input;

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
