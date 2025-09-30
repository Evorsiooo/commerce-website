import type { Metadata } from "next";

import { getPublicProperties } from "@/lib/data/public";

import { PropertyDirectoryClient } from "./property-directory-client";

export const metadata: Metadata = {
  title: "Property Directory | Commerce Office Portal",
  description: "Preview state-owned properties that are pending assignment or open for proposals.",
};

export default async function PropertyDirectoryPage() {
  const properties = await getPublicProperties();

  return <PropertyDirectoryClient properties={properties} />;
}
