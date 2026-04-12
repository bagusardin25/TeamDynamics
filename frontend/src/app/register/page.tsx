"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] opacity-50" />
      <div className="absolute top-[-15%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-chart-2/20 opacity-30" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[35%] h-[35%] rounded-full blur-[120px] bg-primary/20 opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl tracking-tight">TeamDynamics</span>
        </div>

        {/* Card */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2">
              Create your account <Sparkles className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground">Start simulating team dynamics in minutes</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-background/60 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full h-11 pl-10 pr-4 bg-background/60 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full h-11 pl-10 pr-11 bg-background/60 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Free tier info */}
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-semibold">Free plan:</span> 10 simulation credits included.
                Each simulation uses 1 credit.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 font-semibold rounded-lg shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
