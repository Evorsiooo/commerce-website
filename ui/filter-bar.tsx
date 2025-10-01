'use client';

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/ui/surface";
import { Eyebrow } from "@/ui/typography";

type FilterBarProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

export function FilterBar({ label, children, className }: FilterBarProps) {
  return (
    <Card className={cn("flex flex-wrap items-center gap-3", className)}>
      {label ? <Eyebrow as="span">{label}</Eyebrow> : null}
      {children}
    </Card>
  );
}
