import { redirect } from "next/navigation";

import { LogoutButton } from "@/app/profile/logout-button";
import { readAuth0SessionFromCookies } from "@/lib/auth/session";

function formatProviderLabel(provider: string | null, connection: string | null) {
  if (provider) {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  }

  if (connection) {
    return connection.charAt(0).toUpperCase() + connection.slice(1);
  }

  return "Auth0";
}

function extractUsername(claims: Record<string, unknown>, provider: string | null) {
  const nickname = typeof claims.nickname === "string" ? claims.nickname : null;
  const preferred = typeof claims.preferred_username === "string" ? claims.preferred_username : null;
  const name = typeof claims.name === "string" ? claims.name : null;

  if (provider === "discord") {
    return nickname ?? preferred ?? name;
  }

  if (provider === "roblox") {
    return preferred ?? nickname ?? name;
  }

  return name ?? nickname ?? preferred;
}

export default async function ProfilePage() {
  const session = await readAuth0SessionFromCookies();

  if (!session) {
    redirect(`/auth/login?redirect=${encodeURIComponent("/profile")}`);
  }

  const claims = session.claims;
  const provider = session.provider ?? (claims.sub?.split?.("|")[0] ?? null);
  const username = extractUsername(claims, provider);
  const providerLabel = formatProviderLabel(provider, session.connection);

  const customMetadata = (claims["https://commerce.portal/user_metadata"] as Record<string, unknown> | undefined) ?? {};

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <header className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-neutral-500">Account</span>
          <h1 className="text-3xl font-semibold">{username ?? "Portal member"}</h1>
          <p className="text-sm text-neutral-600">
            Auth subject: <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{claims.sub}</code>
          </p>
        </header>

        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Provider</dt>
            <dd className="text-sm text-neutral-800">{providerLabel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Connection</dt>
            <dd className="text-sm text-neutral-800">{session.connection ?? "Default"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-neutral-500">Token expiry</dt>
            <dd className="text-sm text-neutral-800">
              {new Date(session.expiresAt * 1000).toLocaleString()}
            </dd>
          </div>
          {typeof customMetadata === "object" && customMetadata !== null ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">Profile metadata</dt>
              <dd className="text-sm text-neutral-800">
                {Object.keys(customMetadata).length === 0 ? "None" : null}
                {Object.entries(customMetadata).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-2 text-xs text-neutral-600">
                    <span className="font-medium text-neutral-700">{key}</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>

        <footer className="mt-8 flex flex-wrap gap-3">
          <LogoutButton />
        </footer>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold">Identity summary</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          <li className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
            <span className="font-medium">{providerLabel}</span>
            <span className="text-xs text-neutral-600">{claims.sub}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
