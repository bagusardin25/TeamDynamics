import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map upload logs during build
  silent: true,

  // Upload source maps for better stack traces in Sentry
  // Requires SENTRY_AUTH_TOKEN env var (optional for local dev)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Automatically tree-shake Sentry debug logger statements
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
