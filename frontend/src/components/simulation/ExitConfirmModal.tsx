"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { Metrics } from "@/app/simulation/types";

interface ExitConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentRound: number;
  totalRounds: number;
}

export function ExitConfirmModal({
  open,
  onClose,
  onConfirm,
  currentRound,
  totalRounds,
}: ExitConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">End Simulation?</h3>
            <p className="text-sm text-muted-foreground">
              The simulation is still running at Week {currentRound}/{totalRounds}.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Ending now will generate a report based on the data collected so far. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Continue Simulation
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            End &amp; View Report
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
