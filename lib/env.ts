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

const processEnv = process.env as RuntimeEnv & Record<string, string | undefined>;
const isTestEnv = processEnv.NODE_ENV === "test";

const runtimeEnv = {
  NEXT_PUBLIC_SUPABASE_URL: isTestEnv
    ? fallbackForTests.NEXT_PUBLIC_SUPABASE_URL
    : processEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: isTestEnv
    ? fallbackForTests.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : processEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: processEnv.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_PROJECT_REF: processEnv.SUPABASE_PROJECT_REF,
  DISCORD_WEBHOOK_URL: processEnv.DISCORD_WEBHOOK_URL,
  AUTH0_DOMAIN: processEnv.AUTH0_DOMAIN,
  AUTH0_CLIENT_ID: processEnv.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: processEnv.AUTH0_CLIENT_SECRET,
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
