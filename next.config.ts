import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// In the prototype, Caddy serves the web app and /api on one origin (LLD 17.1).
// When running `next dev` directly on :3000, these rewrites forward API and
// test-inbox calls to the backend stack so the browser still sees one origin.
const backendURL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendURL}/api/:path*` },
      { source: "/test-inbox", destination: `${backendURL}/test-inbox` },
    ];
  },
};

export default withNextIntl(nextConfig);
