"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Database } from "@/db/types/supabase";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";

const schema = z.object({
  businessName: z
    .string()
    .trim()
    .max(120, "Keep the business name under 120 characters")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  description: z
    .string()
    .trim()
    .min(20, "Please provide at least 20 characters so our team has context"),
  evidenceUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value == null || /^https?:\/\//i.test(value),
      "URLs should start with http:// or https://",
    ),
});

export type TiplineFormValues = z.infer<typeof schema>;

type TiplineInsert = Database["public"]["Tables"]["tipline_reports"]["Insert"];

export function TiplineForm() {
  const supabase = getBrowserSupabaseClient();
  const [submissionState, setSubmissionState] = useState<{ status: "idle" | "success" | "error"; message?: string }>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TiplineFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      description: "",
      evidenceUrl: "",
    },
  });

  const onSubmit = handleSubmit(async (values: TiplineFormValues) => {
    setSubmissionState({ status: "idle" });

    const payload: TiplineInsert = {
      business_name: values.businessName,
      description: values.description,
      evidence_url: values.evidenceUrl,
    };

    const { error } = await supabase
      .from("tipline_reports")
      // Cast required until Supabase type generation runs against a live project.
      .insert(payload as never);

    if (error) {
      setSubmissionState({ status: "error", message: error.message });
      return;
    }

    reset();
    setSubmissionState({ status: "success" });
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div className="grid gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-neutral-800">
          Business or Location (optional)
          <input
            type="text"
            placeholder="Example: Downtown Bakery"
            {...register("businessName")}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            aria-invalid={errors.businessName ? "true" : "false"}
          />
          {errors.businessName ? (
            <span className="text-xs text-red-600">{errors.businessName.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-neutral-800">
          Describe the concern
          <textarea
            rows={6}
            placeholder="Share what happened, with names, shifts, or context that will help compliance investigate."
            {...register("description")}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            aria-invalid={errors.description ? "true" : "false"}
          />
          {errors.description ? (
            <span className="text-xs text-red-600">{errors.description.message}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-neutral-800">
          Evidence link (optional)
          <input
            type="url"
            placeholder="https://"
            {...register("evidenceUrl")}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            aria-invalid={errors.evidenceUrl ? "true" : "false"}
          />
          {errors.evidenceUrl ? (
            <span className="text-xs text-red-600">{errors.evidenceUrl.message}</span>
          ) : null}
        </label>
      </div>

      {submissionState.status === "success" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Thanks for the report! Compliance staff will review it shortly.
        </p>
      ) : null}

      {submissionState.status === "error" ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn’t submit your report: {submissionState.message ?? "unknown error"}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Submitting…" : "Submit tip"}
      </Button>
    </form>
  );
}
