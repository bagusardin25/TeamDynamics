// Next.js instrumentation hook — loads Sentry config at server/edge startup.
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamically import to avoid bundling server config in client
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Re-export the Sentry captureRequestError handler as onRequestError —
// the Next.js instrumentation hook for automatic error capture
// in server components and API routes.
import { captureRequestError } from "@sentry/nextjs";
export const onRequestError = captureRequestError;
