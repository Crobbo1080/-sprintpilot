import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.83"],
  async rewrites() {
    return [
      {
        source: "/report/:sessionId",
        destination: "/?reportSessionId=:sessionId",
      },
    ];
  },
};

export default nextConfig;