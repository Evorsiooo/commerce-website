import type { Metadata } from "next";

import { getPublicProperties } from "@/lib/data/public";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Property Directory | Commerce Office Portal",
  description: "Preview state-owned properties that are pending assignment or open for proposals.",
};

const statusStyles: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
};

export default async function PropertyDirectoryPage() {
  const properties = await getPublicProperties();

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Public Directory</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Available Properties</h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          Listings display the latest inventory that is open for proposals or currently pending review.
          Staff updates propagate here automatically once statuses change.
        </p>
      </header>

      {properties.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          No properties are publicly listed right now. Check back soon or submit a tipline report if
          you believe a property should appear here.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {properties.map((property) => (
            <article
              key={property.id}
              className="flex h-full flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {property.name ?? property.address ?? "Unlisted property"}
                  </h2>
                  {property.address ? (
                    <p className="text-sm text-neutral-600">{property.address}</p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                    statusStyles[property.status] ?? "bg-neutral-100 text-neutral-600",
                  )}
                >
                  {property.status}
                </span>
              </header>

              <p className="text-xs text-neutral-500">
                Last updated {formatDate(property.updated_at)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
