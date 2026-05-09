"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Mail, ArrowLeft, Bell, BellOff, CheckCircle, XCircle,
  SkipForward, Clock, Loader2, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface EmailPreferences {
  email_onboarding_opt_out: boolean;
  drip_state: {
    current_step: number;
    is_active: boolean;
    total_steps: number;
    last_sent_at: string | null;
    next_send_at: string | null;
  } | null;
}

interface EmailHistoryItem {
  id: number;
  type: string;
  subject: string;
  status: string;
  sent_at: string | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  sent: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-green-500 bg-green-500/10 border-green-500/20" },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-500 bg-red-500/10 border-red-500/20" },
  skipped: { icon: <SkipForward className="w-3.5 h-3.5" />, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
};

export default function EmailSettingsPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<EmailPreferences | null>(null);
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!token) return;
    async function fetchData() {
      try {
        const [prefsRes, histRes] = await Promise.all([
          fetch(`${API_BASE}/api/email/preferences`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/email/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (prefsRes.ok) setPrefs(await prefsRes.json());
        if (histRes.ok) {
          const data = await histRes.json();
          setHistory(data.emails || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  async function toggleSubscription() {
    if (!token || !prefs) return;
    setToggling(true);
    const endpoint = prefs.email_onboarding_opt_out ? "resubscribe" : "unsubscribe";
    try {
      const res = await fetch(`${API_BASE}/api/email/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPrefs({
          ...prefs,
          email_onboarding_opt_out: !prefs.email_onboarding_opt_out,
        });
      }
    } catch {
      // silently fail
    } finally {
      setToggling(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-md bg-background/60">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden bg-[#18181b] shadow-lg shadow-violet-500/20 border border-violet-500/30 group-hover:scale-105 transition-transform">
              <Image src="/logo.svg" alt="TeamDynamics Logo" width={24} height={24} className="object-cover scale-[1.15]" priority />
            </div>
            <span className="font-bold text-lg tracking-tight">TeamDynamics</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" /> Email Preferences
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your onboarding email notifications.
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-24 rounded-xl bg-card/40 border border-border/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Subscription Toggle */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-card/40 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        prefs?.email_onboarding_opt_out
                          ? "bg-red-500/10 text-red-400"
                          : "bg-green-500/10 text-green-400"
                      }`}>
                        {prefs?.email_onboarding_opt_out ? (
                          <BellOff className="w-5 h-5" />
                        ) : (
                          <Bell className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Onboarding Emails</div>
                        <div className="text-xs text-muted-foreground">
                          {prefs?.email_onboarding_opt_out
                            ? "You've unsubscribed from onboarding emails"
                            : "Receive tips and guides to get the most out of TeamDynamics"}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={prefs?.email_onboarding_opt_out ? "default" : "outline"}
                      size="sm"
                      className="rounded-lg font-semibold"
                      onClick={toggleSubscription}
                      disabled={toggling}
                    >
                      {toggling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : prefs?.email_onboarding_opt_out ? (
                        "Re-subscribe"
                      ) : (
                        "Unsubscribe"
                      )}
                    </Button>
                  </div>

                  {/* Drip Progress */}
                  {prefs?.drip_state && (
                    <div className="mt-4 pt-4 border-t border-border/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Onboarding progress: {prefs.drip_state.current_step} / {prefs.drip_state.total_steps} emails
                        </span>
                        <Badge variant="outline" className={`text-[10px] ${
                          prefs.drip_state.is_active
                            ? "text-green-400 border-green-500/20 bg-green-500/10"
                            : "text-zinc-400 border-zinc-500/20 bg-zinc-500/10"
                        }`}>
                          {prefs.drip_state.is_active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Email History */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg font-semibold mb-4">Email History</h2>
              {history.length === 0 ? (
                <Card className="bg-card/40 border-border/50">
                  <CardContent className="p-8 text-center">
                    <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No emails sent yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {history.map((email, idx) => {
                    const cfg = STATUS_CONFIG[email.status] || STATUS_CONFIG.sent;
                    return (
                      <motion.div
                        key={email.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Card className="bg-card/40 border-border/50">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${cfg.color}`}>
                                {cfg.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{email.subject}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">{email.type.replace(/_/g, " ")}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {email.sent_at && (
                                <div className="text-[10px] text-muted-foreground hidden sm:block">
                                  {new Date(email.sent_at).toLocaleDateString()}
                                </div>
                              )}
                              <Badge variant="outline" className={`text-[10px] font-semibold ${cfg.color}`}>
                                {email.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
