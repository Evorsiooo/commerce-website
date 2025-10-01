# Commerce Office Portal — Master Build Plan (Next.js + Supabase)

**Goal:** Deliver a clean, modern, and reliable portal for a Roblox Ro‑State Commerce Office that replaces Trello/Forms, centralizes data, and is safe for AI‑assisted development.

This document is the **single source of truth** for scope, architecture, schema, security, UX, workflows, integrations, QA, operations, contribution rules, and a phase‑by‑phase task list. It is intentionally detailed so an AI (or a human) can implement features without guessing.

---

## 0) TL;DR
- **Stack:** Next.js (App Router) + Tailwind + shadcn/ui + Supabase (Postgres, Auth, RLS, Storage). Host on Vercel + Supabase Cloud.
- **Auth:** Discord (native Supabase) + Roblox via Auth0 bridge; first-time login requires linking both; optional in-game verification enhancements later.
- **Core entities:** applications, businesses, properties, permits, dev_tickets, assignments, staff, tipline_reports, audit_events.
- **MVP features:** landing page, Discord/Roblox account linking, business/property directories with rich detail pages and audit history, submissions (business wizard, permits, dev support), staff dashboard with approve/reject/manual review, Discord webhook notices, public tipline, strong RLS.
- **Guardrails:** strict PR workflow, tiny tasks, frozen core surfaces, TS strict, ESLint/Prettier, Zod validation, tests.

---

## 1) Product Scope & UX

### 1.1 Personas
- **Citizen/Applicant**: Submits applications; sees only their submissions; reads public info.
- **Staff (Licensing / Property / Compliance)**: Reviews, approves, edits; sees all admin content based on bureau.
- **Public Visitor**: Browses approved businesses, properties, and regulations.

### 1.2 MVP Feature List
- **Public site:** Landing page with call-to-actions, Regulations (markdown), Business Directory (approved only) with rich detail pages (audit trail + images), Property Directory (staff-curated inventory with photos), global search/filters, public tipline submission.
- **Auth:** First-time login enforces linking Discord + Roblox; subsequent logins can use either provider. Profile page shows linked providers, Roblox avatar, verification status.
- **Applications & Wizards:** Business formation wizard guiding owners through entity choices; forms for Business License, Property Request, Permit Request, Dev Support, Amend Governance; “My businesses/licences” management area with review workflow for critical updates.
- **Staff experience:** Queues by bureau (Licensing & Permits / Property Management / Compliance). Review page with governance blob, audit history, applicant info. Actions: Approve / Reject / Return for info / Request edits.
- **Automations & Storage:** On approval, create/update canonical rows, trigger manual review tasks, persist audit events, upload/store logos and property photos in Supabase Storage, and emit Discord webhooks.
- **Access control:** Authenticated users required for all owner/staff actions; public tipline remains anonymous-friendly.

### 1.3 Non‑MVP (Phase 2+)
- Tipline attachments & automated Compliance routing.
- Contracts directory for public agencies.
- Job board / hiring marketplace for businesses.
- Interactive property map with layers.
- AI assistant for regulations and advisory responses.
- Advanced analytics, exports, SLA dashboards.
- Discord role sync bot; deeper Roblox verification (in-game proof or group-based); expanded document storage.

### 1.4 UX Principles
- **Frictionless:** minimal fields per step; inline validation.
- **Clarity:** status chips (received/under_review/approved/rejected), consistent icons/colors.
- **Discoverability:** prominent CTAs, visible links to regulations and help.

---

## 2) Architecture

### 2.1 High‑Level Diagram
```
[ Next.js App ]  <—>  [ Supabase: Postgres + Auth + RLS ]
  |  ^                    |  ^
  v  |                    v  |
[Auth0 (Roblox OAuth)]   [Supabase Studio]
  ^
  |
[Roblox Accounts]

[Discord Webhooks]
```

- **Next.js:** renders public pages, protected staff dashboard, multi-step wizards; uses server actions for DB writes.
- **Supabase:** stores all data; enforces RLS for security; native Discord OAuth; federates Roblox logins via Auth0; hosts Storage buckets for logos/property photos and audit data.
- **Auth0:** brokers Roblox OAuth2 and returns OIDC tokens to Supabase; hosts connection configuration.
- **Roblox:** provides OAuth2 for identity and future verification scopes.
- **Discord:** incoming webhook for notifications on key events (approvals, manual review, compliance alerts).

