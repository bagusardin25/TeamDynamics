"use client";

import Image from "next/image";
import Link from "next/link";
import { GitFork, LogIn, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center p-3 sm:p-4 md:p-6">
      <div className="flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/75 px-3 py-2.5 shadow-sm backdrop-blur-xl sm:px-4">
        <Link
          href="/"
          aria-label="TeamDynamics home"
          className="group flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-500/30 bg-[#18181b] shadow-md shadow-violet-500/15 transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none">
            <Image
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              className="scale-[1.15] object-cover"
              priority
            />
          </span>
          <span className="hidden min-w-0 items-center gap-2 sm:flex">
            <span className="truncate text-lg font-bold tracking-tight text-foreground lg:text-xl">
              TeamDynamics
            </span>
            <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary lg:inline-flex">
              Beta
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="flex shrink-0 items-center gap-1.5 sm:gap-2"
        >
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden rounded-lg px-3 font-medium text-muted-foreground hover:text-foreground md:inline-flex",
            )}
          >
            Docs
          </Link>

          <Link
            href="https://github.com/bagusardin25/TeamDynamics"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "hidden size-10 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground sm:inline-flex",
            )}
          >
            <GitFork className="size-4" aria-hidden="true" />
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-10 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle color theme"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 motion-reduce:transition-none" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 motion-reduce:transition-none" />
          </Button>

          {!user && (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden rounded-lg px-3 font-medium text-muted-foreground hover:text-foreground md:inline-flex",
              )}
            >
              <LogIn className="size-4" aria-hidden="true" />
              Sign In
            </Link>
          )}

          <Link
            href={user ? "/dashboard" : "/demo"}
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-10 rounded-lg px-3.5 font-semibold shadow-sm sm:px-4",
            )}
          >
            {user ? "Dashboard" : "Quick Demo"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
