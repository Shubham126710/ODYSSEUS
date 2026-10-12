import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@mozilla/readability', 'linkedom'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
