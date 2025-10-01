import type { Metadata } from "next";

import directoryContent from "@/config/pages/businesses-directory.json";
import { getPublicBusinesses } from "@/lib/data/public";
import { BusinessDirectoryClient } from "./business-directory-client";
import { normalizeSort, normalizeStatus } from "./options";

export const metadata: Metadata = {
  title: "Business Directory | Commerce Office Portal",
  description: directoryContent.intro.description,
};

type BusinessDirectoryPageProps = {
  searchParams?: Promise<Record<string, string | string[]>>;
};

export default async function BusinessDirectoryPage({ searchParams }: BusinessDirectoryPageProps) {
  const businesses = await getPublicBusinesses();
  const params = await searchParams;

  const statusFilter = normalizeStatus(getSingleParam(params?.status));
  const sortOption = normalizeSort(getSingleParam(params?.sort));

  return (
    <BusinessDirectoryClient
      businesses={businesses}
      initialStatus={statusFilter}
      initialSort={sortOption}
    />
  );
}

function getSingleParam(input: string | string[] | undefined): string | undefined {
  if (Array.isArray(input)) {
    return input[0];
  }
  return input;
}
