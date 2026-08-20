import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.18.22', '192.168.0.103'],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

