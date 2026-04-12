"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Home, ArrowLeft, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-size-[40px_40px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] opacity-50" />
      <div className="absolute top-[-10%] left-[30%] w-[40%] h-[40%] rounded-full blur-[120px] bg-destructive/10 opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10 max-w-lg"
      >
        {/* Ghost icon with float animation */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-xl shadow-primary/5">
            <Ghost className="w-12 h-12 text-primary/60" />
          </div>
        </motion.div>

        {/* 404 Number */}
        <h1 className="text-8xl font-black tracking-tighter text-foreground/10 mb-2 select-none">
          404
        </h1>

        <h2 className="text-2xl font-bold tracking-tight mb-3">
          This page doesn&apos;t exist
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Looks like this simulation took a wrong turn. The page you&apos;re looking for
          has either been moved, deleted, or never existed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="rounded-lg font-semibold px-6 shadow-sm">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-lg font-semibold px-6 border-border/60">
              <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </Link>
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mt-12 opacity-40">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-xs font-semibold tracking-tight">TeamDynamics</span>
        </div>
      </motion.div>
    </div>
  );
}
