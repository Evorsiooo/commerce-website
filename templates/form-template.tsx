import type { ReactNode } from "react";

import { Card } from "@/ui/surface";
import { BodyText, Eyebrow, PageHeading } from "@/ui/typography";

import { PageShell } from "./page-shell";

type FormTemplateProps = {
  eyebrow: string;
  heading: string;
  description: string;
  form: ReactNode;
  helper?: ReactNode;
};

export function FormTemplate({ eyebrow, heading, description, form, helper }: FormTemplateProps) {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow>{eyebrow}</Eyebrow>
          <PageHeading>{heading}</PageHeading>
          <BodyText className="max-w-2xl">{description}</BodyText>
        </div>

        <Card>{form}</Card>
        {helper}
      </div>
    </PageShell>
  );
}
