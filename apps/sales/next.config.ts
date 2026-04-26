import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Disambiguate workspace root: monorepo lives at ../../ (ignore stray ~/package-lock.json)
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  transpilePackages: ['@onvero/ui'],
  // Safety net during monorepo migration; remove once Step 5 (packages/lib)
  // is complete and import paths are verified.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'jnaqmsvozkpqawqwslrl.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' https://plausible.io${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://jnaqmsvozkpqawqwslrl.supabase.co https://images.unsplash.com https://media.licdn.com https://zenprospect-production.s3.amazonaws.com",
              "font-src 'self' data:",
              "connect-src 'self' https://jnaqmsvozkpqawqwslrl.supabase.co wss://jnaqmsvozkpqawqwslrl.supabase.co https://plausible.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
