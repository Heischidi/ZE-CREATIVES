import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd()),
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "lucide-react": path.resolve(process.cwd(), "node_modules/lucide-react"),
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: "/dashboard/client",
        destination: "/client",
        permanent: false,
      },
      {
        source: "/dashboard/creative",
        destination: "/creative",
        permanent: false,
      },
      {
        source: "/dashboard/admin",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/jobs",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
