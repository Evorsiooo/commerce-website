import type { Metadata } from "next";
import Link from "next/link";

import { getPublicBusinesses } from "@/lib/data/public";
import { formatDate, humanizeEnum } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Business Directory | Commerce Office Portal",
  description: "Browse approved businesses that are active across the commerce office.",
};

export default async function BusinessDirectoryPage() {
  const businesses = await getPublicBusinesses();

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Public Directory
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Approved Businesses</h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          These entities are in good standing and have passed licensing review. Contact details
          and employee resources are provided when available.
        </p>
      </header>

      {businesses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          No businesses are published yet. Once staff approve new applications they will appear
          here automatically.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {businesses.map((business) => (
            <article
              key={business.id}
              className="flex h-full flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">{business.name}</h2>
                  {business.industry ? (
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600">
                      {business.industry}
                    </span>
                  ) : null}
                </div>
                {business.purpose ? (
                  <p className="text-sm text-neutral-600">{business.purpose}</p>
                ) : (
                  <p className="text-sm text-neutral-500 italic">Purpose not provided.</p>
                )}
              </div>

              <dl className="grid gap-2 text-sm text-neutral-600">
                <div className="flex gap-2">
                  <dt className="w-24 font-medium text-neutral-500">Type</dt>
                  <dd className="capitalize">{humanizeEnum(business.type)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 font-medium text-neutral-500">Updated</dt>
                  <dd>{formatDate(business.updated_at)}</dd>
                </div>
                {business.discord_url ? (
                  <div className="flex gap-2">
                    <dt className="w-24 font-medium text-neutral-500">Discord</dt>
                    <dd>
                      <Link
                        href={business.discord_url}
                        className="underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Community Server
                      </Link>
                    </dd>
                  </div>
                ) : null}
                {business.employee_db_url ? (
                  <div className="flex gap-2">
                    <dt className="w-24 font-medium text-neutral-500">Staff DB</dt>
                    <dd>
                      <Link
                        href={business.employee_db_url}
                        className="underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Internal resources
                      </Link>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
