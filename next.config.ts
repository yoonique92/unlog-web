import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "172.30.1.52",
    "172.30.1.53",
    "172.30.1.21",
    "127.0.0.1",
    "localhost",
  ],
};

export default nextConfig;
