import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let localAllowedDevOrigins: string[] = [];
try {
  const local = require("./next.config.local")?.default as
    | { allowedDevOrigins?: string[] }
    | undefined;
  if (Array.isArray(local?.allowedDevOrigins)) {
    localAllowedDevOrigins = local.allowedDevOrigins;
  }
} catch {
  // Local config file is optional.
}

const nextConfig: NextConfig = {
  allowedDevOrigins: Array.from(new Set([...localAllowedDevOrigins, "localhost"])),
};

export default nextConfig;
