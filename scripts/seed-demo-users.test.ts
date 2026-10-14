import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("local demo account seeder safety", () => {
  it("refuses a hosted Supabase URL before making a request", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/seed-demo-users.mjs"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_SERVICE_ROLE_KEY: "synthetic-test-key",
        },
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("may only be seeded into a local loopback");
    expect(result.stderr).not.toContain("synthetic-test-key");
  });

  it("refuses an HTTPS loopback URL", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/seed-demo-users.mjs"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: "https://localhost:54321",
          SUPABASE_SERVICE_ROLE_KEY: "synthetic-test-key",
        },
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("may only be seeded into a local loopback");
  });
});
