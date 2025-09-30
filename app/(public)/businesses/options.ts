export const STATUS_OPTIONS = [
  { value: "active", label: "Approved" },
  { value: "suspended", label: "Suspended" },
  { value: "closed", label: "Revoked" },
  { value: "all", label: "All statuses" },
] as const;

export const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "updated", label: "Recently Updated" },
] as const;

export type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const DEFAULT_STATUS: StatusValue = "active";
const DEFAULT_SORT: SortValue = "name";

export function normalizeStatus(value: string | null | undefined): StatusValue {
  if (!value) {
    return DEFAULT_STATUS;
  }

  const match = STATUS_OPTIONS.find((option) => option.value === value);
  return match?.value ?? DEFAULT_STATUS;
}

export function normalizeSort(value: string | null | undefined): SortValue {
  if (!value) {
    return DEFAULT_SORT;
  }

  const match = SORT_OPTIONS.find((option) => option.value === value);
  return match?.value ?? DEFAULT_SORT;
}

export function buildQuery(status: StatusValue, sort: SortValue) {
  const params = new URLSearchParams();

  if (status !== DEFAULT_STATUS) {
    params.set("status", status);
  }

  if (sort !== DEFAULT_SORT) {
    params.set("sort", sort);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
