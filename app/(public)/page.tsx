import Link from "next/link";

import homeContent from "@/config/pages/home.json";
import { LandingTemplate } from "@/templates/landing-template";
import { Button } from "@/ui/button";

export default function Home() {
  const heroAction = homeContent.hero.primaryCta ? (
    <Button asChild>
      <Link href={homeContent.hero.primaryCta.href}>{homeContent.hero.primaryCta.label}</Link>
    </Button>
  ) : null;

  const featureCards = homeContent.features.map((feature) => ({
    title: feature.title,
    description: feature.description,
    action: (
      <Link
        href={feature.action.href}
        className="text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
      >
        {feature.action.label}
      </Link>
    ),
  }));

  return (
    <LandingTemplate
      hero={{
        eyebrow: homeContent.hero.eyebrow,
        heading: homeContent.hero.heading,
        description: homeContent.hero.description,
        actions: heroAction ?? undefined,
      }}
      featureCards={featureCards}
    />
  );
}
