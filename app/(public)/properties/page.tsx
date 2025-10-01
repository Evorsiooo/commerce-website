import type { Metadata } from "next";

import directoryContent from "@/config/pages/properties-directory.json";
import { getPublicProperties } from "@/lib/data/public";

import { PropertyDirectoryClient } from "./property-directory-client";

export const metadata: Metadata = {
  title: "Property Directory | Commerce Office Portal",
  description: directoryContent.intro.description,
};

export default async function PropertyDirectoryPage() {
  const properties = await getPublicProperties();

  return <PropertyDirectoryClient properties={properties} />;
}
