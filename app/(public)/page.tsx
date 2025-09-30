import Link from "next/link";

import { Button } from "@/ui/button";

export default function Home() {
  return (
    <section className="flex flex-1 flex-col gap-10">
      <div className="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-neutral-500">
            Harrison County Executive Commerce Office
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A single home for businesses, permits, and compliance.
          </h1>
          <p className="max-w-2xl text-neutral-600">
            This portal consolidates applications, staff reviews, tipline reports, and property assignments into a secure Supabase + Next.js stack. Phase 1 locks in our foundation so later phases can ship quickly without rewrites.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/auth/login">Sign in with Discord</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/link-accounts">Link Roblox account</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-1 text-sm text-neutral-600">{card.body}</p>
            </div>
            <Link
              href={card.href}
              className="mt-auto text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
            >
              {card.action}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

const cards = [
  {
    title: "Regulations Library",
    body: "Browse the compliance catalogue maintained by staff so your business always meets the latest policies.",
    action: "Read regulations",
    href: "/regulations",
  },
  {
    title: "Business Directory",
    body: "See which entities are in good standing and reach their community and staffing resources in one spot.",
    action: "View businesses",
    href: "/businesses",
  },
  {
    title: "Property Inventory",
    body: "Track parcels that are available or pending assignment so proposals stay transparent and fair.",
    action: "Explore properties",
    href: "/properties",
  },
  {
    title: "Compliance Tipline",
    body: "Share leads or concerns with the compliance bureau. Anonymous submissions are welcome.",
    action: "Send a tip",
    href: "/tipline",
  },
] satisfies Array<{ title: string; body: string; action: string; href: string }>;
