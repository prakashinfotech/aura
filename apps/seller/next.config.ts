import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aura/ui", "@aura/db", "@aura/validators"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
