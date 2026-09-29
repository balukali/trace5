/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle in .next/standalone, which is what the
  // Docker runtime stage copies. Without this the container image would need the
  // full node_modules tree.
  output: "standalone",
  // TRACE//5 has no telemetry and no external services, so keep the build
  // deterministic and free of network fetches.
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
