'use client';

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import directoryContent from "@/config/pages/properties-directory.json";
import type { PublicProperty } from "@/lib/data/public";
import { buildPublicStorageUrl, cn, formatDate, humanizeEnum } from "@/lib/utils";
import { DirectoryTemplate } from "@/templates/directory-template";
import { EmptyState } from "@/ui/empty-state";
import { FilterBar } from "@/ui/filter-bar";
import { PillToggleGroup } from "@/ui/pill-toggle-group";
import { Card } from "@/ui/surface";

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

  const statusPalette: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
  };

  return (
    <DirectoryTemplate
      intro={directoryContent.intro}
      toolbar={
        <FilterBar>
          <PillToggleGroup
            label="Sort by"
            value={sort}
            onChange={setSort}
            options={SORT_OPTIONS}
          />
        </FilterBar>
      }
      isEmpty={sorted.length === 0}
      emptyState={
        <EmptyState
          title={directoryContent.empty.title}
          description={directoryContent.empty.description}
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((property) => (
          <Card key={property.id} className="flex h-full flex-col overflow-hidden p-0">
            <PropertyImage
              path={property.photo_storage_path}
              name={property.name ?? property.address ?? "Property photo"}
            />

            <div className="flex flex-1 flex-col gap-4 p-6">
              <header className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                      {property.name ?? property.address ?? "Unlisted property"}
                    </h2>
                    {property.address ? (
                      <p className="text-sm text-neutral-600">{property.address}</p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                      statusPalette[property.status] ?? "bg-neutral-100 text-neutral-600",
                    )}
                  >
                    {humanizeEnum(property.status)}
                  </span>
                </div>

                <CurrentBusinessSection property={property} />
              </header>

              <p className="text-xs text-neutral-500">
                Last updated {formatDate(property.updated_at)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </DirectoryTemplate>
  );
}

type PropertyImageProps = {
  path: string | null;
  name: string | null;
};

function PropertyImage({ path, name }: PropertyImageProps) {
  const publicUrl = buildPublicStorageUrl(path);

  if (!publicUrl) {
    return (
      <div className="flex h-40 w-full items-center justify-center bg-neutral-100 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Photo coming soon
      </div>
    );
  }

  return (
    <div className="relative h-40 w-full">
      <Image
        src={publicUrl}
        alt={name ?? "Property photo"}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

function CurrentBusinessSection({ property }: { property: PublicProperty }) {
  const owner = property.current_business;

  if (!owner) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Current Business
        </span>
        <span className="text-sm text-neutral-500">Unassigned</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Current Business
      </span>
      <Link
        href={`/businesses/${owner.id}`}
        className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
      >
        {owner.name}
      </Link>
    </div>
  );
}
