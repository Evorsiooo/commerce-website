import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { getPublicBusinesses } from "@/lib/data/public";
import { cn, formatBusinessType, humanizeEnum } from "@/lib/utils";
import { Button } from "@/ui/button";

export const metadata: Metadata = {
  title: "Business Directory | Commerce Office Portal",
  description: "Browse registered businesses operating across Harrison County.",
};

type BusinessDirectoryPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

const STATUS_OPTIONS = [
  { value: "active", label: "Approved" },
  { value: "suspended", label: "Suspended" },
  { value: "closed", label: "Revoked" },
  { value: "all", label: "All statuses" },
] as const;

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "updated", label: "Recently Updated" },
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export default async function BusinessDirectoryPage({ searchParams }: BusinessDirectoryPageProps) {
  const businesses = await getPublicBusinesses();
  const params = await searchParams;

  const statusFilter = normalizeStatusFilter(getSingleParam(params?.status));
  const sortOption = normalizeSortOption(getSingleParam(params?.sort));

  const filtered = businesses.filter((business) => {
    if (statusFilter === "all") {
      return true;
    }
    return business.status === statusFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === "updated") {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    }
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  });

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Public Directory
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Business Directory</h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          Browse the organizations licensed to operate within Harrison County. Filter by status or
          sort to quickly find the entity you&apos;re investigating.
        </p>
      </header>

      <DirectoryFilters status={statusFilter} sort={sortOption} />

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          No businesses matched your filters. Adjust the status toggle above to explore other
          results.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((business) => (
            <article
              key={business.id}
              className="flex h-full flex-col gap-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <BusinessLogo path={business.logo_storage_path} name={business.name} />

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
                      {business.name}
                    </h2>
                    <StatusPill status={business.status} />
                    {business.industry ? (
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600">
                        {business.industry}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-neutral-600">
                    {business.purpose ?? "Business summary has not been published yet."}
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 text-sm text-neutral-700">
                <Field label="Owner" value={extractOwnerName(business.governance_json)} />
                <Field label="Entity Type" value={formatBusinessType(business.type)} />
                <Field label="Status" value={humanizeEnum(business.status)} />
                <Field
                  label="Discord"
                  value={
                    business.discord_url ? (
                      <Button
                        asChild
                        className="bg-[#5562ea] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[#4b56d2]"
                      >
                        <Link href={business.discord_url} target="_blank" rel="noreferrer">
                          Join Discord
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-neutral-500">Not provided</span>
                    )
                  }
                />
              </dl>

              <Button asChild variant="outline" className="self-start">
                <Link href={`/businesses/${business.id}`}>View business profile</Link>
              </Button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function normalizeStatusFilter(input: string | undefined): StatusValue {
  const fallback: StatusValue = "active";
  if (!input) {
    return fallback;
  }

  const match = STATUS_OPTIONS.find((option) => option.value === input);
  return match?.value ?? fallback;
}

function normalizeSortOption(input: string | undefined): SortValue {
  const fallback: SortValue = "name";
  if (!input) {
    return fallback;
  }

  const match = SORT_OPTIONS.find((option) => option.value === input);
  return match?.value ?? fallback;
}

type DirectoryFiltersProps = {
  status: (typeof STATUS_OPTIONS)[number]["value"];
  sort: (typeof SORT_OPTIONS)[number]["value"];
};

function DirectoryFilters({ status, sort }: DirectoryFiltersProps) {
  const buildHref = (overrides: Partial<Record<"status" | "sort", string>>) => {
    const params = new URLSearchParams();
    params.set("status", overrides.status ?? status);
    params.set("sort", overrides.sort ?? sort);
    return `?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={buildHref({ status: option.value })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
              status === option.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">Sort by</span>
        {SORT_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={buildHref({ sort: option.value })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide transition",
              sort === option.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: ReactNode;
};

function Field({ label, value }: FieldProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <dt className="w-28 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="text-sm text-neutral-700">{value}</dd>
    </div>
  );
}

function BusinessLogo({ path, name }: { path: string | null; name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!path) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-sm font-semibold text-neutral-400">
        {initials}
      </div>
    );
  }

  const publicUrl = buildPublicStorageUrl(path);

  if (!publicUrl) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-sm font-semibold text-neutral-400">
        {initials}
      </div>
    );
  }

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
      <Image
        src={publicUrl}
        alt={`${name} logo`}
        fill
        sizes="64px"
        className="object-cover"
      />
    </div>
  );
}

function getSingleParam(input: string | string[] | undefined): string | undefined {
  if (Array.isArray(input)) {
    return input[0];
  }
  return input;
}

function buildPublicStorageUrl(path: string): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${path}`;
}

function extractOwnerName(governance: unknown) {
  if (typeof governance === "object" && governance !== null) {
    const maybeOwner =
      (governance as Record<string, unknown>).owner ??
      (governance as Record<string, unknown>).primary_contact;
    if (typeof maybeOwner === "string" && maybeOwner.trim().length > 0) {
      return maybeOwner;
    }
    if (
      maybeOwner &&
      typeof maybeOwner === "object" &&
      maybeOwner !== null &&
      "name" in maybeOwner &&
      typeof (maybeOwner as Record<string, unknown>).name === "string"
    ) {
      return (maybeOwner as Record<string, string>).name;
    }
  }

  return <span className="text-neutral-500">Owner details pending</span>;
}

function StatusPill({ status }: { status: string }) {
  const palette: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    suspended: "bg-amber-100 text-amber-800",
    closed: "bg-rose-100 text-rose-800",
  };

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        palette[status] ?? "bg-neutral-100 text-neutral-600",
      )}
    >
      {humanizeEnum(status)}
    </span>
  );
}
