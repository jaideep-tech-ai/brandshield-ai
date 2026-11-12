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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://identitytoolkit.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: https://z-cdn.chatglm.cn https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://gitlab.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://generativelanguage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://gitlab.com https://api.figma.com https://docs.google.com",
              "frame-src 'self' https://accounts.google.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com https://gitlab.com https://www.figma.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
