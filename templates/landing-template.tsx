import type { ReactNode } from "react";

import { Card } from "@/ui/surface";
import { BodyText, Eyebrow, PageHeading } from "@/ui/typography";
import { layoutTokens } from "@/styles/tokens";

import { PageShell } from "./page-shell";

type HeroContent = {
  eyebrow: string;
  heading: string;
  description: string;
  actions?: ReactNode;
};

type FeatureCard = {
  title: string;
  description: string;
  action?: ReactNode;
};

type LandingTemplateProps = {
  hero: HeroContent;
  featureCards: FeatureCard[];
  footer?: ReactNode;
};

export function LandingTemplate({ hero, featureCards, footer }: LandingTemplateProps) {
  return (
    <PageShell>
      <Card variant="solid" className={layoutTokens.sectionStack}>
        <div className="flex flex-col gap-3">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <PageHeading>{hero.heading}</PageHeading>
          <BodyText className="max-w-2xl">{hero.description}</BodyText>
        </div>
  {hero.actions ? <div className="flex flex-wrap gap-3">{hero.actions}</div> : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((card) => (
          <Card key={card.title} className="flex h-full flex-col gap-3 p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-neutral-900">{card.title}</h2>
              <BodyText>{card.description}</BodyText>
            </div>
            {card.action ? <div className="mt-auto">{card.action}</div> : null}
          </Card>
        ))}
      </div>

      {footer}
    </PageShell>
  );
}
