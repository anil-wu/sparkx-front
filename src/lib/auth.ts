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
  const databaseUrl =
    process.env.DATABASE_URL ||
    "mysql://sparkplay:sparkplay@47.112.97.49:3306/sparkplay";
  return createPool(databaseUrl);
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

export const auth = betterAuth({
  secret: requireEnv("BETTER_AUTH_SECRET"),
  baseURL: requireEnv("BETTER_AUTH_URL"),
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
