# Phase 1 Setup Guide

This guide lists the manual tasks required to bring the Phase 1 foundation online. Complete everything in this order before moving to Phase 2.

## 1. Provision Supabase

1. Create a new Supabase project (US East preferred) and note the **Project Reference**.
2. In **Authentication → Providers**:
   - Enable **Auth0** as a custom OIDC provider and set the redirect URL to `https://<project-ref>.supabase.co/auth/v1/callback`. Name the provider slug `auth0` (or adjust `SUPABASE_AUTH0_PROVIDER_ID` in the app env if you choose a different slug).
   - Disable Supabase's built-in Discord provider. Discord now authenticates through Auth0 alongside Roblox, so Supabase only needs the Auth0 provider enabled.
3. In **Authentication → URL Configuration**, set the site URL to your Vercel deployment (or `http://localhost:3000` for development).
4. In **Storage → Buckets**, create buckets for `business-logos`, `property-photos`, and `audit-attachments`. Leave them private for now.
5. Open the SQL editor and run `db/migrations/0001_initial_schema.sql` to seed enums, tables, and RLS policies.

## 2. Configure Auth0 (Roblox Bridge)

1. Create an Auth0 tenant dedicated to Roblox OAuth.
2. Register a **Regular Web Application** with the same callback URL used above.
3. Under **Connections → Social**, enable both Roblox and Discord. Use stable connection names (for example, `roblox` and `discord`) to reference in environment variables.
4. In **Actions → Flows → Login**, add a post-login action that (a) stores the Roblox username/ID and Discord metadata, and (b) fabricates a deterministic email (e.g., `roblox_<id>@oauth.local`) so Supabase will accept the sign-in without exposing real addresses. Be sure the action adds an `email` claim because the application requests the `email` scope.
5. Add `http://localhost:3000/auth/callback` to the Allowed Callback URLs for local development.

## 3. Discord Application Checklist

1. Create a Discord application and OAuth redirect URI `http://localhost:3000/auth/callback` plus your Vercel domain.
2. Enable scopes `identify` and `email`. (The application also requests `guilds`; ensure it’s allowed.)
3. Copy the client ID/secret into Auth0’s Discord social connection configuration.
4. If you plan to send webhook notifications, create the channel webhook URL now and paste it into `.env` later.

## 4. Environment Variables

1. Copy `.env.example` to `.env.local`.
2. Fill each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` – From Supabase project settings.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key.
   - `SUPABASE_SERVICE_ROLE_KEY` – Service role key (used for migrations/seed scripts only, never exposed to the browser).
   - `SUPABASE_PROJECT_REF` – Supabase project reference (needed for the type generator script).
   - `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` – From Auth0 application.
   - `DISCORD_WEBHOOK_URL` – Optional, for notifications.
   - `AUTH0_ROBLOX_CONNECTION`, `AUTH0_DISCORD_CONNECTION` – Exact Auth0 connection names for Roblox and Discord social logins (fallback to `AUTH0_CONNECTION` for Roblox if present).
   - `SUPABASE_AUTH0_PROVIDER_ID` – Supabase Auth → Providers slug for the Auth0 custom OIDC provider (defaults to `auth0`).
3. Restart the dev server after editing env values.

## 5. Generate Types & Run Checks

1. Install the Supabase CLI (`npm install -g supabase` or via Homebrew).
2. Authenticate the CLI: `supabase login`.
3. Link the local project: `supabase link --project-ref <your-project-ref>`.
4. Generate TypeScript types so the app can use strongly typed queries:

   ```bash
   npm run supabase:types
   ```

5. Run verification scripts:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test`

## 6. First-Time Login Flow Smoke Test

1. Start the dev server: `npm run dev`.
2. Visit `http://localhost:3000` and click **Sign in with Discord**. Approve the request.
3. After returning to the portal, follow the prompt to link your Roblox account (Auth0).
4. Confirm the profile page shows both providers as **Linked**.
5. Check Supabase → Authentication → Users to confirm the identities list contains both `discord` and `auth0` providers.

---

When all steps succeed, Phase 1 is complete and you can proceed to public portal features in Phase 2.
