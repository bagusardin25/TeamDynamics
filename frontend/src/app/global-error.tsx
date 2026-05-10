"use client";

// App Router global error boundary — catches unhandled errors from all routes.
// Automatically reports errors to Sentry and shows a styled fallback UI.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
          fontFamily:
            "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#e0e0e0",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "3rem 2rem",
            maxWidth: "480px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Error icon */}
          <div
            style={{
              fontSize: "3.5rem",
              marginBottom: "1rem",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
              color: "#ffffff",
            }}
          >
            Something went wrong
          </h2>

          <p
            style={{
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "#a0a0b8",
              marginBottom: "2rem",
            }}
          >
            An unexpected error occurred. Our team has been notified and is
            looking into it. Please try again.
          </p>

          {/* Error digest for support */}
          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b6b80",
                marginBottom: "1.5rem",
                fontFamily: "monospace",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              padding: "0.75rem 2rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#ffffff",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 6px 20px rgba(99, 102, 241, 0.45)";
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.transform = "translateY(0)";
              (e.target as HTMLButtonElement).style.boxShadow =
                "0 4px 14px rgba(99, 102, 241, 0.3)";
            }}
          >
            Try Again
          </button>
        </div>

        {/* Pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}</style>
      </body>
    </html>
  );
}
