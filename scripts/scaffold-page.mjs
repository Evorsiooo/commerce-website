#!/usr/bin/env node

import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const TEMPLATE_OPTIONS = ["landing", "directory", "detail", "form", "utility"];

async function fileExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const param = argv[i];
    if (!param.startsWith("--")) {
      continue;
    }
    const key = param.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function toTitleCase(slug) {
  return slug
    .split(/[\/-]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function manifestNameFromRoute(route) {
  return route.replace(/\//g, "-");
}

function createPageContent(template, route, title) {
  const componentName = `${toTitleCase(route).replace(/\s+/g, "")}Page`;
  switch (template) {
    case "landing":
      return `import type { Metadata } from "next";

import content from "@/config/pages/${manifestNameFromRoute(route)}.json";
import { LandingTemplate } from "@/templates/landing-template";
import { Button } from "@/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "${title} | Commerce Office Portal",
  description: content.hero.description,
};

export default function ${componentName}() {
  const primaryCta = content.hero.primaryCta ? (
    <Button asChild>
      <Link href={content.hero.primaryCta.href}>{content.hero.primaryCta.label}</Link>
    </Button>
  ) : null;

  return (
    <LandingTemplate
      hero={{
        eyebrow: content.hero.eyebrow,
        heading: content.hero.heading,
        description: content.hero.description,
        actions: primaryCta ?? undefined,
      }}
      featureCards={content.features.map((feature) => ({
        title: feature.title,
        description: feature.description,
        action: feature.action ? (
          <Link
            return `# ${title} (${template} template)

          - **Route:** \`/${route}\`
          - **Template:** ${template}
          - **Next steps:**
            1. Fill in manifest data at \`config/pages/${manifestNameFromRoute(route)}.json\`.
            2. Replace the stub implementation in \`app/(public)/${route}/page.tsx\`.
            3. Add tests, documentation, and QA per the coding bible.
          `;
                                     \
                                       \
                                         \
                                           \
                                             \
                                               \
                                                 \
                                                   \
                                                     \
                                                       \
                                                         \
                                                           \
                                                             \
                                                               \
                                                                 \
                                                                   \
                                                                     \
                                                                       \
                                                                         \
                                                                           \
                                                                             \
                                                                               \
                                                                                 \
                                                                                   \
                                                                                     \
                                                                                       config/pages/${manifestNameFromRoute(route)}.json.
  2. Replace the stub implementation in \
     \
       \
         \
           \
             \
               \
                 \
                   \
                     \
                       \
                         \
                           \
                             \
                               \
                                 \
                                   \
                                     \
                                       \
                                         \
                                           \
                                             \
                                               \
                                                 \
                                                   \
                                                     \
                                                       \
                                                         \
                                                           \
                                                             \
                                                               \
                                                                 \
                                                                   \
                                                                     \
                                                                       \
                                                                         \
                                                                           \
                                                                             \
                                                                               \
                                                                                 \
                                                                                   \
                                                                                     \
                                                                                       app/(public)/${route}/page.tsx.
  3. Add tests, documentation, and QA per the coding bible.
`;
}

async function run() {
  try {
    const args = parseArgs(process.argv);
    const template = args.template;
    const route = args.route;
    const title = args.title ?? toTitleCase(route);

    if (!template || !TEMPLATE_OPTIONS.includes(template)) {
      throw new Error(`--template must be one of: ${TEMPLATE_OPTIONS.join(", ")}`);
    }

    if (!route) {
      throw new Error("--route is required (e.g. businesses/opportunities)");
    }

    const pageDir = path.join(ROOT_DIR, "app", "(public)", route);
    const manifestPath = path.join(
      ROOT_DIR,
      "config",
      "pages",
      `${manifestNameFromRoute(route)}.json`,
    );
    const docPath = path.join(
      ROOT_DIR,
      "docs",
      "templates",
      `${manifestNameFromRoute(route)}.md`,
    );

    await mkdir(pageDir, { recursive: true });

    const pageFilePath = path.join(pageDir, "page.tsx");
    if (await fileExists(pageFilePath)) {
      throw new Error(`Page already exists at ${pageFilePath}`);
    }

    const manifestContent = JSON.stringify(createManifestStub(template, title), null, 2);
    if (!(await fileExists(manifestPath))) {
      await writeFile(manifestPath, `${manifestContent}\n`, "utf8");
    }

    if (!(await fileExists(docPath))) {
      await writeFile(docPath, createDocStub(template, route, title), "utf8");
    }

    await writeFile(pageFilePath, createPageContent(template, route, title), "utf8");

    console.log(`✔ Scaffolded ${template} page at /${route}`);
  } catch (error) {
    console.error(`✖ ${error.message}`);
    process.exitCode = 1;
  }
}

await run();
