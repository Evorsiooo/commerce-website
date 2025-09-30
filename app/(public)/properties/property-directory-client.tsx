'use client';

import { useMemo, useState } from "react";
import type { PublicProperty } from "@/lib/data/public";
import { cn, formatDate, humanizeEnum } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Updated" },
  { value: "name", label: "Alphabetical" },
  { value: "status", label: "Status" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type PropertyDirectoryClientProps = {
  properties: PublicProperty[];
};

export function PropertyDirectoryClient({ properties }: PropertyDirectoryClientProps) {
  const [sort, setSort] = useState<SortValue>("recent");

  const sorted = useMemo(() => {
    const copy = [...properties];

    switch (sort) {
      case "name":
        return copy.sort((a, b) => {
          const aName = (a.name ?? a.address ?? "").toLowerCase();
          const bName = (b.name ?? b.address ?? "").toLowerCase();
          return aName.localeCompare(bName, "en", { sensitivity: "base" });
        });
      case "status":
        return copy.sort((a, b) => {
          const order: Record<string, number> = { available: 0, pending: 1 };
          const diff = (order[a.status] ?? 99) - (order[b.status] ?? 99);
          if (diff !== 0) {
            return diff;
          }
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      case "recent":
      default:
        return copy.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
    }
  }, [properties, sort]);

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Public Directory
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Available Properties</h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          Listings display the latest inventory that is open for proposals or currently pending review.
          Staff updates propagate here automatically once statuses change.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sort by</span>
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSort(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition",
              sort === option.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          No properties are publicly listed right now. Check back soon or submit a tipline report if
          you believe a property should appear here.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((property) => (
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
                    property.status === "available"
                      ? "bg-emerald-100 text-emerald-800"
                      : property.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-neutral-100 text-neutral-600",
                  )}
                >
                  {humanizeEnum(property.status)}
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
