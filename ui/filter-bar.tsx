'use client';

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Eyebrow } from "@/ui/typography";

type FilterBarProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

export function FilterBar({ label, children, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {label ? <Eyebrow as="span" className="shrink-0">{label}</Eyebrow> : null}
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
