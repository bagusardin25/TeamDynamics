"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { SimulationHistory } from "@/components/dashboard/simulation-history";
import { useAuth } from "@/contexts/auth-context";
import {
  getDashboardSummary,
  getPrimarySimulation,
  type SimulationRecord,
} from "@/lib/dashboard-model";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const GUIDE_STORAGE_KEY = "td_dashboard_guide_dismissed";

function subscribeToGuideVisibility(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === GUIDE_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function getGuideVisibilitySnapshot() {
  return localStorage.getItem(GUIDE_STORAGE_KEY) !== "true";
}

function getGuideVisibilityServerSnapshot() {
  return true;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, isAdmin, logout } = useAuth();
  const [simulations, setSimulations] = useState<SimulationRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [guideDismissedThisSession, setGuideDismissedThisSession] =
    useState(false);
  const isPersistedGuideVisible = useSyncExternalStore(
    subscribeToGuideVisibility,
    getGuideVisibilitySnapshot,
    getGuideVisibilityServerSnapshot,
  );
  const showGuide =
    isPersistedGuideVisible && !guideDismissedThisSession;

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    async function fetchSimulations() {
      setIsHistoryLoading(true);
      setHistoryError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/auth/me/simulations`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("The server returned an invalid history response");
        }

        setSimulations(data as SimulationRecord[]);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setHistoryError(
          error instanceof Error
            ? error.message
            : "Please refresh the page and try again.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsHistoryLoading(false);
        }
      }
    }

    void fetchSimulations();

    return () => controller.abort();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm font-semibold text-muted-foreground" role="status">
          Loading workspace
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const summary = getDashboardSummary(simulations);
  const primarySimulation = getPrimarySimulation(simulations);
  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] opacity-60"
      />

      <DashboardNav
        user={user}
        isAdmin={isAdmin}
        onSignOut={() => {
          logout();
          window.location.assign("/login");
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-10">
        <DashboardOverview
          firstName={firstName}
          credits={user.credits}
          isAdmin={isAdmin}
          simulations={simulations}
          summary={summary}
          primarySimulation={primarySimulation}
          showGuide={showGuide}
          onDismissGuide={() => {
            setGuideDismissedThisSession(true);
            localStorage.setItem(GUIDE_STORAGE_KEY, "true");
          }}
        />

        <div className="mt-14 border-t border-border/60 pt-10 md:mt-16 md:pt-12">
          <SimulationHistory
            simulations={simulations}
            isLoading={isHistoryLoading}
            errorMessage={historyError}
          />
        </div>
      </main>
    </div>
  );
}
