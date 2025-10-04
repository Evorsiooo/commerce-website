# Phase 1 Setup Guide

This guide lists the manual tasks required to bring the Phase 1 foundation online. Complete everything in this order before moving to Phase 2.

## 1. Provision Supabase

1. Create a new Supabase project (US East preferred) and note the **Project Reference**.
2. In **Authentication → Providers**:
   - Enable **Auth0** with your unified OAuth broker and set the redirect URL to `https://<project-ref>.supabase.co/auth/v1/callback`. (Supabase only uses this URL for server-to-server actions; user sign-ins now complete entirely through Auth0.)
   - Disable Supabase's built-in Discord provider. Discord now authenticates through Auth0 alongside Roblox, so Supabase only needs the Auth0 provider enabled.
3. In **Authentication → URL Configuration**, set the site URL to your Vercel deployment (or `http://localhost:3000` for development).
4. In **Storage → Buckets**, create buckets for `business-logos`, `property-photos`, and `audit-attachments`. Leave them private for now.
5. Open the SQL editor and run `db/migrations/0001_initial_schema.sql` to seed enums, tables, and RLS policies.

## 2. Configure Auth0 (Roblox Bridge)

1. Create an Auth0 tenant dedicated to Roblox OAuth.
2. Register a **Regular Web Application** and add `http://localhost:3000/api/auth/auth0/callback` plus your Vercel domain followed by `/api/auth/auth0/callback` to the allowed callback URLs.
3. Under **Connections → Social**, enable both Roblox and Discord. Use stable connection names (for example, `roblox` and `discord`) to reference in environment variables.
4. In **Actions → Flows → Login**, add a post-login action that maps Roblox and Discord profile data into custom ID token claims (for example `https://commerce.portal/roblox_username`). The application verifies Auth0 tokens directly, so no fabricated email address is required.

## 3. Discord Application Checklist

1. Create a Discord application and set the OAuth redirect URI to your Auth0 tenant callback URL (usually `https://<tenant>.auth0.com/login/callback`) and your production tenant URL.
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
2. Visit `http://localhost:3000` and choose **Sign in with Discord** or **Sign in with Roblox**. Approve the Auth0-hosted login.
3. After returning to the portal, the profile page should display your Auth0 subject and connection metadata.
4. Confirm Supabase → Authentication → Users records do not include duplicate fabricated emails; Auth0 manages the user and the portal now validates Auth0 tokens directly.

---

When all steps succeed, Phase 1 is complete and you can proceed to public portal features in Phase 2.
