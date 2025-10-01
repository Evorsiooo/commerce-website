'use client';

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { surfaceTokens } from "@/styles/tokens";

type CardVariant = "solid" | "subtle" | "dashed";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

const variantMap: Record<CardVariant, string> = {
  solid: surfaceTokens.card,
  subtle: surfaceTokens.subtleCard,
  dashed: surfaceTokens.dashed,
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "subtle", ...props }, ref) => {
    return (
      <div ref={ref} className={cn(variantMap[variant], className)} {...props} />
    );
  },
);

Card.displayName = "Card";
