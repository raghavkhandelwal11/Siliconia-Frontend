import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// In the prototype, Caddy serves the web app and /api on one origin (LLD 17.1).
// When running `next dev` directly on :3000, these rewrites forward API and
// test-inbox calls to the backend stack so the browser still sees one origin.
const backendURL = process.env.BACKEND_URL ?? "http://localhost:8080";

const dev = process.env.NODE_ENV !== "production";

// Security headers for every page (API responses get their own from the Go
// server). Next.js hydration needs inline scripts; dev mode also needs eval
// and the hot-reload socket.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${dev ? " ws: http://localhost:*" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // The Docker image runs the standalone server; Netlify (NETLIFY=true while
  // building) uses its own Next.js runtime instead.
  output: process.env.NETLIFY ? undefined : "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendURL}/api/:path*` },
      { source: "/test-inbox", destination: `${backendURL}/test-inbox` },
    ];
  },
};

export default withNextIntl(nextConfig);
