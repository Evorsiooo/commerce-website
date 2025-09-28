import { z } from "zod";

type RuntimeEnv = NodeJS.ProcessEnv & {
  NODE_ENV: string;
};

const serverSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SUPABASE_PROJECT_REF: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/i, "Expected Supabase project ref" )
      .optional(),
    DISCORD_WEBHOOK_URL: z.string().url().optional(),
    AUTH0_DOMAIN: z.string().min(1).optional(),
    AUTH0_CLIENT_ID: z.string().min(1).optional(),
    AUTH0_CLIENT_SECRET: z.string().min(1).optional(),
  })
  .transform((env) => ({
    ...env,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, ""),
  }));

const fallbackForTests = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
};

const runtimeEnv: Record<string, string | undefined> = {
  ...(((process.env as RuntimeEnv).NODE_ENV === "test" && fallbackForTests) || {}),
  ...process.env,
};

const parsed = serverSchema.safeParse(runtimeEnv);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

export const env = parsed.data;

export const publicEnv = (({ NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL }) => ({
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
}))(env);
