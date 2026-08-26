import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@mediapipe/tasks-vision"],
  turbopack: {},
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/.playwright-cli/**", "**/.git/**"],
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/emotion-weather",
        destination: "/emotion-weather/index.html",
      },
    ];
  },
};

export default nextConfig;
