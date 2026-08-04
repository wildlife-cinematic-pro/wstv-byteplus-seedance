import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "localhost",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
