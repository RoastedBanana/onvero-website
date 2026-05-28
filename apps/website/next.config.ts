import type { NextConfig } from "next";
import path from "node:path";

const SALES_URL = "https://sales.onvero.de";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  transpilePackages: ["@onvero/ui", "@onvero/lib"],
  async redirects() {
    return [
      {
        source: "/login",
        destination: `${SALES_URL}/login`,
        permanent: false,
      },
      {
        source: "/join",
        destination: `${SALES_URL}/join`,
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: `${SALES_URL}/intelligence`,
        permanent: false,
      },
      {
        source: "/",
        destination: `${SALES_URL}`,
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
