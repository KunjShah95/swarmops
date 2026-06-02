import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
      { source: "/health", destination: `${backendUrl}/health` },
      { source: "/docs", destination: `${backendUrl}/docs` },
      { source: "/openapi.json", destination: `${backendUrl}/openapi.json` },
    ];
  },
};

export default nextConfig;
