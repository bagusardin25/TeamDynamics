"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, Check, Sparkles, Zap, Building2,
  CreditCard, Loader2, CheckCircle2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  price_display: string;
  description: string;
  popular: boolean;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="w-6 h-6" />,
  growth: <Sparkles className="w-6 h-6" />,
  professional: <Building2 className="w-6 h-6" />,
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "5 simulation credits",
    "Full AI agent simulation",
    "Post-simulation reports",
    "Simulation replay",
  ],
  growth: [
    "15 simulation credits",
    "Full AI agent simulation",
    "Post-simulation reports",
    "Simulation replay",
    "Priority support",
  ],
  professional: [
    "50 simulation credits",
    "Full AI agent simulation",
    "Post-simulation reports",
    "Simulation replay",
    "Priority support",
    "Best per-credit value",
  ],
};

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isLoading: authLoading } = useAuth();
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  // Check for payment result
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } else if (payment === "cancelled") {
      setShowCancelled(true);
      setTimeout(() => setShowCancelled(false), 4000);
    }
  }, [searchParams]);

  // Fetch plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(`${API_BASE}/api/payment/plans`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch {
        // Use fallback plans
        setPlans([
          { id: "starter", name: "Starter", credits: 5, price: 499, price_display: "$4.99", description: "5 simulation credits", popular: false },
          { id: "growth", name: "Growth", credits: 15, price: 1499, price_display: "$14.99", description: "15 simulation credits", popular: true },
          { id: "professional", name: "Professional", credits: 50, price: 4999, price_display: "$49.99", description: "50 simulation credits", popular: false },
        ]);
      }
    }
    fetchPlans();
  }, []);

  const handlePurchase = async (planId: string) => {
    if (!token) {
      router.push("/login");
      return;
    }

    setLoadingPlan(planId);
    try {
      const frontendUrl = window.location.origin;
      const res = await fetch(`${API_BASE}/api/payment/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          package_id: planId,
          success_url: `${frontendUrl}/dashboard?payment=success`,
          cancel_url: `${frontendUrl}/pricing?payment=cancelled`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
          return;
        }
      }

      const err = await res.json().catch(() => ({}));
      alert(err.detail || "Failed to start checkout. Please try again.");
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Success/Cancel banners */}
      {showSuccess && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-50 bg-green-500/95 backdrop-blur-md text-white py-3 px-6 flex items-center justify-center gap-2 shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold">Payment successful! Credits have been added to your account.</span>
        </motion.div>
      )}
      {showCancelled && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-50 bg-orange-500/95 backdrop-blur-md text-white py-3 px-6 flex items-center justify-center gap-2 shadow-lg"
        >
          <X className="w-5 h-5" />
          <span className="font-semibold">Payment was cancelled. No charges were made.</span>
        </motion.div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 backdrop-blur-md bg-background/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center rounded-xl overflow-hidden bg-[#18181b] shadow-lg shadow-violet-500/20 border border-violet-500/30 group-hover:scale-105 transition-transform">
              <Image src="/logo.svg" alt="TeamDynamics Logo" width={24} height={24} className="object-cover scale-[1.15]" priority />
            </div>
            <span className="font-bold text-lg tracking-tight">TeamDynamics</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <CreditCard className="w-3.5 h-3.5" />
            Simulation Credits
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Power Your Simulations
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Each credit runs one full AI-powered crisis simulation. Choose a plan that fits your needs.
          </p>
          {user && (
            <div className="mt-4 text-sm text-muted-foreground">
              Current balance: <span className="font-bold text-foreground">{user.credits} credits</span>
            </div>
          )}
        </motion.div>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const features = PLAN_FEATURES[plan.id] || [];
            const icon = PLAN_ICONS[plan.id];
            const perCredit = (plan.price / plan.credits / 100).toFixed(2);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
              >
                <Card
                  className={`relative overflow-hidden transition-all hover:shadow-xl group ${
                    plan.popular
                      ? "border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground text-[10px] px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Gradient hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <CardContent className="p-8 relative z-10">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      plan.popular
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {icon}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold tracking-tight mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-6">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight">{plan.price_display}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ${perCredit} per simulation
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-8">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm">
                          <Check className={`w-4 h-4 shrink-0 ${plan.popular ? "text-primary" : "text-green-500"}`} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      className={`w-full h-11 font-semibold transition-all ${
                        plan.popular
                          ? "shadow-lg shadow-primary/20 hover:shadow-primary/30"
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                      disabled={loadingPlan !== null}
                      onClick={() => handlePurchase(plan.id)}
                    >
                      {loadingPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>Buy {plan.credits} Credits</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Secure Checkout
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              Powered by Stripe
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Instant Delivery
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Credits never expire. All purchases are one-time — no subscriptions.
          </p>
        </motion.div>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
