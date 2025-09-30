'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { PublishedRegulation } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";

const ALL_SECTIONS = "__all__";

type RegulationsDirectoryClientProps = {
  regulations: PublishedRegulation[];
};

export function RegulationsDirectoryClient({ regulations }: RegulationsDirectoryClientProps) {
  const catalog = useMemo(() => {
    const categoryMap = new Map<string, Map<string, PublishedRegulation[]>>();

    for (const regulation of regulations) {
      const category = regulation.category ?? "General";
      const section = regulation.subcategory ?? "General";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }

      const sectionMap = categoryMap.get(category)!;
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }

      sectionMap.get(section)!.push(regulation);
    }

    return Array.from(categoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "en", { sensitivity: "base" }))
      .map(([category, sections]) => ({
        category,
        sections: Array.from(sections.entries())
          .sort(([a], [b]) => a.localeCompare(b, "en", { sensitivity: "base" }))
          .map(([name, entries]) => ({
            name,
            entries: entries.sort((a, b) => {
              const aDate = new Date(a.effective_at ?? a.published_at ?? 0).getTime();
              const bDate = new Date(b.effective_at ?? b.published_at ?? 0).getTime();
              return bDate - aDate;
            }),
          })),
      }));
  }, [regulations]);

  const [activeCategory, setActiveCategory] = useState(() => catalog[0]?.category ?? "General");
  const activeCategoryData = catalog.find((entry) => entry.category === activeCategory);

  const sectionOptions = useMemo(() => {
    if (!activeCategoryData) {
      return [ALL_SECTIONS];
    }

    return [
      ALL_SECTIONS,
      ...activeCategoryData.sections.map((section) => section.name),
    ];
  }, [activeCategoryData]);

  const [activeSection, setActiveSection] = useState<string>(ALL_SECTIONS);

  useEffect(() => {
    if (activeCategoryData) {
      return;
    }

    const fallbackCategory = catalog[0]?.category ?? "General";
    setActiveCategory(fallbackCategory);
    setActiveSection(ALL_SECTIONS);
  }, [catalog, activeCategoryData]);

  const sectionsToRender = useMemo(() => {
    if (!activeCategoryData) {
      return [];
    }

    if (activeSection === ALL_SECTIONS) {
      return activeCategoryData.sections;
    }

    return activeCategoryData.sections.filter((section) => section.name === activeSection);
  }, [activeCategoryData, activeSection]);

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

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Regulation Families
          </span>
          {catalog.map((entry) => (
            <button
              key={entry.category}
              type="button"
              onClick={() => {
                setActiveCategory(entry.category);
                setActiveSection(ALL_SECTIONS);
              }}
              className={
                activeCategory === entry.category
                  ? "rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                  : "rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 hover:border-neutral-400"
              }
            >
              {entry.category}
            </button>
          ))}
        </div>

        {sectionOptions.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Chapters
            </span>
            {sectionOptions.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={
                  activeSection === section
                    ? "rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                    : "rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 hover:border-neutral-400"
                }
              >
                {section === ALL_SECTIONS ? "All" : section}
              </button>
            ))}
          </div>
        ) : null}

        <nav className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Quick Links</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {sectionsToRender.flatMap((section) =>
              section.entries.map((regulation) => (
                <li key={regulation.id}>
                  <Link
                    href={`#${regulation.slug}`}
                    className="text-neutral-700 underline-offset-2 hover:underline"
                  >
                    {regulation.title}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </nav>

        {sectionsToRender.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-600">
            No regulations match the selected chapter yet. Choose another category to continue browsing.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {sectionsToRender.map((section) => (
              <div key={section.name} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {activeCategory}
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                    {section.name}
                  </h2>
                </div>

                <div className="flex flex-col gap-6">
                  {section.entries.map((regulation) => (
                    <article
                      key={regulation.id}
                      id={regulation.slug}
                      className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
                    >
                      <header className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold tracking-tight text-neutral-900">
                            {regulation.title}
                          </h3>
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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {regulation.body_markdown}
                        </ReactMarkdown>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
