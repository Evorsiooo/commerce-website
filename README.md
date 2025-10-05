## Commerce Office Portal

Phase 1 delivers the foundation for the Roblox Ro-State Commerce Office portal: a Next.js App Router UI backed by Supabase auth, schema, and RLS. All later phases build on top of the assets introduced here.

### Prerequisites

- Supabase project with Auth0 provider configured (Discord now flows through Auth0). The repo ships a helper script – run `npm run supabase:configure-auth0` after supplying the Supabase service role key and Auth0 credentials.
- Auth0 tenant with Roblox + Discord social connections
- Node.js 20+
- Supabase CLI (`npm install -g supabase`)

Follow the [Phase 1 setup guide](./docs/PHASE1_SETUP.md) for a complete provisioning checklist.

### Install dependencies

```bash
npm install
```

### Development commands

```bash
npm run dev          # Start Next.js with Turbopack
npm run lint         # ESLint against the whole project
npm run typecheck    # TypeScript project-wide check
npm test             # Vitest unit suite
npm run supabase:types  # Regenerate Supabase database types (after supabase link)
npm run supabase:configure-auth0  # Upsert the Supabase Auth0 OIDC provider via API
```

### Directory highlights

- `app/` – App Router routes, layouts, and client components
- `lib/` – Environment parsing, Supabase clients, auth helpers
- `db/migrations/` – SQL migrations (Phase 1 ships `0001_initial_schema.sql`)
- `docs/` – Operator guides and manual setup instructions
- `tests/` – Vitest suite (ready for future auth coverage)

### Phase 1 checks

- ✅ Next.js scaffold with shared layout & navigation
- ✅ Supabase schema + RLS baseline
- ✅ Dual-provider linking flow (Discord + Roblox/Auth0) *(temporarily disabled during relaunch prep)*
- ✅ Profile stub and middleware enforcement
- ✅ Vitest suite + ESLint/TypeScript configuration
