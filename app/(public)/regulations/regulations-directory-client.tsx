'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { PublishedRegulation } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";

const ALL_TAG = "__all__";

type RegulationsDirectoryClientProps = {
  regulations: PublishedRegulation[];
};

export function RegulationsDirectoryClient({ regulations }: RegulationsDirectoryClientProps) {
  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    for (const regulation of regulations) {
      for (const tag of regulation.tags ?? []) {
        if (tag && tag.trim().length > 0) {
          tagSet.add(tag.trim());
        }
      }
    }

    return [ALL_TAG, ...Array.from(tagSet).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))];
  }, [regulations]);

  const [activeTag, setActiveTag] = useState<string>(ALL_TAG);

  const filtered = useMemo(() => {
    if (activeTag === ALL_TAG) {
      return regulations;
    }

    return regulations.filter((regulation) => (regulation.tags ?? []).includes(activeTag));
  }, [activeTag, regulations]);

  if (regulations.length === 0) {
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

        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          No regulations have been published yet. Once a compliance admin publishes entries they will
          appear here immediately.
        </p>
      </section>
    );
  }

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

      {tagOptions.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Categories
          </span>
          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={
                activeTag === tag
                  ? "rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                  : "rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 hover:border-neutral-400"
              }
            >
              {tag === ALL_TAG ? "All" : tag}
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
          No regulations match the selected category yet. Choose another category to continue browsing.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <nav className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Quick Links</p>
            <ul className="mt-3 grid gap-2 text-sm">
              {filtered.map((regulation) => (
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
            {filtered.map((regulation) => (
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
                    {(regulation.tags ?? []).length > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                        {(regulation.tags ?? []).join(" • ")}
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
