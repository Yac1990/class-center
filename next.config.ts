import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  allowedDevOrigins: ["0.0.0.0", "localhost", "*.replit.dev", "*.spock.replit.dev"],
};

export default nextConfig;
