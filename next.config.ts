import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // No external ESM dependencies to transpile (recharts/lucide-react not used)
  // All chart components use inline SVG/CSS
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
