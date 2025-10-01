'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import directoryContent from "@/config/pages/regulations-directory.json";
import type { PublishedRegulation } from "@/lib/data/public";
import { formatDate } from "@/lib/utils";
import { DirectoryTemplate } from "@/templates/directory-template";
import { EmptyState } from "@/ui/empty-state";
import { FilterBar } from "@/ui/filter-bar";
import { PillToggleGroup } from "@/ui/pill-toggle-group";
import { Card } from "@/ui/surface";

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

  const categoryOptions = useMemo<ReadonlyArray<{ value: string; label: string }>>(() => {
    return catalog.map((entry) => ({ value: entry.category, label: entry.category }));
  }, [catalog]);

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return categoryOptions[0]?.value ?? "General";
  });

  const activeCategoryData = catalog.find((entry) => entry.category === activeCategory);

  const sectionOptions = useMemo<ReadonlyArray<string>>(() => {
    if (!activeCategoryData) {
      return [ALL_SECTIONS];
    }

    return [ALL_SECTIONS, ...activeCategoryData.sections.map((section) => section.name)];
  }, [activeCategoryData]);

  const sectionToggleOptions = useMemo(
    () =>
      sectionOptions.map((section) => ({
        value: section,
        label: section === ALL_SECTIONS ? "All" : section,
      })),
    [sectionOptions],
  );

  const [activeSection, setActiveSection] = useState<string>(ALL_SECTIONS);

  useEffect(() => {
    if (activeCategoryData) {
      return;
    }

    const fallbackCategory = catalog[0]?.category ?? "General";
    setActiveCategory(fallbackCategory);
    setActiveSection(ALL_SECTIONS);
  }, [catalog, activeCategoryData]);

  useEffect(() => {
    if (!sectionOptions.includes(activeSection)) {
      setActiveSection(ALL_SECTIONS);
    }
  }, [sectionOptions, activeSection]);

  const sectionsToRender = useMemo(() => {
    if (!activeCategoryData) {
      return [];
    }

    if (activeSection === ALL_SECTIONS) {
      return activeCategoryData.sections;
    }

    return activeCategoryData.sections.filter((section) => section.name === activeSection);
  }, [activeCategoryData, activeSection]);

  const isEmpty = sectionsToRender.length === 0;

  const emptyStateContent =
    regulations.length === 0 ? (
      <EmptyState
        title={directoryContent.empty.title}
        description={directoryContent.empty.description}
      />
    ) : (
      <EmptyState
        title="No regulations match the selected filters"
        description="Choose another family or chapter to keep browsing published guidance."
      />
    );

  return (
    <DirectoryTemplate
      intro={directoryContent.intro}
      toolbar={
        categoryOptions.length > 0 ? (
          <FilterBar className="gap-6">
            <PillToggleGroup
              label="Regulation Families"
              value={activeCategory}
              onChange={(value) => {
                setActiveCategory(value);
                setActiveSection(ALL_SECTIONS);
              }}
              options={categoryOptions}
            />
            {sectionOptions.length > 1 ? (
              <PillToggleGroup
                label="Chapters"
                value={activeSection}
                onChange={setActiveSection}
                options={sectionToggleOptions}
              />
            ) : null}
          </FilterBar>
        ) : null
      }
      aside={
        isEmpty
          ? null
          : (
              <Card className="sticky top-28">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Quick Links
                </p>
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
              </Card>
            )
      }
      isEmpty={isEmpty}
      emptyState={emptyStateContent}
    >
      {sectionsToRender.map((section) => (
        <div key={section.name} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {activeCategory}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">{section.name}</h2>
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
                    {regulation.published_at ? ` • Published ${formatDate(regulation.published_at)}` : null}
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
    </DirectoryTemplate>
  );
}
