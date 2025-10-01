'use client';

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { layoutTokens } from "@/styles/tokens";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  padding?: "default" | "compact";
  background?: "default" | "muted";
};

const paddingMap = {
  default: `${layoutTokens.pagePaddingX} ${layoutTokens.pagePaddingY}`,
  compact: `${layoutTokens.pagePaddingX} py-6`,
} as const;

const backgroundMap = {
  default: "bg-background",
  muted: "bg-neutral-50",
} as const;

export function PageShell({
  children,
  className,
  padding = "default",
  background = "default",
}: PageShellProps) {
  return (
    <div className={cn(backgroundMap[background], "flex flex-1 flex-col")}>
      <div
        className={cn(
          layoutTokens.container,
          paddingMap[padding],
          layoutTokens.pageStack,
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
