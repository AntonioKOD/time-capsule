import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to critters module error
    optimizePackageImports: ['lucide-react'],
  },

  // Output configuration for different deployment platforms
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      // Allow admin panel in iframe for development
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },

  // Rewrites - removed admin rewrite to prevent infinite redirect loops
  async rewrites() {
    return [
      // Payload CMS handles its own admin routing internally
      // No custom rewrites needed for admin panel
    ];
  },
  
  // Only ignore linting/TS errors in development
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // Webpack configuration for better compatibility
  webpack: (config, { dev, isServer }) => {
    // Fix for sharp module in serverless environments
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp$: false,
      };
    }

    return config;
  },

  // Environment variables to expose to client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    ADMIN_ENABLED: 'true',
  },
};

export default withPayload(nextConfig);
