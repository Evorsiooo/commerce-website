import type { Metadata } from "next";

import directoryContent from "@/config/pages/regulations-directory.json";
import { getPublishedRegulations } from "@/lib/data/public";

import { RegulationsDirectoryClient } from "./regulations-directory-client";

export const metadata: Metadata = {
  title: "Regulations Directory | Commerce Office Portal",
  description: directoryContent.intro.description,
};

export default async function RegulationsPage() {
  const regulations = await getPublishedRegulations();

  return <RegulationsDirectoryClient regulations={regulations} />;
}
