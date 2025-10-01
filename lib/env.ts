import { z } from "zod";

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
    AUTH0_AUDIENCE: z.string().min(1).optional(),
    AUTH0_CONNECTION: z.string().min(1).optional(),
  })
  .transform((env) => ({
    ...env,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, ""),
  }));

const fallbackForTests = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
};

const runtimeEnv = {
  NEXT_PUBLIC_SUPABASE_URL:
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : fallbackForTests.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : fallbackForTests.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined,
  SUPABASE_PROJECT_REF: typeof process !== "undefined" ? process.env.SUPABASE_PROJECT_REF : undefined,
  DISCORD_WEBHOOK_URL: typeof process !== "undefined" ? process.env.DISCORD_WEBHOOK_URL : undefined,
  AUTH0_DOMAIN: typeof process !== "undefined" ? process.env.AUTH0_DOMAIN : undefined,
  AUTH0_CLIENT_ID: typeof process !== "undefined" ? process.env.AUTH0_CLIENT_ID : undefined,
  AUTH0_CLIENT_SECRET: typeof process !== "undefined" ? process.env.AUTH0_CLIENT_SECRET : undefined,
  AUTH0_AUDIENCE: typeof process !== "undefined" ? process.env.AUTH0_AUDIENCE : undefined,
  AUTH0_CONNECTION: typeof process !== "undefined" ? process.env.AUTH0_CONNECTION : undefined,
} satisfies Record<string, string | undefined>;

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
