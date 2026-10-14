import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack's filesystem boundary aligned with this app and its lockfile.
  turbopack: { root: process.cwd() },
  // Optional hostnames (without scheme or port) for opening the dev server on
  // another device on the local network. Keep the list in ignored .env.local.
  allowedDevOrigins: (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
