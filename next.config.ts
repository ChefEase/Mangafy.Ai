import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack configuration for Next.js 16 (empty to silence warning, webpack used for builds)
  turbopack: {},
  // Webpack configuration for build process
  webpack(config) {
    // stub Node modules that @gradio/client imports but does NOT actually need in the browser
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false,
      path: false,
      os: false,
      stream: false,
      zlib: false,
      crypto: false
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Allow all origins (replace with your domain in production)
          },
        ],
      },
    ];
  },
};

// Export with PWA wrapper if PWA is enabled, otherwise export config directly
module.exports = process.env.NODE_ENV === "production" 
  ? withPWA(nextConfig)
  : nextConfig;
