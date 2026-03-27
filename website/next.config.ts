import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/erstgespraech-buchen',
        destination: '/buchen',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
