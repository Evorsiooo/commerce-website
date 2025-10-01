'use client';

import type { ReactNode } from "react";

import { Card } from "@/ui/surface";
import { BodyText, SectionHeading } from "@/ui/typography";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card variant="dashed" className="text-center">
      <div className="flex flex-col items-center gap-3 text-center">
  <SectionHeading>{title}</SectionHeading>
        <BodyText className="max-w-xl text-center">{description}</BodyText>
        {action}
      </div>
    </Card>
  );
}
