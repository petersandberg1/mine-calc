import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["jspdf-autotable"],
  // Disable Turbopack to use webpack (if needed)
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
