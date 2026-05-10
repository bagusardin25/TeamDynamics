// Sentry edge runtime configuration for Next.js middleware.
// Loaded automatically by @sentry/nextjs for edge routes.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: 0.2,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
});
