import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["terminal.local"],
  transpilePackages: [
    "@nx-alive/core",
    "@nx-alive/react",
    "@nx-alive/presets",
  ],
};

export default nextConfig;
