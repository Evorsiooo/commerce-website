import type { Metadata } from "next";
import { getPublishedRegulations } from "@/lib/data/public";
import { RegulationsDirectoryClient } from "./regulations-directory-client";

export const metadata: Metadata = {
  title: "Regulations | Commerce Office Portal",
  description: "Published regulations and guidance for businesses operating within the commerce office.",
};

export default async function RegulationsPage() {
  const regulations = await getPublishedRegulations();

  return <RegulationsDirectoryClient regulations={regulations} />;
}
