import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships wasm + data files it loads from disk; bundling breaks that.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
