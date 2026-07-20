"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Crown,
  CreditCard,
  FileText,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button, buttonVariants } from "@/components/ui/button";
import type { User } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  user: User;
  isAdmin: boolean;
  onSignOut: () => void;
}

export function DashboardNav({
  user,
  isAdmin,
  onSignOut,
}: DashboardNavProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const initials = user.name.trim().slice(0, 2).toUpperCase() || "TD";

  return (
    <header className="sticky inset-x-0 top-0 z-50 flex justify-center p-3 pb-0 sm:p-4 sm:pb-0 md:p-6 md:pb-0">
      <div className="flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/80 px-3 py-2.5 shadow-sm backdrop-blur-xl sm:px-4">
        <Link
          href="/"
          aria-label="TeamDynamics home"
          className="group flex min-w-0 items-center gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-violet-500/30 bg-[#18181b] shadow-md shadow-violet-500/15 transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none">
            <Image
              src="/logo.svg"
              alt=""
              width={30}
              height={30}
              className="scale-[1.15] object-cover"
              priority
            />
          </span>
          <span className="hidden truncate text-lg font-bold tracking-tight text-foreground sm:block lg:text-xl">
            TeamDynamics
          </span>
        </Link>

        <nav
          aria-label="Dashboard navigation"
          className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5"
        >
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden min-h-10 rounded-lg px-3 font-semibold text-muted-foreground hover:text-foreground md:inline-flex",
            )}
          >
            <FileText data-icon="inline-start" aria-hidden="true" />
            Docs
          </Link>

          <Link
            href="/pricing"
            aria-label={
              isAdmin
                ? "View pricing, unlimited credits"
                : `View pricing, ${user.credits} credits available`
            }
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "hidden min-h-10 rounded-lg px-3 font-semibold sm:inline-flex",
            )}
          >
            <CreditCard data-icon="inline-start" aria-hidden="true" />
            {isAdmin ? "Unlimited" : `${user.credits} credits`}
          </Link>

          {isAdmin ? (
            <Link
              href="/admin/llm-usage"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden min-h-10 rounded-lg px-3 font-semibold text-muted-foreground hover:text-foreground xl:inline-flex",
              )}
            >
              <Crown data-icon="inline-start" aria-hidden="true" />
              Usage
            </Link>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-11 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle color theme"
          >
            <Sun className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 motion-reduce:transition-none" />
            <Moon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 motion-reduce:transition-none" />
          </Button>

          <div className="hidden min-w-0 items-center gap-2 border-l border-border/60 pl-2 lg:flex">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-extrabold text-primary">
              {initials}
            </span>
            <span className="max-w-32 truncate text-sm font-bold">
              {user.name}
            </span>
          </div>

          <Button
            id="logout-button"
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-lg text-muted-foreground hover:text-destructive"
            aria-label="Sign out"
            onClick={onSignOut}
          >
            <LogOut aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </header>
  );
}

