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
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function manifestNameFromRoute(route) {
  return route.replace(/\//g, "-");
}

function componentNameFromRoute(route) {
  return `${toTitleCase(route).replace(/\s+/g, "")}Page`;
}

function createPageContent(template, route, title) {
  const manifestImport = `@/config/pages/${manifestNameFromRoute(route)}.json`;
  const componentName = componentNameFromRoute(route);

  switch (template) {
    case "landing":
      return `import type { Metadata } from "next";

import content from "${manifestImport}";
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

  const featureCards = content.features.map((feature) => ({
    title: feature.title,
    description: feature.description,
    action: feature.action ? (
      <Link
        href={feature.action.href}
        className="text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
      >
        {feature.action.label}
      </Link>
    ) : undefined,
  }));

  return (
    <LandingTemplate
      hero={{
        eyebrow: content.hero.eyebrow,
        heading: content.hero.heading,
        description: content.hero.description,
        actions: primaryCta ?? undefined,
      }}
      featureCards={featureCards}
    />
  );
}
`;
    case "directory":
      return `import type { Metadata } from "next";

import content from "${manifestImport}";
import { DirectoryTemplate } from "@/templates/directory-template";

export const metadata: Metadata = {
  title: "${title} | Commerce Office Portal",
  description: content.intro.description,
};

export default function ${componentName}() {
  return (
    <DirectoryTemplate intro={content.intro}>
      {/* TODO: replace with directory client component */}
    </DirectoryTemplate>
  );
}
`;
    case "detail":
      return `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${title} | Commerce Office Portal",
  description: "Detail view placeholder",
};

export default function ${componentName}() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">${title}</h1>
      {/* TODO: implement detail view */}
    </div>
  );
}
`;
    case "form":
      return `import type { Metadata } from "next";

import content from "${manifestImport}";
import { FormTemplate } from "@/templates/form-template";

export const metadata: Metadata = {
  title: "${title} | Commerce Office Portal",
  description: content.intro.description,
};

export default function ${componentName}() {
  return (
    <FormTemplate intro={content.intro}>
      {/* TODO: replace with form implementation */}
    </FormTemplate>
  );
}
`;
    case "utility":
    default:
      return `import type { Metadata } from "next";

import content from "${manifestImport}";
import { PageShell } from "@/templates/page-shell";
import { Eyebrow, PageHeading, BodyText } from "@/ui/typography";

export const metadata: Metadata = {
  title: "${title} | Commerce Office Portal",
  description: content.description,
};

export default function ${componentName}() {
  return (
    <PageShell>
      <div className="flex flex-col gap-3">
        <Eyebrow>{content.eyebrow}</Eyebrow>
        <PageHeading>{content.heading}</PageHeading>
        <BodyText>{content.description}</BodyText>
      </div>
      {/* TODO: add utility content */}
    </PageShell>
  );
}
`;
  }
}

function createManifestStub(template, title) {
  switch (template) {
    case "landing":
      return {
        hero: {
          eyebrow: "Placeholder eyebrow",
          heading: title,
          description: "Describe the mission for this landing page.",
          primaryCta: {
            label: "Primary action",
            href: "/auth/login",
          },
        },
        features: [
          {
            title: "Feature one",
            description: "Explain the benefit or capability.",
            action: {
              label: "Learn more",
              href: "/",
            },
          },
        ],
      };
    case "directory":
      return {
        intro: {
          eyebrow: "Directory Eyebrow",
          heading: title,
          description: "Describe what this directory lists and how to use it.",
        },
        empty: {
          title: "No entries yet",
          description: "Records will appear once data is published.",
        },
      };
    case "form":
      return {
        intro: {
          eyebrow: "Form Eyebrow",
          heading: title,
          description: "Tell the user what this form accomplishes and expectations.",
        },
      };
    case "utility":
      return {
        eyebrow: "Utility Eyebrow",
        heading: title,
        description: "Document what this utility page covers.",
      };
    case "detail":
    default:
      return {
        intro: {
          eyebrow: "Detail Eyebrow",
          heading: title,
          description: "Detail page manifest placeholder.",
        },
      };
  }
}

function createDocStub(template, route, title) {
  return `# ${title} (${template} template)

- **Route:** \`/${route}\`
- **Template:** ${template}
- **Next steps:**
  1. Fill in manifest data at \`config/pages/${manifestNameFromRoute(route)}.json\`.
  2. Replace the stub implementation in \`app/(public)/${route}/page.tsx\`.
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
