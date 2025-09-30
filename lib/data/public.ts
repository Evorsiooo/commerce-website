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
>;

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
    .select("id, name, address, status, photo_storage_path, updated_at")
    .in("status", ["available", "pending"])
    .order("status")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load properties: ${error.message}`);
  }

  return data ?? [];
});

export const getPublishedRegulations = cache(async (): Promise<PublishedRegulation[]> => {
  const supabase = getPublicSupabaseClient();
  const { data, error } = await supabase
    .from("regulations")
    .select(
      "id, slug, title, summary, body_markdown, effective_at, published_at, tags, category, subcategory",
    )
    .eq("status", "published")
    .order("effective_at", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load regulations: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
    category: item.category ?? "General",
    subcategory: item.subcategory ?? "General",
  }));
});
