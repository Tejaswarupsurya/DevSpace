import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root: process.cwd(), // Explicitly set the correct project root
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all HTTPS hostnames
      },
    ],
  },
};

export default nextConfig;
