// Sentry server-side configuration for Next.js server components, API routes,
// and server-side rendering. Loaded automatically by @sentry/nextjs.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Performance Monitoring — capture 20% of server transactions
  tracesSampleRate: 0.2,

  // Only enable in production to avoid noise during development
  enabled: process.env.NODE_ENV === "production",
});
