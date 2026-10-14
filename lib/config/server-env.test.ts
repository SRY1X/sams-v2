import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSiteOrigin } from "./server-env";

vi.mock("server-only", () => ({}));

describe("site origin", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_URL", "sams-generated.vercel.app");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["production", "preview"])(
    "uses the configured canonical origin in %s",
    (environment) => {
      vi.stubEnv("VERCEL_ENV", environment);
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://sams.example/");

      expect(getSiteOrigin()).toBe("https://sams.example");
    },
  );

  it("derives the generated HTTPS origin for Preview", () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    expect(getSiteOrigin()).toBe("https://sams-generated.vercel.app");
  });

  it.each(["production", "development", undefined])(
    "requires a canonical origin when VERCEL_ENV is %s",
    (environment) => {
      vi.stubEnv("VERCEL_ENV", environment);

      expect(() => getSiteOrigin()).toThrow(
        "Set NEXT_PUBLIC_SITE_URL to the canonical HTTPS site origin.",
      );
    },
  );

  it("requires a canonical origin when Preview has no generated host", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", undefined);

    expect(() => getSiteOrigin()).toThrow(
      "Set NEXT_PUBLIC_SITE_URL to the canonical HTTPS site origin.",
    );
  });
});
