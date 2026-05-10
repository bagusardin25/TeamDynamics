// Sentry client-side configuration for browser/React components.
// This file is automatically loaded by @sentry/nextjs when the app runs in the browser.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  // Performance Monitoring — capture 20% of transactions
  tracesSampleRate: 0.2,

  // Session Replay — capture 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media in replays for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Only enable in production to avoid noise during development
  enabled: process.env.NODE_ENV === "production",

  // Don't send PII (emails, IPs) to Sentry
  sendDefaultPii: false,
});
