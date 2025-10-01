import { cache } from "react";

import type { Database } from "@/db/types/supabase";
import { getPublicSupabaseClient } from "@/lib/supabase/public";

export type PublicBusiness = Pick<
  Database["public"]["Tables"]["businesses"]["Row"],
  | "id"
  | "name"
  | "industry"
  | "status"
  | "purpose"
  | "discord_url"
  | "type"
  | "updated_at"
  | "logo_storage_path"
  | "governance_json"
>;

export type PublicProperty = Pick<
  Database["public"]["Tables"]["properties"]["Row"],
  | "id"
  | "name"
  | "address"
  | "status"
  | "photo_storage_path"
  | "updated_at"
  | "current_business_id"
> & {
  current_business: Pick<
    Database["public"]["Tables"]["businesses"]["Row"],
    "id" | "name" | "logo_storage_path" | "status"
  > | null;
};

export type PublishedRegulation = Pick<
  Database["public"]["Tables"]["regulations"]["Row"],
  | "id"
  | "slug"
  | "title"
  | "summary"
  | "body_markdown"
  | "effective_at"
  | "published_at"
  | "tags"
  | "category"
  | "subcategory"
>;

type LegacyPublishedRegulation = Omit<PublishedRegulation, "category" | "subcategory">;

export const getPublicBusinesses = cache(async (): Promise<PublicBusiness[]> => {
  const supabase = getPublicSupabaseClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, name, industry, status, purpose, discord_url, type, updated_at, logo_storage_path, governance_json",
    )
    .order("name");

  if (error) {
    throw new Error(`Failed to load businesses: ${error.message}`);
  }

  return data ?? [];
});

export const getPublicProperties = cache(async (): Promise<PublicProperty[]> => {
  const supabase = getPublicSupabaseClient();
  const { data, error } = await supabase
    .from("properties")
    .select(`
      id,
      name,
      address,
      status,
      photo_storage_path,
      updated_at,
      current_business_id,
      current_business:businesses!properties_current_business_id_fkey (
        id,
        name,
        logo_storage_path,
        status
      )
    `)
    .in("status", ["available", "pending"])
    .order("status")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load properties: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    ...item,
    current_business: (item as PublicProperty).current_business ?? null,
  }));
});

export const getPublishedRegulations = cache(async (): Promise<PublishedRegulation[]> => {
  const supabase = getPublicSupabaseClient();

  const selectWithCategories =
    "id, slug, title, summary, body_markdown, effective_at, published_at, tags, category, subcategory";

  const { data, error } = await supabase
    .from("regulations")
    .select(selectWithCategories)
    .eq("status", "published")
    .order("effective_at", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false });

  if (!error) {
    const rows = ((data ?? []) as PublishedRegulation[]);
    return rows.map((item) => ({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags : [],
      category: item.category ?? "General",
      subcategory: item.subcategory ?? "General",
    }));
  }

  const isMissingColumnError =
    error.code === "42703" || /column .*category.* does not exist/i.test(error.message);

  if (!isMissingColumnError) {
    throw new Error(`Failed to load regulations: ${error.message}`);
  }

  const fallbackSelect =
    "id, slug, title, summary, body_markdown, effective_at, published_at, tags";
  const { data: fallbackData, error: fallbackError } = await supabase
    .from("regulations")
    .select(fallbackSelect)
    .eq("status", "published")
    .order("effective_at", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false });

  if (fallbackError) {
    throw new Error(`Failed to load regulations: ${fallbackError.message}`);
  }

  const legacyRows = ((fallbackData ?? []) as LegacyPublishedRegulation[]);
  return legacyRows.map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
    category: "General",
    subcategory: "General",
  }));
});
