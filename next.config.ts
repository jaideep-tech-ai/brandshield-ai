import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` is only for self-hosting (Docker / bare node server).
  // Vercel builds the standard output itself — enabling standalone there is
  // unnecessary and can confuse the platform. Set NEXT_OUTPUT_STANDALONE=1
  // when building for self-hosted deployments (bun run build:standalone).
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Production hardening for hosting platforms
  poweredByHeader: false,
  compress: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
