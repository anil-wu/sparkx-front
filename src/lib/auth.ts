import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
};

const createDatabase = () => {
  return createPool(requireEnv("DATABASE_URL"));
};

const normalizeBaseURL = (raw?: string): string | undefined => {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const normalized = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?($|\/)/i.test(trimmed)
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  try {
    return new URL(normalized).toString().replace(/\/$/, "");
  } catch {
    console.warn(
      `[auth] Ignoring invalid BETTER_AUTH_URL: "${trimmed}". Falling back to request headers.`,
    );
    return undefined;
  }
};

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (
  (googleClientId && !googleClientSecret) ||
  (!googleClientId && googleClientSecret)
) {
  throw new Error(
    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set to enable Google login.",
  );
}

const configuredBaseURL = normalizeBaseURL(process.env.BETTER_AUTH_URL);

export const auth = betterAuth({
  secret: requireEnv("BETTER_AUTH_SECRET"),
  ...(configuredBaseURL
    ? {
        baseURL: configuredBaseURL,
      }
    : {
        advanced: {
          // In proxy/serverless environments (for example Vercel), infer protocol/host from request headers.
          trustedProxyHeaders: true,
        },
      }),
  database: createDatabase(),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined,
});
