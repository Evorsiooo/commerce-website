# Phase 2.5 — Framework & Auth Stabilization Blueprint

> **Objective:** Replace the ad-hoc public pages with a reusable presentation system, enforce a unified design language, and repair the dual-provider authentication contract so future features can be layered without regressions.

## Why Phase 2.5 Exists

- **Template Drift:** Home, directory, regulations, and tipline experiences currently ship bespoke markup, spacing, and typography. This blocks rapid iteration and makes AI-driven contributions risky.
- **Auth Contract Breach:** Users can bypass the Discord/Roblox dual-link requirement, and unauthenticated visitors see profile affordances. Without a hardened authentication lifecycle we cannot trust downstream data.
- **Documentation Gap:** Our README/master plan outline the vision, but we lack an executable playbook that translates strategy into concrete layout primitives, component APIs, and enforcement rules.

## Outcomes to Achieve

1. **Unified Page Skeletons:** Every route renders inside one of five templates (Landing, Directory, Detail, Form, Utility) backed by a `PageShell` that handles grid, spacing, SEO metadata, and responsive behavior.
2. **Shared Content Modules:** Hero bands, filter bars, cards, resource lists, and markdown renderers live under `ui/` with typed props and Storybook-style documentation.
3. **One-Command Scaffolding:** A `npm run scaffold:page -- --template <type>` generator provisions route files, template wrappers, tests, and docs snippets so new features follow the contract by default.
4. **Auth Lifecycle Hardening:** First-session freezes, mandatory provider linking, navbar visibility rules, and automated cleanup of abandoned accounts enforced at the middleware + Supabase policy levels.
5. **Authoring Guide:** `docs/PHASE2_5_FRAMEWORK_PLAN.md` + TODO roadmap (this document + TODO changes) become the authoritative reference for future contributors.

## Template & Component Architecture

### 1. Global Primitives

| Concern | Deliverable | Notes |
| --- | --- | --- |
| Layout container | `PageShell` server component | Wraps `header`, `main`, `aside`, `footer` slots; enforces `max-w-7xl`, padding, and background tokens. |
| Surface wrappers | `ContentSection`, `Card`, `StatGrid` | Thin wrappers around shadcn primitives with default spacing. |
| Typography | `PageHeading`, `SectionHeading`, `Eyebrow` | Accept `as` prop for semantic tags; ensures consistent tracking/weights. |
| Status indicators | `StatusPill`, `BadgeStack` | Single source for status color palette with design-token mapping. |

### 2. Page Template Taxonomy

1. **Landing Template** (Home): hero + CTA, four-up feature grid, callouts. Slots for `hero`, `featureGrid`, optional `ctaFooter`.
2. **Directory Template** (Businesses, Properties, Regulations): filter rail, list grid/table, empty state. Accepts `filters`, `collection`, `empty` render props.
3. **Detail Template** (future Phase 3/4 detail pages): header summary, metadata sidebar, body content stack.
4. **Form Template** (Tipline, future applications): intro hero, progress indicator, form body, success/error states.
5. **Utility Template** (Auth/login, profile): compact layout with stepper or status messaging.

Each template ships with a usage guide (`docs/templates/<template>.md`) describing expected child components, data contracts, and accessibility requirements.

### 3. Shared Modules to Build

- `FilterBar` (wraps `PillToggleGroup`, search input, sort dropdown).
- `DirectoryCard` variants (`BusinessCard`, `PropertyCard`) generated from base `DirectoryCard` to avoid unique markup.
- `MarkdownArticle` for regulations body with shadcn typography tokens.
- `EmptyState` component accepting icon, title, description, action.
- `Pagination` scaffold (Phase 2.5 may stub but should design API for Phase 3+).

### 4. AI-First Guardrails & Scaffolding

- **Generator:** `scripts/scaffold-page.ts` consumes `template`, `route`, `title`, `description`, and produces page file, client component, story/docs stub, and TODO checklist. Exposed via `npm run scaffold:page`.
- **Component Cookbook:** Each module lives with a `.stories.mdx` (or README) containing prop table, usage snippets, and “When to use / When not to use” guidance.
- **Design Tokens:** Centralize spacing, radius, color families in `styles/tokens.ts` that templates read. No raw Tailwind class strings outside the tokens map.
- **Lint Rules:** Add `eslint-plugin-boundaries` rules that prevent importing from `app/...` directly; only templates + shared modules may be consumed. Custom ESLint rule asserts every `app/(public)` page imports `PageShell` + a template wrapper.
- **Schema for Copy:** Provide `config/pages/<route>.json` manifest describing titles, hero copy, CTA text; page components read from config so AI edits content without touching layout code.

