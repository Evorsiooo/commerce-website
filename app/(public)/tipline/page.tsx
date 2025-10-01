import type { Metadata } from "next";

import tiplineContent from "@/config/pages/tipline.json";
import { FormTemplate } from "@/templates/form-template";

import { TiplineForm } from "./tipline-form";

export const metadata: Metadata = {
  title: "Public Tipline | Commerce Office Portal",
  description: "Submit compliance tips and community feedback directly to the commerce office.",
};

export default function TiplinePage() {
  return (
    <FormTemplate
      eyebrow={tiplineContent.intro.eyebrow}
      heading={tiplineContent.intro.heading}
      description={tiplineContent.intro.description}
      form={<TiplineForm />}
    />
  );
}