### 2.2 Directory Structure (locked)
```
/app
  /(public)
    /home
    /businesses
    /properties
    /regulations
    /apply
    /submissions
  /(staff)
    /dashboard
    /applications/[id]
/db
  /migrations
  /seed
  /types (generated)
/domain (pure logic: mappers, governance builder, validation)
/lib (auth, supabase client, discord, rls helpers)
/ui (shadcn components only)
/tests (unit, e2e, fixtures)
```
**Rule:** the AI may **use** but not **rename/relocate** these top‑level folders without a separate refactor PR.

---

## 3) Data Model (tables, key fields, relations)

> Names are lowercase with underscores. Primary keys are UUIDs (default in Supabase). Created/updated timestamps via triggers.

### 3.1 applications
- `id` (pk), `created_at`, `created_by` (auth.uid), `type` (enum: business_new, property, permit, dev_support, amend_governance)
- `payload_json` (JSONB): raw/normalized answers
- `governance_json` (JSONB): compact governance schema (versioned)
- `status` (enum: received, under_review, need_more_info, approved, rejected)
- `decision_notes` (text)
- `linked_business_id` (fk → businesses.id, nullable)
- `linked_property_id` (fk → properties.id, nullable)
- Indexes: `(created_by)`, `(type)`, `(status)`

### 3.2 businesses
- `id`, `name`, `industry` (enum), `status` (enum: active, suspended, closed), `purpose` (text)
- `discord_url` (text), `employee_db_url` (text)
- `type` (enum: corporation, llc, gp, lp, llp, sole_prop, nonprofit_corp)
- `management_type` (enum: member_managed, manager_managed, board_managed)
- `logo_storage_path` (text) → Supabase Storage reference
- `governance_json` (JSONB)
- Indexes: `(name)`, `(status, industry)`

### 3.3 properties
- `id`, `name` or `address`, `status` (enum: available, pending, occupied)
- `current_business_id` (fk → businesses.id, nullable), `notes`
- `photo_storage_path` (text) → Supabase Storage reference
- Indexes: `(status)`, `(current_business_id)`

### 3.4 permits
- `id`, `type` (enum), `holder_business_id` (fk), `status` (enum: pending, issued, revoked, expired)
- `effective_at` (date), `expires_at` (date)
- Indexes: `(holder_business_id)`, `(status, type)`

### 3.5 assignments (property occupancy history)
- `id`, `property_id` (fk), `business_id` (fk)
- `start_at` (timestamp), `end_at` (timestamp, nullable)
- Index: `(property_id, start_at)`

### 3.6 staff
- `user_id` (auth.users.id, pk), `bureau` (enum: licensing, property, compliance), `role` (enum: staff, admin)

### 3.7 people (optional now)
- `id`, `user_id` (auth), `discord_id`, `roblox_username`, other profile info

### 3.8 business_memberships
- `id`, `business_id` (fk → businesses.id), `person_id` (fk → people.id)
- `role` (enum: owner, manager, staff)
- `is_primary_contact` (boolean)
- Index: `(business_id, person_id)` unique

### 3.9 audit_events
- `id`, `entity_type` (enum: business, property, permit, application, user, other)
- `entity_id` (uuid), `action` (enum), `actor_id` (auth.users.id)
- `context_json` (JSONB) storing diff/payload
- `created_at`
- Indexes: `(entity_type, entity_id)`, `(created_at)`

### 3.10 tipline_reports
- `id`, `submitted_at`, `submitted_by` (nullable auth.users.id)
- `business_name` (text), `description` (text), `evidence_url` (text, nullable)
- `status` (enum: received, triage, in_review, closed)
- `assigned_to` (fk → staff.user_id, nullable)
- Indexes: `(status)`, `(assigned_to)`

**Enums to define upfront:** application_type, business_type, management_type, property_status, business_status, permit_status, permit_type, bureau, staff_role, application_status.

---

## 4) Security — Row Level Security (RLS)

### 4.1 Principles
- **Public** can read **approved** businesses/properties only.
- **Logged‑in users** can **insert** applications and **read only their own** applications.
- **Staff** can read/write across the board (optionally constrained by bureau for certain actions).
- **Account linking:** first session requires both Discord and Roblox linked before unlocking authenticated areas.
- **Tipline:** anonymous/public submissions allowed, but triage workflow handled by Compliance staff.

### 4.2 Policy Templates (logic description)
- `applications`:
  - **Insert**: allowed if `auth.uid() IS NOT NULL`; set `created_by = auth.uid()` server‑side.
  - **Select**: `created_by = auth.uid()` OR `EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid())`.
  - **Update/Delete**: staff only.
