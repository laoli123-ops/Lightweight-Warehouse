import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add your Mac's LAN IP here so mobile browsers can access the dev server.
  // Find it with: ipconfig getifaddr en0
  allowedDevOrigins: ["192.168.0.107", "localhost"],
};

export default nextConfig;
