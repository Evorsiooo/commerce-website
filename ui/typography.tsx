'use client';

import { type ComponentPropsWithoutRef, type ElementType } from "react";

import { cn } from "@/lib/utils";
import { textTokens } from "@/styles/tokens";

type TypographyProps<T extends ElementType> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

function createTypographyComponent<T extends ElementType>(
  defaultTag: T,
  baseClassName: string,
) {
  return function TypographyComponent({
    as,
    className,
    ...rest
  }: TypographyProps<T>) {
    const Component = (as ?? defaultTag) as ElementType;
    return <Component className={cn(baseClassName, className)} {...rest} />;
  };
}

export const Eyebrow = createTypographyComponent("span", textTokens.eyebrow);
export const PageHeading = createTypographyComponent("h1", textTokens.pageHeading);
export const SectionHeading = createTypographyComponent("h2", textTokens.sectionHeading);
export const BodyText = createTypographyComponent("p", textTokens.body);
export const SmallMuted = createTypographyComponent("p", textTokens.smallMuted);