- `businesses`, `properties`, `permits`:
  - **Select**: public where `status IN ('active')` (businesses) or public/non‑sensitive fields for properties; staff see all.
  - **Insert/Update/Delete**: staff only.
- `staff`: select/update/insert by admins only.
- `tipline_reports`: insert allowed for public; select/update restricted to Compliance staff; audit all actions.
- Bureau-specific policies: Licensing & Permits can mutate license/permit tables; Property Management handles properties/assignments; Compliance manages tipline/audit reviews.

### 4.3 Sensitive Fields Strategy
- If properties carry sensitive info, split into `properties_public_view` (a DB view) that hides those columns and grant public `select` on the view only.

---

## 5) Governance JSON (compact model)

### 5.1 Shape (conceptual)
- `schema_version` (int)
- `entity_type` (matches business_type)
- `management` (member_managed | manager_managed | board_managed | null)
- `roles`: arrays depending on entity: members, managers, shareholders, partners, partners_general, partners_limited
- `rules`:
  - `add` { scope: members|partners, policy: none|majority|unanimous|unanimous_remaining|other, other_text? }
  - `remove` { … }
  - `acts_effective` { scope: members|partners, policy: majority|unanimous|other, other_text? }
- `limits`: { managers_limit?, directors_limit? }
- `duration`: { kind: perpetual|fixed, end?: YYYY‑MM‑DD }

### 5.2 Build Rules (deterministic)
- Determine scope by entity family: LLC/NPO → `members`; GP/LP/LLP → `partners`; Corp → shareholders (rules usually on board/management; if not captured, omit rules).
- Parse role textboxes: split by commas/newlines; trim; dedupe; strip `@`/URLs.
- Map long phrases from forms into compact tokens (policy enums).
- Omit empty keys; always include `schema_version`.

---

## 6) Forms & Flows

### 6.1 Applications (public, logged‑in)
- **Business License**: basic identity/link fields, business type, management type, purpose, links, governance choices. On submit: insert into `applications` with type `business_new`, status `received`, attached `governance_json`.
- **Property Request**: select/describe property, justification.
- **Permit Request**: permit type, holder business, dates.
- **Dev Support**: category (property signage, bug, feature), description, optional links.
- **Amend Governance**: link to business, description, revised governance choices.

### 6.2 Staff Review (private)
- **Queues**: filter by bureau + status.
- **Review Page**: shows payload, governance blob, applicant info; actions:
  - **Approve**: writes to canonical tables; sets application status `approved`; links created rows.
  - **Reject**: sets status `rejected`; adds decision notes.
  - **Return for Info**: sets status `need_more_info`; stores notes; (optional) notify applicant.

### 6.3 Discord Notifications
- On new application: small summary (type, applicant, link to dashboard).
- On approval/rejection: state change plus reference to affected business/property/permit.
- Webhook errors do not fail the main action (fire‑and‑forget).

---

## 7) UI & Design System

### 7.1 Components (shadcn/ui only)
- Button, Input, Select, Textarea, Card, Badge, Table, Dialog, Tabs, Toast.

### 7.2 Patterns
- **Forms** use Zod + React Hook Form with shadcn Form components.
- **Tables** with server‑side pagination and filter chips.
- **Status** uses Badge variants (e.g., received=muted, under_review=warning, approved=success, rejected=destructive).

### 7.3 Theming
- Tailwind with a small token set (spacing, radii, shadows). Avoid ad‑hoc CSS.

---

## 8) Development Guardrails (anti‑spaghetti)

### 8.1 Branching & PR Rules
- Protected `main`; feature branches only; squash merges.
- PR template includes: goal, files touched (≤10), bullet changes, acceptance checks, DB changes (migration name), RLS affected.

### 8.2 Frozen Surfaces (refactor via proposal PR only)
- `/db`, `/lib/auth`, `/lib/supabase`, `/lib/discord`, `/ui`, route structure under `/app`.

### 8.3 Tooling
- TypeScript **strict**.
- ESLint + Prettier; pre‑commit hook.
- Zod validation for all server actions.
- Generated DB types imported everywhere.

### 8.4 Tests
- Unit tests for domain logic (governance builder, mappers).
- RLS tests (applicant vs staff vs public access).
- E2E tests (Playwright) for happy paths.

### 8.5 Definition of Done (per PR)
- TS build passes; lints clean.
- One server action per feature; no client writes.
- Uses shared UI components.
- Tests added/updated (1 unit + 1 e2e minimum).
- Screenshots for UI changes.

---

## 9) Environments & Secrets

