import { cn } from "@/lib/utils";

type ClassValue = string | false | null | undefined;

export const layoutTokens = {
  container: "mx-auto w-full max-w-6xl",
  pagePaddingX: "px-4",
  pagePaddingY: "py-8",
  pageStack: "flex flex-col gap-8",
  sectionStack: "flex flex-col gap-6",
} as const;

export const surfaceTokens = {
  card: "rounded-3xl border border-neutral-200 bg-white/95 p-8 shadow-sm backdrop-blur",
  subtleCard: "rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm",
  dashed: "rounded-2xl border border-dashed border-neutral-300 bg-white p-6",
  pill: "rounded-full px-3 py-1",
} as const;

export const textTokens = {
  eyebrow: "text-xs font-semibold uppercase tracking-wider text-neutral-500",
  pageHeading: "text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl",
  sectionHeading: "text-2xl font-semibold tracking-tight text-neutral-900",
  body: "text-sm text-neutral-600",
  smallMuted: "text-sm text-neutral-500",
} as const;

export const buttonTokens = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-800",
  ghost: "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
} as const;

export function applyTokens(...tokens: ClassValue[]) {
  return cn(tokens.filter(Boolean).join(" "));
}
