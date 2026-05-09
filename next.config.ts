import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/history", destination: "/riwayat", permanent: false },
      { source: "/map", destination: "/radar", permanent: false },
    ];
  },
};

export default nextConfig;
