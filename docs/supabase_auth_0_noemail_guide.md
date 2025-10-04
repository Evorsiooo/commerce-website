# 🔐 Supabase + Auth0 (Discord/Roblox) Auth Guide — No Emails

This guide explains how to integrate **Auth0** (with Discord or Roblox login) into **Supabase** without using emails at all. It is designed for automation or AI agents managing authentication flows.

---

## 🧠 Goal
Enable users to authenticate via **Discord** or **Roblox** (through Auth0), while **Supabase** verifies Auth0's JWTs directly — no email, no password, no Supabase Auth users.

---

## ⚙️ Step 1 — Enable Third‑Party Auth (Auth0 → Supabase)
1. Go to **Supabase Dashboard → Authentication → Third‑party Auth**.
2. Add your **Auth0 tenant domain** (e.g., `myapp.eu.auth0.com`).
3. Save changes.

Supabase will fetch Auth0’s JWKS and trust Auth0’s RS256‑signed tokens.

---

## 🪄 Step 2 — Add an Auth0 Action to Set Claims
In Auth0, create an **Action → Post Login** and add this code:

```js
exports.onExecutePostLogin = async (event, api) => {
  api.accessToken.setCustomClaim('role', 'authenticated');

  // Optionally add custom claims
  api.accessToken.setCustomClaim('discord_id', event.user.identities?.[0]?.user_id);
  api.accessToken.setCustomClaim('roblox_id', event.user.user_metadata?.roblox_id);
};
```

🔸 Use **RS256** tokens (Auth0 default).
🔸 Add any other fields your app needs — these will appear in the Supabase JWT payload.

---

## 🔑 Step 3 — Client Integration
Use Auth0’s SPA SDK and configure Supabase to use Auth0’s JWT as the access token:

```ts
import { createClient } from '@supabase/supabase-js';
import Auth0Client from '@auth0/auth0-spa-js';

const auth0 = new Auth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: { redirect_uri: '<MY_CALLBACK_URL>' },
});

export const supabase = createClient(
  'https://<project>.supabase.co',
  '<SUPABASE_ANON_KEY>',
  {
    accessToken: async () => await auth0.getTokenSilently(),
  }
);
```

🧩 The client now sends the Auth0 JWT to Supabase for every request. Supabase validates it and applies RLS policies.

---

## 🧱 Step 4 — RLS (Row Level Security) Without Emails
Use JWT claims instead of `auth.uid()`. Example table:

```sql
create table profiles (
  ext_sub text primary key, -- stores Auth0 subject like 'auth0|abc123'
  data jsonb
);

alter table profiles enable row level security;

create policy "owner can read/update their profile"
on profiles
for all
using (ext_sub = (auth.jwt()->>'sub'))
to authenticated;
```

This ensures users can only access their own rows.

---

## 🧩 Step 5 — Optional Enhancements
- Add `discord_id` or `roblox_id` columns and link them to claims.
- Disable built‑in Supabase email/password auth entirely.
- Combine with Supabase’s **Anonymous Sign‑Ins** for guest flows.

---

## ✅ Summary Table

| Goal | Method | Email Needed | Notes |
|------|---------|---------------|-------|
| Use Discord/Roblox login via Auth0 | Third‑party Auth (Auth0) | ❌ | Recommended setup |
| Add custom IDs | Add custom claims in Auth0 Action | ❌ | Use in RLS policies |
| Use Supabase Auth users | Email/password | ✅ | Not needed here |
| Temporary guest login | Anonymous Sign‑In | ❌ | Can later link to Auth0 |

---

## 🧭 Key Takeaways
- Supabase can verify **Auth0’s RS256 JWTs** directly.
- You can **fully skip emails** by relying on external OAuth providers.
- Use **`auth.jwt()`** to access claims instead of `auth.uid()`.
- Role claim (`role = authenticated`) is required for RLS policies to apply.

---

**Outcome:**
- Discord/Roblox → Auth0 → JWT → Supabase (verified, email‑free)
- Fully compatible with Row Level Security, Postgres policies, and Supabase API.

