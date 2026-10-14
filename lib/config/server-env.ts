import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  ATTENDANCE_TOKEN_SECRET: z.string().min(32),
});

export function getServerEnv() {
  return schema.parse(process.env);
}
