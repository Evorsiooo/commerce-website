import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/app/profile/logout-button";

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/auth/login?redirect=${encodeURIComponent("/profile")}`);
  }

  const profile = session.user.user_metadata ?? {};
  const identities = session.user.identities ?? [];

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-neutral-500">Account</span>
          <h1 className="text-3xl font-semibold">{profile.full_name ?? session.user.email ?? "Portal member"}</h1>
          <p className="text-sm text-neutral-600">
            Supabase UID: <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{session.user.id}</code>
          </p>
        </header>

        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Discord</dt>
            <dd className="text-sm text-neutral-800">
              {profile.user_name ?? profile.discord_username ?? "Pending link"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Roblox</dt>
            <dd className="text-sm text-neutral-800">
              {profile.roblox_username ?? "Pending link"}
            </dd>
          </div>
        </dl>

        <footer className="mt-8 flex flex-wrap gap-3">
          <LogoutButton />
        </footer>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">Identity providers</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {identities.length === 0 ? (
            <li className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              No identity providers detected.
            </li>
          ) : (
            identities.map((identity) => (
              <li key={`${identity.provider}:${identity.id}`} className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                <span className="font-medium capitalize">{identity.provider}</span>
                <span className="text-xs text-neutral-600">{identity.id}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