### 9.1 Environment Variables
- Public site:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server only:
  - `SUPABASE_SERVICE_ROLE_KEY` (server actions only)
  - `DISCORD_WEBHOOK_URL`
  - `APP_BASE_URL` (for links in webhooks)
  - `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` (ingested by Supabase/Auth0 bridge; never ship to client)

### 9.2 Secrets Handling
- Never expose service role key or Auth0 secrets to the client.
- Store Supabase + Auth0 credentials in Vercel/1Password; rotate when rotating Supabase keys.
- Use Vercel environment scopes (preview/prod). Commit `.env.example` with placeholders.

---

## 10) Migration Plan (from Trello/Google Forms)

1. Export current Trello boards and Google Sheets to CSV.
2. Create import scripts to map CSVs into `businesses`, `properties`, `permits`, and `applications` (historical).
3. Set `status` appropriately (e.g., approved for active businesses).
4. Audit 10 random records per table after import.

---

## 11) Monitoring & Ops

- **Health:** track page load errors (Vercel logs), server action failures.
- **DB:** Supabase metrics (connections, slow queries). Add indexes as needed.
- **Quota Watch:** monitor Supabase/Vercel free tier limits (concurrent connections, row counts, bandwidth); set alerts so we can upgrade before throttling hits users.
- **Auth0:** watch tenant logs and monthly active user limits; review data residency requirements if expanding beyond the dev tenant region.
- **Security:** audit RLS policies quarterly; rotate Discord webhook.
- **Backups:** Supabase automated backups; consider nightly export to Storage.

---

## 12) Acceptance Criteria (MVP completion)

- Public can browse approved businesses/properties; regulations render.
- Discord and Roblox (via Auth0) logins work; applicant can submit Business License application and view only their own submissions.
- Staff dashboard shows queues; review page can approve/reject/return.
- On approval, a business row is created/updated; application links to it; Discord gets a ping.
- RLS verified via tests: public read restricted; applicants see only their rows; staff unrestricted.
- Code passes lint/type/test gates; repo follows structure.

---

## 13) Phase Plan & Task Breakdown

### Phase 1 — Platform Foundation & Auth
- Create Supabase project; enable Discord OAuth; configure Auth0 → Roblox bridge; create enums and base tables; write baseline RLS; generate DB types.
- Scaffold Next.js app with Tailwind + shadcn; wire layout, navigation, shared UI primitives, and environment config.
- Auth flow and profile page (Discord native + Roblox via Auth0; show linked identities; enforce dual-link on first login).

**Acceptance:** Discord and Roblox sign in/out succeed; DB tables exist with RLS on; DB types generated; profile stub shows linked providers.

### Phase 2 — Public Portal Basics
- Public pages: Home, Regulations (markdown pipeline), Business list (approved businesses only), Property list (public-safe view).
- Tipline submission form (public/anonymous-friendly) delivered with validations and audit hook.

**Acceptance:** Public visitors can browse directories and submit a tipline report; unauthenticated actions respect RLS/public views.

### Phase 2.5 — Framework & Auth Stabilization
- Replace ad-hoc public pages with the shared template system (`PageShell`, Landing/Directory/Form/Utility templates) described in [docs/PHASE2_5_FRAMEWORK_PLAN.md](./docs/PHASE2_5_FRAMEWORK_PLAN.md).
- Build shared UI modules (`PageHeading`, `FilterBar`, `DirectoryCard`, `EmptyState`, `MarkdownArticle`) and document usage under `docs/templates/`.
- Rebuild Home, Regulations, Business Directory, Property Directory, and Tipline to consume the new templates and modules.
- Introduce `profiles.account_status`, enforce dual-provider linking gates, hide profile navigation until authenticated, and schedule cleanup for abandoned accounts.
- Update README, template docs, and QA checklist to reflect the new framework baseline before continuing to Phase 3 work.

**Acceptance:** All public routes render through the template library with consistent styling, the dual-provider login flow is mandatory before accessing authenticated surfaces, and documentation clearly prescribes how to extend the system.

### Phase 3 — Business Onboarding & Self-Service
- Build Business License application wizard with React Hook Form + Zod validation.
- Implement governance builder (domain-pure function) and attach governance_json on insert.
- “My businesses/licences” dashboard with manual review workflow for critical edits + manual review submission path for owners.

**Acceptance:** Applicants can submit and see their applications; governance blob is well-formed; sensitive edits queue for review.

