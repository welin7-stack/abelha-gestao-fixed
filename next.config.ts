import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["xlsx"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  allowedDevOrigins: [
    "https://preview-chat-79cf34d8-06d5-4a01-a863-32d3d288ee9f.space.z.ai",
    "*.space.z.ai",
  ],
};

export default nextConfig;
