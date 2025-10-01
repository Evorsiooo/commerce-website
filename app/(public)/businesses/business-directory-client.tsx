'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import directoryContent from "@/config/pages/businesses-directory.json";
import type { PublicBusiness } from "@/lib/data/public";
import { cn, formatBusinessType, humanizeEnum } from "@/lib/utils";
import { DirectoryTemplate } from "@/templates/directory-template";
import { EmptyState } from "@/ui/empty-state";
import { FilterBar } from "@/ui/filter-bar";
import { PillToggleGroup } from "@/ui/pill-toggle-group";
import { Card } from "@/ui/surface";
import { Button } from "@/ui/button";

import {
  SORT_OPTIONS,
  STATUS_OPTIONS,
  SortValue,
  StatusValue,
  buildQuery,
  normalizeSort,
  normalizeStatus,
} from "./options";

type BusinessDirectoryClientProps = {
  businesses: PublicBusiness[];
  initialStatus: StatusValue;
  initialSort: SortValue;
};

export function BusinessDirectoryClient({
  businesses,
  initialStatus,
  initialSort,
}: BusinessDirectoryClientProps) {
  const [status, setStatus] = useState<StatusValue>(initialStatus);
  const [sort, setSort] = useState<SortValue>(initialSort);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const nextStatus = normalizeStatus(searchParams?.get("status"));
    const nextSort = normalizeSort(searchParams?.get("sort"));

    setStatus(nextStatus);
    setSort(nextSort);
  }, [searchParams]);

  const businessesToRender = useMemo(() => {
    const filtered =
      status === "all" ? businesses : businesses.filter((business) => business.status === status);

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "updated") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }

      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    });

    return sorted;
  }, [businesses, status, sort]);

  const updateRoute = (nextStatus: StatusValue, nextSort: SortValue) => {
    startTransition(() => {
      router.replace(`${pathname}${buildQuery(nextStatus, nextSort)}`, { scroll: false });
    });
  };

  const handleStatusChange = (value: StatusValue) => {
    if (value === status) {
      return;
    }

    setStatus(value);
    updateRoute(value, sort);
  };

  const handleSortChange = (value: SortValue) => {
    if (value === sort) {
      return;
    }

    setSort(value);
    updateRoute(status, value);
  };

  return (
    <DirectoryTemplate
      intro={directoryContent.intro}
      toolbar={
        <FilterBar className="gap-6">
          <PillToggleGroup
            label="Status"
            value={status}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            disabled={isPending}
          />
          <PillToggleGroup
            label="Sort by"
            value={sort}
            onChange={handleSortChange}
            options={SORT_OPTIONS}
            disabled={isPending}
          />
        </FilterBar>
      }
      isEmpty={businessesToRender.length === 0}
      emptyState={
        <EmptyState
          title={directoryContent.empty.title}
          description={directoryContent.empty.description}
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {businessesToRender.map((business) => (
          <Card key={business.id} className="flex h-full flex-col gap-5">
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
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link href={`/businesses/${business.id}`}>Business Page</Link>
              </Button>
              {business.discord_url ? (
                <Link
                  href={business.discord_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
                >
                  Join Discord
                </Link>
              ) : (
                <span className="text-sm text-neutral-500">Discord not provided</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </DirectoryTemplate>
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
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
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
      <Image src={publicUrl} alt={`${name} logo`} fill sizes="64px" className="object-cover" />
    </div>
  );
}

function buildPublicStorageUrl(path: string): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${path}`;
}

function extractOwnerName(governance: unknown) {
  if (typeof governance === 'object' && governance !== null) {
    const maybeOwner =
      (governance as Record<string, unknown>).owner ??
      (governance as Record<string, unknown>).primary_contact;
    if (typeof maybeOwner === 'string' && maybeOwner.trim().length > 0) {
      return maybeOwner;
    }
    if (
      maybeOwner &&
      typeof maybeOwner === 'object' &&
      maybeOwner !== null &&
      'name' in maybeOwner &&
      typeof (maybeOwner as Record<string, unknown>).name === 'string'
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