### Phase 4 — Staff Review & Governance
- Seed staff table; build dashboards segmented by bureau (Licensing & Permits, Property Management, Compliance).
- Application review page supports approve/reject/return/request-edit actions with audit trail display.
- Approvals create/update canonical business records, trigger audit events, fire Discord webhooks.
- Public tipline triage view for Compliance bureau.

**Acceptance:** Staff can move applications and tipline reports through statuses; approved businesses appear publicly; audit webhooks fire.

### Phase 5 — Property & Permit Operations
- Property request flow; staff tooling manages assignments and photo uploads via Supabase Storage.
- Permit request flow; approvals write permit rows with effective/expiry dates and audit trails.
- Business & Property detail pages surface media galleries, audit history, and related entities.

**Acceptance:** Staff can grant properties and permits; public detail pages reflect media and audit history; storage paths secure via RLS.

### Phase 6 — Support & Ticketing
- Dev support submission form available to business owners with status tracking.
- Staff kanban (open, in_progress, waiting, resolved, closed) plus activity log.
- Optional Discord pings on ticket status changes and manual review requests.

**Acceptance:** Support tickets flow end-to-end; staff and owners see synchronized status; Discord notifications optional but non-blocking.

### Phase 7 — Integrations & Enhancements
- Directory search, filters, and pagination tuned for performance; caching strategy revisited.
- Audit log UI enhancements and export tooling.
- Roblox verification enhancements (in-game code/group checks) surfaced in profiles; Discord role sync automation.
- Launch exploratory surfaces: contracts directory, job board prototypes, interactive property map, AI assistant experiments.

**Acceptance:** UX refinements validated; advanced verification/role sync works without blocking core flows; exploratory features gated behind flags.

---

## 14) Mapping Guidance (forms → DB)

> Keep it simple: **one canonical column per concept**. If multiple UI questions collect the same concept, pick the first non‑empty value and ignore alternatives. Keep the raw form payload inside `payload_json` for audit.

- **Identity:** created_by from auth; sync Discord + Roblox identifiers into `people`; keep provider payloads in `payload_json` (or auth metadata) for audit.
- **URLs:** normalize once; ensure scheme; store in canonical columns on businesses.
- **Business/Management Types:** enforce allowed enums; reject/normalize unknowns.
- **Governance:** build from compact mappings; never store long English sentences once normalized.

---

## 15) QA Checklist (run per release)
- RLS matrix test (public/applicant/staff) across all endpoints.
- Directory pages performance (<200ms server response in preview env for simple queries).
- Form validation rejects invalid URLs/empty required fields.
- Governance builder unit tests pass for all entity types.
- Discord webhooks deliver (and failures don’t break primary action).

---

## 16) PR Template (paste into `.github/pull_request_template.md`)
- **Goal:**
- **Files touched (≤10):**
- **Change summary:**
  - [ ] …
- **Acceptance checks:**
  - [ ] TS strict build OK
  - [ ] ESLint/Prettier OK
  - [ ] Uses shared UI only
  - [ ] 1 unit + 1 e2e added/updated
  - [ ] RLS unaffected or tests updated
  - [ ] No client‑side service role key
  - [ ] Screenshots attached (UI)
- **DB Changes:** migration `<name>` (yes/no)
- **RLS affected:** (yes/no)

---

## 17) Risks & Mitigations
- **RLS mistakes** → Write tests; forbid client writes; centralize server actions.
- **Scope creep** → Tiny tasks, squash merges, enforce PR template.
- **Random rewrites by AI** → Frozen surfaces + proposal PR rule.
- **Integration flakiness** → Discord is best‑effort; never block core actions on webhook success.
- **Auth0 tenancy drift** → Track MAU limits, tenant region, and custom connection changes; document rollback steps if we need to swap providers or migrate regions.
- **Free tier ceilings** → Document resource usage each release; keep upgrade playbook ready so we can move to paid plans before user growth triggers throttling or downtime.
- **Performance** → Add indexes early; paginate lists; avoid `select *`.

---

## 18) Handover Notes for AI Agents
- Always follow this document; if conflicts arise, open a proposal PR (no code) to amend the plan.
- Before coding, restate the task, affected files, and acceptance criteria.
- Don’t rename folders/files under `/db`, `/lib`, `/ui`, or route groups.
- Add tests with fixtures under `/tests` for any new domain logic.

---

## 19) Done = Production‑Ready
When all MVP acceptance criteria pass, you can sunset Trello/Forms and onboard staff:
- Staff logins added to `staff` table.
- Announce public directories and link regulations.
- Disable old submission forms.
- Monitor early traffic and errors for a week, then proceed with Phase 2.

