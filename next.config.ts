import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["jspdf-autotable"],
  // Use webpack instead of Turbopack for better compatibility
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
