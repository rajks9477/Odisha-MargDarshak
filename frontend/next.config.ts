import type { NextConfig } from "next";

const backendInternalHost = process.env.BACKEND_INTERNAL_HOST;
const backendInternalPort = process.env.BACKEND_INTERNAL_PORT || "10000";
const backendDestination = backendInternalHost
  ? `http://${backendInternalHost}:${backendInternalPort}/api/v1/:path*`
  : (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/v1/:path*` : "http://127.0.0.1:8000/api/v1/:path*");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: backendDestination,
      },
    ];
  },
};

export default nextConfig;
