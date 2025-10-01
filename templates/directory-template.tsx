'use client';

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/ui/surface";
import { BodyText, Eyebrow, PageHeading } from "@/ui/typography";
import { layoutTokens } from "@/styles/tokens";

import { PageShell } from "./page-shell";

type DirectoryIntro = {
  eyebrow: string;
  heading: string;
  description: string;
};

type DirectoryTemplateProps = {
  intro: DirectoryIntro;
  children: ReactNode;
  toolbar?: ReactNode;
  aside?: ReactNode;
  emptyState?: ReactNode;
  isEmpty?: boolean;
};

export function DirectoryTemplate({
  intro,
  children,
  toolbar,
  aside,
  emptyState,
  isEmpty,
}: DirectoryTemplateProps) {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>{intro.eyebrow}</Eyebrow>
          <PageHeading>{intro.heading}</PageHeading>
          <BodyText className="max-w-2xl">{intro.description}</BodyText>
        </div>

        {toolbar ? <Card className="flex flex-wrap items-center gap-3">{toolbar}</Card> : null}

        <div
          className={cn(
            "gap-6",
            aside
              ? "grid lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]"
              : layoutTokens.sectionStack,
          )}
        >
          <div className="flex flex-col gap-4">
            {isEmpty && emptyState ? emptyState : children}
          </div>
          {aside ? <div className="flex flex-col gap-4">{aside}</div> : null}
        </div>
      </div>
    </PageShell>
  );
}
