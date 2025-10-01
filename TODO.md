# Commerce Office Portal — Phase TODOs

These TODOs mirror the master plan and give us a quick checklist for implementation. Check items off as each phase completes.

## Phase 1 — Platform Foundation & Auth
- [x] Supabase project configured (Discord + Auth0 providers, RLS baseline, storage buckets, generated types)
- [x] Core database enums and tables scaffolded via migrations
- [x] Next.js App Router scaffolded with Tailwind and shadcn/ui
- [x] First-time login flow enforcing Discord + Roblox linking, with profile page stub showing linked accounts

## Phase 2 — Public Portal Basics
- [x] Landing page and Regulations content pipeline in place
- [x] Public Business Directory and Property Directory read views (approved data only)
- [x] Tipline submission form (public) implemented

## Phase 2.5 — Framework & Auth Stabilization
- [ ] Replace bespoke page markup with `PageShell`/template system (Landing, Directory, Form, Utility)
- [ ] Build shared content modules (`PageHeading`, `FilterBar`, `DirectoryCard`, `EmptyState`, `MarkdownArticle`)
- [ ] Re-platform Home, Regulations, Businesses, Properties, Tipline to use new templates and shared modules
- [ ] Harden dual-provider auth flow (account status enum, link gate, navbar visibility, abandoned account cleanup)
- [ ] Publish template & auth lifecycle docs (`docs/PHASE2_5_FRAMEWORK_PLAN.md`, per-template guides, README/master_plan updates)

## Phase 3 — Business Onboarding & Self-Service
- [ ] Business formation wizard + Business License form built with React Hook Form + Zod
- [ ] Governance builder implemented and stored on submission
- [ ] “My businesses/licences” dashboard with manual review workflow for critical edits
- [ ] Business owner portal supports manual review submissions for sensitive changes

## Phase 4 — Staff Review & Governance
- [ ] Staff dashboards segmented by bureau (Licensing & Permits, Property Management, Compliance)
- [ ] Application review page with approve/reject/return/request-edit actions + audit trail display
- [ ] Approvals create/update canonical business records, trigger audit events, and fire Discord webhooks
- [ ] Public tipline triage view for Compliance bureau
- [ ] Monthly compliance inspection scheduler triggers reviews for each business on every founding anniversary month
- [ ] Activity proof workspace lets businesses upload screenshots, link documents, and maintain ongoing evidence of operations
- [ ] Strike tracking system revokes licenses after three inactive inspection cycles and flags legal violations for follow-up
- [ ] Surprise inspection workflow supports ad-hoc compliance visits and reporting

## Phase 5 — Property & Permit Operations
- [ ] Property request flow and staff tooling manage property assignments and photo uploads
- [ ] Permit request flow and approvals create permit records with audit logging
- [ ] Business & Property detail pages surface media galleries, audit history, and related entities

## Phase 6 — Support & Ticketing
- [ ] Dev support submission form available to business owners
- [ ] Staff kanban for ticket statuses (open, in_progress, waiting, resolved, closed)
- [ ] Owner portal provides permit/license management actions with status tracking
- [ ] Optional Discord pings on ticket status changes and manual review requests

## Phase 7 — Integrations & Enhancements
- [ ] Directory search, filters, and pagination tuned for performance
- [ ] Audit log UI enhancements and export tooling
- [ ] Roblox verification enhancements (in-game code or group checks) surfaced in profiles
- [ ] Discord role sync, contracts directory, job board prototypes, interactive property map, AI assistant experiments
