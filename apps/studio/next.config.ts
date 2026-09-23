import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@nx-alive/core",
    "@nx-alive/react",
    "@nx-alive/presets",
  ],
};

export default nextConfig;
