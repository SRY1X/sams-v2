import "server-only";
import { z } from "zod";

const siteOriginSchema = z
  .url()
  .refine((value) => {
    const url = new URL(value);
    const localHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    const secureProtocol =
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        localHost &&
        process.env.NODE_ENV === "development" &&
        !process.env.VERCEL);

    return (
      secureProtocol &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  }, "Expected an HTTPS site origin (HTTP is allowed only for local development on localhost).")
  .transform((value) => new URL(value).origin);

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  ATTENDANCE_TOKEN_SECRET: z.string().min(32),
});

export function getServerEnv() {
  return schema.parse(process.env);
}

export function getSiteOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredOrigin) return siteOriginSchema.parse(configuredOrigin);

  const deploymentHost = process.env.VERCEL_URL;
  if (process.env.VERCEL && deploymentHost) {
    return siteOriginSchema.parse(`https://${deploymentHost}`);
  }

  throw new Error(
    "Set NEXT_PUBLIC_SITE_URL to the canonical HTTPS site origin.",
  );
}
