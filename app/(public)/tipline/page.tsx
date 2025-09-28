import type { Metadata } from "next";

import { TiplineForm } from "./tipline-form";

export const metadata: Metadata = {
  title: "Public Tipline | Commerce Office Portal",
  description: "Submit compliance tips and community feedback directly to the commerce office.",
};

export default function TiplinePage() {
  return (
    <section className="flex flex-1 flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Compliance Tipline
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Report a Concern</h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          Use this form to share potential violations or observations. Anonymous submissions are
          welcome; please include enough context for Compliance staff to triage the report.
        </p>
      </header>

      <TiplineForm />
    </section>
  );
}
