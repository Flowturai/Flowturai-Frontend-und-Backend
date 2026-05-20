import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Proxy all /api/* requests to the backend container.
  // In Docker, flowturai_api is reachable via the shared 'web' network.
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL || "http://flowturai_api:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
