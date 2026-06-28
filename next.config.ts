import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "localhost",
    "localhost:81",
    "localhost:3000",
    "21.0.13.157:3000",
    "21.0.13.157:81",
  ],
};

export default nextConfig;
