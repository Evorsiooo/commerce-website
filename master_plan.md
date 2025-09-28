# Commerce Office Portal — Master Build Plan (Next.js + Supabase)

**Goal:** Deliver a clean, modern, and reliable portal for a Roblox Ro‑State Commerce Office that replaces Trello/Forms, centralizes data, and is safe for AI‑assisted development.

This document is the **single source of truth** for scope, architecture, schema, security, UX, workflows, integrations, QA, operations, contribution rules, and a phase‑by‑phase task list. It is intentionally detailed so an AI (or a human) can implement features without guessing.

---

## 0) TL;DR
- **Stack:** Next.js (App Router) + Tailwind + shadcn/ui + Supabase (Postgres, Auth, RLS, Storage). Host on Vercel + Supabase Cloud.
- **Auth:** Discord OAuth now; optional Roblox verification later (profile code or in‑game exchange).
- **Core entities:** applications, businesses, properties, permits, dev_tickets, assignments, staff.
- **MVP features:** public directories, Discord login, submissions, staff dashboard with approve/reject, Discord webhook notices, strong RLS.
- **Guardrails:** strict PR workflow, tiny tasks, frozen core surfaces, TS strict, ESLint/Prettier, Zod validation, tests.

---

## 1) Product Scope & UX

### 1.1 Personas
- **Citizen/Applicant**: Submits applications; sees only their submissions; reads public info.
- **Staff (Licensing / Property / Compliance)**: Reviews, approves, edits; sees all admin content based on bureau.
- **Public Visitor**: Browses approved businesses, properties, and regulations.

### 1.2 MVP Feature List
- **Public site:** Home, Regulations (markdown), Business Directory (approved only), Property Directory (non‑sensitive views), Search/filters.
- **Auth:** Discord login; lightweight profile page (Discord handle, optional Roblox verification status).
- **Applications:** Forms for Business License, Property Request, Permit Request, Dev Support, Amend Governance. “My submissions” page.
- **Staff dashboard:** Queues by bureau (Licensing/Property/Needs Info). Review page with full context + governance blob. Actions: Approve / Reject / Return for info.
- **Automations:** On approve, write canonical rows (businesses/properties/permits), link back to application; send Discord webhook notifications.

### 1.3 Non‑MVP (Phase 2+)
- Roblox verification flow; Discord role assignment bot; richer analytics; file uploads (logos, documents); audit log UI; SLA/metrics dashboard; exports.

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
 [Discord Webhooks]      [Supabase Studio]
```

- **Next.js:** renders public pages, protected staff dashboard, forms; uses server actions for DB writes.
- **Supabase:** stores all data; enforces RLS for security; provides Auth (Discord provider) and Studio for admin edits.
- **Discord:** incoming webhook for notifications on key events.

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
- `governance_json` (JSONB)
- Indexes: `(name)`, `(status, industry)`

### 3.3 properties
- `id`, `name` or `address`, `status` (enum: available, pending, occupied)
- `current_business_id` (fk → businesses.id, nullable), `notes`
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

**Enums to define upfront:** application_type, business_type, management_type, property_status, business_status, permit_status, permit_type, bureau, staff_role, application_status.

---

## 4) Security — Row Level Security (RLS)

### 4.1 Principles
- **Public** can read **approved** businesses/properties only.
- **Logged‑in users** can **insert** applications and **read only their own** applications.
- **Staff** can read/write across the board (optionally constrained by bureau for certain actions).

### 4.2 Policy Templates (logic description)
- `applications`:
  - **Insert**: allowed if `auth.uid() IS NOT NULL`; set `created_by = auth.uid()` server‑side.
  - **Select**: `created_by = auth.uid()` OR `EXISTS (SELECT 1 FROM staff s WHERE s.user_id = auth.uid())`.
  - **Update/Delete**: staff only.
- `businesses`, `properties`, `permits`:
  - **Select**: public where `status IN ('active')` (businesses) or public/non‑sensitive fields for properties; staff see all.
  - **Insert/Update/Delete**: staff only.
- `staff`: select/update/insert by admins only.

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

### 9.2 Secrets Handling
- Never expose service role key to the client.
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
- **Security:** audit RLS policies quarterly; rotate Discord webhook.
- **Backups:** Supabase automated backups; consider nightly export to Storage.

---

## 12) Acceptance Criteria (MVP completion)

- Public can browse approved businesses/properties; regulations render.
- Discord login works; applicant can submit Business License application and view only their own submissions.
- Staff dashboard shows queues; review page can approve/reject/return.
- On approval, a business row is created/updated; application links to it; Discord gets a ping.
- RLS verified via tests: public read restricted; applicants see only their rows; staff unrestricted.
- Code passes lint/type/test gates; repo follows structure.

---

## 13) Phase Plan & Task Breakdown

### Phase 1 — Foundation
- Create Supabase project; enable Discord OAuth; create enums and base tables; write RLS; generate DB types.
- Scaffold Next.js app; Tailwind + shadcn; layout and navigation.
- Public pages: Home, Regulations (markdown stub), Business list (approved), Property list (approved or via view).
- Auth flow and profile page (shows Discord handle).

**Acceptance:** Public pages render; can sign in/out; DB tables exist with RLS on; DB types generated.

### Phase 2 — Applications & Governance
- Build “Business License” application form with Zod validation.
- Implement governance builder (domain‑pure function) and attach governance_json on insert.
- “My submissions” list (owner‑scoped).

**Acceptance:** Applicant can submit; sees the new submission; governance blob is well‑formed.

### Phase 3 — Staff Dashboard & Approvals
- Staff table seeding; dashboard queues; application review page.
- Approve action: creates/updates `businesses`; sets status; Discord webhook.
- Reject/Needs‑Info actions.

**Acceptance:** Staff can move an application through statuses; business appears in the public list on approval.

### Phase 4 — Property & Permits
- Property request flow; approve writes assignment/property update.
- Permit request flow; approve writes permit row with dates.

**Acceptance:** Staff can grant properties and permits; public lists reflect changes.

### Phase 5 — Dev Support Tickets
- Simple form and staff Kanban (statuses: open, in_progress, waiting, resolved, closed).

**Acceptance:** Tickets flow end‑to‑end; optional Discord pings on status.

### Phase 6 — Polish & Integrations
- Search, filters, pagination on directories.
- Roblox verification (profile code or in‑game exchange); mark verified on profile.
- Optional Discord role sync (bot token flow; respect rate limits).

**Acceptance:** UX refined; verification works; roles assign on approvals (if enabled).

---

## 14) Mapping Guidance (forms → DB)

> Keep it simple: **one canonical column per concept**. If multiple UI questions collect the same concept, pick the first non‑empty value and ignore alternatives. Keep the raw form payload inside `payload_json` for audit.

- **Identity:** created_by from auth; Discord handle in payload_json; optional profile fields in `people` later.
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

