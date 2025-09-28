import Link from "next/link";
import { redirect } from "next/navigation";

import { providerLabel, resolveLinkedProviders } from "@/lib/auth/linking";
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

  const providerState = resolveLinkedProviders(session.user);
  const profile = session.user.user_metadata ?? {};
  const allowLinking = Object.values(providerState).some((linked) => !linked);

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
          {allowLinking ? (
            <Link
              href="/auth/link-accounts"
              className="inline-flex items-center rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
            >
              Link missing providers
            </Link>
          ) : null}
        </footer>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">Linked identity providers</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {Object.entries(providerState).map(([provider, linked]) => (
            <li key={provider} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
              <span>{providerLabel(provider as "discord")}</span>
              <span className={linked ? "text-emerald-600" : "text-amber-600"}>
                {linked ? "Linked" : "Not linked"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
