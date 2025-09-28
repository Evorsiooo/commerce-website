import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getPublishedRegulations } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Regulations | Commerce Office Portal",
  description: "Published regulations and guidance for businesses operating within the commerce office.",
};

export default async function RegulationsPage() {
  const regulations = await getPublishedRegulations();

  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Regulations & Guidance
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Published Regulations</h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          The compliance team maintains this catalogue to keep businesses informed. Entries are
          listed by effective date, and new material is highlighted automatically.
        </p>
      </header>

      {regulations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          No regulations have been published yet. Once a compliance admin publishes entries they will
          appear here immediately.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <nav className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Quick Links
            </p>
            <ul className="mt-3 grid gap-2 text-sm">
              {regulations.map((regulation) => (
                <li key={regulation.id}>
                  <Link
                    href={`#${regulation.slug}`}
                    className="text-neutral-700 underline-offset-2 hover:underline"
                  >
                    {regulation.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-8">
            {regulations.map((regulation) => (
              <article
                key={regulation.id}
                id={regulation.slug}
                className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
              >
                <header className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                      {regulation.title}
                    </h2>
                    {regulation.tags.length > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                        {regulation.tags.join(" • ")}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-neutral-500">
                    Effective {formatDate(regulation.effective_at ?? regulation.published_at)}
                    {regulation.published_at
                      ? ` • Published ${formatDate(regulation.published_at)}`
                      : null}
                  </div>
                  {regulation.summary ? (
                    <p className="text-sm text-neutral-600">{regulation.summary}</p>
                  ) : null}
                </header>

                <div className="prose mt-6 max-w-none prose-headings:mt-6 prose-headings:font-semibold prose-p:leading-7 prose-li:marker:text-neutral-500">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{regulation.body_markdown}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
