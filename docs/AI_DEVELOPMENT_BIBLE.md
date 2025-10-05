# Commerce Portal Coding Bible

> **Audience:** AI or human contributors building on the Commerce Office Portal. Follow this document _before every change_ to guarantee consistent, correct, and maintainable code.

---

## 1. First Principles

1. **Follow the roadmap.** Never invent scope. Confirm tasks against `master_plan.md`, `TODO.md`, and `docs/PHASE2_5_FRAMEWORK_PLAN.md`.
2. **Templates over improvisation.** All UI builds on the shared templates and components. If something feels “custom,” you’re probably doing it wrong.
3. **Immutable guardrails.** Do not bypass lint rules, scaffolds, or QA checks. If a guardrail fails, stop and fix the root cause.
4. **Tiny, documented changes.** Keep diffs focused, update docs/tests alongside code, and narrate every change in the TODO list.
5. **No hidden behavior.** Every feature has typed props, documented APIs, and predictable data flow.

---

## 2. Immediate Do / Do Not Reference

| ✅ Always Do | ❌ Never Do |
| --- | --- |
| Use `npm run scaffold:page -- --template <type>` for new routes/components. | Hand-roll pages or copy/paste markup from existing routes. |
| Import layout/UI primitives from `ui/` and templates from `templates/`. | Reach directly into `app/(public)` components or inline Tailwind classes beyond tokens. |
| Update README, TODO, template docs when behavior changes. | Ship undocumented features or leave TODO/items stale. |
| Run `npm run lint`, `npm run typecheck`, `npm test` after any substantive change. | Skip checks because “it’s small” or rely on CI to catch issues. |
| Keep schema/types in sync (`supabase/migrations`, `db/types`). | Modify DB columns without a migration or regenerate types later. |
| Use manifest-driven copy files under `config/pages/` when adjusting text. | Hardcode copy inside React components. |
| Push auth changes through middleware + Supabase policies simultaneously. | Modify only the frontend/auth UI without guaranteeing backend enforcement. |

---

## 3. Required Tooling & Commands

| Tool | Purpose | Command |
| --- | --- | --- |
| Template scaffolder | Create new pages/components | `npm run scaffold:page -- --template <landing|directory|detail|form|utility> --route <path>` |
| Lint | Enforce style & boundaries | `npm run lint` |
| Typecheck | Ensure TypeScript safety | `npm run typecheck` |
| Tests | Run unit/integration suites | `npm test` (or `npm test -- --runInBand` when needed) |
| Supabase types | Regenerate after migrations | `npm run supabase:types` |
| Phase alignment | Review phases/tasks | Open `master_plan.md`, `TODO.md`, `docs/PHASE2_5_FRAMEWORK_PLAN.md` |

> Tip: the scaffolder should auto-run lint/typecheck/test in a post-script. If the repo hasn’t implemented this yet, run them manually.

---

## 4. Standard Workflows

### 4.1 New Page / Feature Flow

1. **Clarify scope.** Confirm acceptance criteria in TODO/master plan. Add/adjust TODO entries with precise wording.
2. **Generate stub.** Run the scaffolder with the appropriate template. Example: `npm run scaffold:page -- --template directory --route businesses/owners`.
3. **Populate manifest.** Add/edit `config/pages/<route>.json` for copy/metadata. Do not store copy in components.
4. **Implement logic.**
   - Fetch data in `lib/data/`. Add tests as needed.
   - Use shared modules (`FilterBar`, `DirectoryCard`, `EmptyState`, etc.). If a needed pattern doesn’t exist, design it as a reusable module first.
5. **Wire auth/permissions.** Ensure middleware + Supabase policies reflect the desired access.
6. **Documentation.** Update the relevant template doc (`docs/templates/...`), plus README if commands or expectations shift.
7. **Quality gates.** Run lint/typecheck/tests. Fix any issues _before_ committing.
8. **Record in TODO list.** Mark tasks as complete with brief rationale; note follow-ups if work remains.

### 4.2 Bug Fix / Refactor Flow

1. Capture the bug in TODO (link to reproduction).
2. Read existing component/template docs to understand intended behavior.
3. Write/adjust tests that expose the bug.
4. Fix the issue using existing patterns; avoid introducing new abstractions unless necessary.
5. Run QA gates and update documentation if behavior changes.
6. Mark TODO entry complete with summary + link to tests.

### 4.3 Schema / Auth Changes

1. Draft migration SQL under `supabase/migrations/`. Include up/down comments.
2. Run migration locally (if environment configured) and regenerate types.
3. Update `lib/data/` and templates to handle new fields gracefully (include fallback logic like the regulations compatibility check).
4. Adjust Supabase policies or middleware to maintain enforcement.
5. Document schema change in `docs/auth/LIFECYCLE.md` or relevant domain doc.

### 4.4 Documentation-Only Updates

1. Confirm the change aligns with master plan.
2. Update the doc and cross-reference anywhere it’s cited.
3. Run lint/typecheck/tests if documentation impacts scripts or configuration.
4. Note the update in TODO (if it fulfills a task) and include summary in PR description.

---

## 5. Guardrails & Enforcement

- **ESLint boundaries** ensure templates/components are the only allowed imports. If lint fails, do not ignore—repair the architecture.
- **Storybook/MDX cookbook** documents prop shapes. Keep it updated; add examples when introducing new component variants.
- **CI Scaffold Smoke Test** runs `npm run scaffold:page` on a sample route plus lint/typecheck. Do not merge changes that break the smoke test.
- **Auth Status Machine** (`profiles.account_status`) must reflect authentication state. Any auth change should include state machine review.

---

## 6. Quality Gates Checklist (Run Before Every Commit)

1. ✅ `npm run lint`
2. ✅ `npm run typecheck`
3. ✅ `npm test`
4. ✅ Manual smoke of affected pages (mobile + desktop viewport)
5. ✅ Verify auth/linking behavior if touched (attempt anonymous access + both Auth0-backed providers)
6. ✅ Update TODO and docs
7. ✅ Ensure migrations and generated types are committed together

If any step fails, stop and resolve before continuing.

---

## 7. Escalation & Exception Handling

- **Missing Template/Component:** Propose addition in TODO and extend `docs/PHASE2_5_FRAMEWORK_PLAN.md` _before_ writing code.
- **Incompatible Legacy Data:** Add compatibility layers (as done with regulations) rather than blocking deploys. Document the fallback and schedule cleanup.
- **Blocked by Tooling:** If scaffolder or lint rules break, prioritize fixing tooling first, then resume feature work.

---

## 8. Reference Map

| Topic | Source |
| --- | --- |
| Phase roadmap & scope | `master_plan.md`, `TODO.md` |
| Template architecture | `docs/PHASE2_5_FRAMEWORK_PLAN.md`, `docs/templates/` |
| Auth lifecycle | `docs/auth/LIFECYCLE.md` (to be created/maintained) |
| Coding bible (this file) | `docs/AI_DEVELOPMENT_BIBLE.md` |
| Supabase schema/types | `supabase/migrations/`, `db/types/` |
| Shared UI components | `ui/`, `templates/`, Storybook/MDX docs |

Always cross-check these references before writing a single line of code.

---

_This bible is binding. If a workflow or tool evolves, update this document immediately so future contributors stay aligned._
