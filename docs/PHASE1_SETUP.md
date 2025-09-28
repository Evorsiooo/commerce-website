# Phase 1 Setup Guide

This guide lists the manual tasks required to bring the Phase 1 foundation online. Complete everything in this order before moving to Phase 2.

## 1. Provision Supabase

1. Create a new Supabase project (US East preferred) and note the **Project Reference**.
2. In **Authentication → Providers**:
   - Enable **Discord**. Copy the client ID/secret from your Discord application and set the redirect URL to `https://<project-ref>.supabase.co/auth/v1/callback`.
   - Enable **Auth0** with a custom app that connects to your Roblox OAuth bridge. Use the same redirect URL and expose the connection as `auth0`.
3. In **Authentication → URL Configuration**, set the site URL to your Vercel deployment (or `http://localhost:3000` for development).
4. In **Storage → Buckets**, create buckets for `business-logos`, `property-photos`, and `audit-attachments`. Leave them private for now.
5. Open the SQL editor and run `db/migrations/0001_initial_schema.sql` to seed enums, tables, and RLS policies.

## 2. Configure Auth0 (Roblox Bridge)

1. Create an Auth0 tenant dedicated to Roblox OAuth.
2. Register a **Regular Web Application** with the same callback URL used above.
3. Under **Connections → Social**, create or enable your Roblox OAuth connection and name it exactly `roblox` (or the name you prefer—ensure it maps to `auth0` within Supabase).
4. In **Actions → Flows → Login**, add a post-login action that stores the Roblox username and ID in the ID token for Supabase to receive.
5. Add `http://localhost:3000/auth/callback` to the Allowed Callback URLs for local development.

## 3. Discord Application Checklist

1. Create a Discord application and OAuth redirect URI `http://localhost:3000/auth/callback` plus your Vercel domain.
2. Enable scopes `identify` and `email`. (The application also requests `guilds`; ensure it’s allowed.)
3. Copy the client ID/secret into Supabase’s Discord provider configuration.
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