### 5. AI Development Workflow (Happy Path)

1. Run `npm run scaffold:page -- --template directory --route businesses/new-feature`.
2. Generator creates page stub, client component, Storybook story, and registers doc link in `docs/templates/`.
3. Developer populates manifest in `config/pages/` and, if needed, adds data fetcher in `lib/data/`.
4. Run `npm run lint && npm run typecheck && npm test` (hooked via `npm run scaffold:page` post-script) to ensure contract compliance.
5. Update relevant MDX/README sections (pre-filled checklist reminds the author) before opening PR.

## Auth Lifecycle Repair Plan

1. **Account State Model**
   - Introduce `account_status` enum (`pending_link`, `active`, `frozen`, `abandoned`) on `profiles` table.
   - Middleware blocks navigation beyond `/auth/*` until status is `active`.
2. **Registration Flow**
   - First provider login creates `profiles` row with status `pending_link`.
   - Post-login hook checks linked identities; if missing second provider, redirect to `/auth/link` page with guidance and disable rest of portal.
3. **Linking Enforcement**
   - `/auth/link` uses Supabase user metadata to determine linked providers, presents buttons for Discord/Roblox.
   - Poll Supabase session to detect completion; when both present, mark profile `active`.
4. **Cleanup**
   - Cron-like server action (or Supabase scheduled function) purges `pending_link` accounts older than N days.
   - Emit audit events when accounts move between statuses.
5. **Navbar Logic**
   - Convert nav to a component that consumes auth context; show `Profile` only when session present & status `active`. Display `Sign In`/`Link Accounts` CTAs accordingly.

## Implementation Roadmap

| Sprint | Focus | Key Deliverables |
| --- | --- | --- |
| **2.5a — Foundations (Week 1)** | Build primitives | `PageShell`, typography components, template scaffolds, documentation stubs, design tokens file. Replace Home + Tipline with templates. |
| **2.5b — Automation (Week 2)** | Ship generators | Implement `scripts/scaffold-page.ts`, Storybook/MDX cookbook infra, ESLint boundary rules, CI guard to prevent non-template pages. |
| **2.5c — Directories (Week 3)** | Apply directory template | Rebuild Businesses, Properties, Regulations using `DirectoryTemplate`, `FilterBar`, shared cards; add skeleton states and manifest-driven copy. |
| **2.5d — Auth Hardening (Week 4)** | Replatform auth | DB migration for `profiles.account_status`, middleware guard, new `/auth/link` page, navbar visibility fix, automated cleanup script. |
| **2.5e — Documentation & QA (Week 5)** | Lock playbook | Complete template docs, Storybook-style examples (MDX or README), update README & master plan summaries, run scaffold smoke tests, execute full QA suite. |

## Documentation Deliverables

- `docs/templates/README.md` (index linking to individual template guides).
- Individual guides per template with diagrams, prop tables, and copy/paste examples.
- Auth lifecycle doc under `docs/auth/LIFECYCLE.md` covering state machine, linking rules, and failure handling.
- Update `README.md` “Phase 1 checks” to reference new template system & auth requirements.
- Generator usage docs: `docs/scaffolding/USAGE.md` outlining CLI flags, expected outputs, and integration with TODO checklists.

## QA & Tooling Requirements

- Add lint rule collection enforcing template imports (`eslint-plugin-boundaries` or local custom rule).
- Expand Vitest coverage: snapshot smoky tests for templates, unit tests for auth status transitions.
- Integration tests: Playwright scenario for first login, linking, and navigation guard.
- Generator smoke tests: CI job runs `npm run scaffold:page -- --template directory --route sandbox/example` then `npm run lint`/`npm run typecheck` to ensure scaffolds stay compilable.

## Risks & Mitigations

- **Migration Complexity:** Auth changes touch Supabase policies. Mitigation: stage migrations in preview environment; add rollback script.
- **Design Regression:** New templates might break existing styling. Mitigation: Storybook/MDX docs + Percy visual diff (stretch goal) to lock look-and-feel.
- **Time Overrun:** Scope creep from detail page work. Mitigation: Phase 2.5 limits to public surfaces + auth; detail templates scaffolded but not yet used.

## Acceptance Criteria

- All public pages (Home, Regulations, Businesses, Properties, Tipline) render via new templates with no inline bespoke styling.
- Navbar hides profile entry for anonymous users; sign-in flow enforces dual provider linking before unlocking other routes.
- Documentation reviewed and linked from README + TODO; future contributors can reference template guides without inspecting page source.
- QA checklist executed: lint, typecheck, vitest, Playwright smoke, manual auth walk-through.

---

_This plan seeds the TODO updates and guides the rebuild effort for Phase 2.5._
