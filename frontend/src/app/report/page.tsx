"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Download, ChevronLeft, FileText, AlertTriangle,
  TrendingDown, Users, Loader2, Activity, Share2,
  BarChart3, Target, Shield, Zap, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Minus, Clock, Building2,
  BookOpen, Lightbulb, Flag
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AgentReport {
  id: string;
  name: string;
  role: string;
  starting_morale: number;
  ending_morale: number;
  peak_stress: number;
  has_resigned: boolean;
  resigned_week: number | null;
  status: string;
  status_label: string;
}

interface KeyMetrics {
  total_agents: number;
  active_agents: number;
  resignations: number;
  avg_morale: number;
  avg_stress: number;
  avg_loyalty: number;
  avg_productivity: number;
  productivity_drop: number;
  simulation_weeks: number;
  total_planned_weeks: number;
}

interface Report {
  simulation_id: string;
  company_name: string;
  crisis_name: string;
  total_rounds: number;
  completed_rounds: number;
  executive_summary: string;
  critical_finding: string;
  simulation_overview: string;
  key_metrics: KeyMetrics;
  analysis_insights: string;
  conclusion: string;
  agent_reports: AgentReport[];
  productivity_drop: number;
  recommendations: string[];
  timeline: { round: number; morale: number; stress: number; output: number }[];
}

// Section numbering component
function SectionHeader({ number, icon: Icon, title, subtitle }: { number: string; icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// Metric card component
function MetricCard({ icon: Icon, label, value, suffix, trend, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  color: string;
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="bg-card/60 border border-border/50 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}{suffix || ""}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemo = searchParams.get("demo") === "true";
  const simId = searchParams.get("id") || (isDemo ? "demo" : null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = useCallback(async () => {
    if (!report) return;
    setIsExporting(true);

    try {
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const rightMargin = pageWidth - margin;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;
      let pageNum = 1;
      const km = report.key_metrics;

      // ── Color palette ──
      const C = {
        black: [30, 30, 30] as [number, number, number],
        dark: [50, 50, 50] as [number, number, number],
        body: [55, 55, 55] as [number, number, number],
        muted: [120, 120, 120] as [number, number, number],
        light: [160, 160, 160] as [number, number, number],
        accent: [45, 90, 160] as [number, number, number],
        danger: [180, 50, 50] as [number, number, number],
        rule: [200, 200, 200] as [number, number, number],
        tableBg: [245, 247, 250] as [number, number, number],
        tableBorder: [210, 215, 220] as [number, number, number],
      };

      // ── Page footer ──
      const drawPageFooter = () => {
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...C.light);
        pdf.text("TeamDynamics | AI-Powered Team Simulation", margin, pageHeight - 10);
        pdf.text(`Page ${pageNum}`, rightMargin, pageHeight - 10, { align: "right" });
        pdf.setDrawColor(...C.rule);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageHeight - 14, rightMargin, pageHeight - 14);
      };

      // ── Page break ──
      const checkPage = (needed: number) => {
        if (y + needed > pageHeight - 20) {
          drawPageFooter();
          pdf.addPage();
          pageNum++;
          y = margin;
        }
      };

      // ── Horizontal rule ──
      const drawRule = () => {
        checkPage(10);
        y += 3;
        pdf.setDrawColor(...C.rule);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, rightMargin, y);
        y += 5;
      };

      // ── Write wrapped text ──
      const writeText = (text: string, fontSize: number = 9.5, color: [number, number, number] = C.body, font: string = "normal", indent: number = 0) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", font);
        pdf.setTextColor(...color);
        const lines = pdf.splitTextToSize(text, contentWidth - indent);
        const lineH = fontSize * 0.5;
        for (const line of lines) {
          checkPage(lineH + 1);
          pdf.text(line, margin + indent, y);
          y += lineH;
        }
        y += 2;
      };

      // ── Section header ──
      const writeSection = (num: string, title: string) => {
        checkPage(18);
        y += 6;
        // Section number badge
        pdf.setFillColor(...C.accent);
        pdf.roundedRect(margin, y - 4.5, 7, 6, 1, 1, "F");
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text(num, margin + 3.5, y, { align: "center" });
        // Title
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...C.black);
        pdf.text(title, margin + 10, y);
        y += 8;
      };

      // ── Sub-label ──
      const writeLabel = (text: string) => {
        checkPage(8);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...C.muted);
        pdf.text(text.toUpperCase(), margin, y);
        y += 5;
      };

      // ═══════════════════════════════════════════════════════
      // COVER / TITLE BLOCK
      // ═══════════════════════════════════════════════════════
      y = 35;
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...C.light);
      pdf.text("TEAMDYNAMICS", margin, y);
      pdf.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), rightMargin, y, { align: "right" });
      y += 4;
      pdf.setDrawColor(...C.accent);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y, margin + 40, y);
      y += 12;

      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...C.black);
      pdf.text("Post-Simulation", margin, y);
      y += 9;
      pdf.text("Analysis Report", margin, y);
      y += 14;

      // Metadata block
      const meta = [
        ["Company", report.company_name],
        ["Crisis Scenario", report.crisis_name],
        ["Duration", `${report.completed_rounds} of ${report.total_rounds} weeks completed`],
        ["Team Size", `${km?.total_agents || report.agent_reports.length} agents`],
        ["Resignations", `${km?.resignations ?? 0}`],
        ["Simulation ID", report.simulation_id],
      ];
      const labelColW = 35;
      const valueColW = contentWidth - labelColW;
      pdf.setFontSize(9);
      for (const [label, value] of meta) {
        // Label
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...C.muted);
        pdf.text(`${label}:`, margin, y);
        // Value (wrapped for long text)
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...C.dark);
        const valueLines = pdf.splitTextToSize(value, valueColW);
        for (let vl = 0; vl < valueLines.length; vl++) {
          if (vl > 0) checkPage(5);
          pdf.text(valueLines[vl], margin + labelColW, y);
          if (vl < valueLines.length - 1) y += 4.5;
        }
        y += 5.5;
      }

      drawRule();

      // ═══════════════════════════════════════════════════════
      // 1. EXECUTIVE SUMMARY
      // ═══════════════════════════════════════════════════════
      writeSection("1", "Executive Summary");
      writeText(report.executive_summary);

      if (report.critical_finding) {
        checkPage(14);
        y += 2;
        // Red-accented box
        pdf.setDrawColor(...C.danger);
        pdf.setLineWidth(0.6);
        pdf.line(margin, y, margin, y + 12);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...C.danger);
        pdf.text("CRITICAL FINDING", margin + 3, y + 3);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...C.body);
        const cfLines = pdf.splitTextToSize(report.critical_finding, contentWidth - 5);
        let cfY = y + 7;
        for (const line of cfLines) {
          pdf.text(line, margin + 3, cfY);
          cfY += 4;
        }
        y = cfY + 3;
      }

      drawRule();

      // ═══════════════════════════════════════════════════════
      // 2. SIMULATION OVERVIEW
      // ═══════════════════════════════════════════════════════
      if (report.simulation_overview) {
        writeSection("2", "Simulation Overview");
        writeText(report.simulation_overview);
        drawRule();
      }

      // ═══════════════════════════════════════════════════════
      // 3. KEY METRICS (Table)
      // ═══════════════════════════════════════════════════════
      writeSection("3", "Key Performance Metrics");

      const metricsData = [
        ["Metric", "Value"],
        ["Average Morale", `${km?.avg_morale ?? 50}%`],
        ["Average Stress", `${km?.avg_stress ?? 50}%`],
        ["Average Productivity", `${km?.avg_productivity ?? 50}%`],
        ["Average Loyalty", `${km?.avg_loyalty ?? 50}%`],
        ["Productivity Drop", `-${report.productivity_drop}%`],
        ["Active Agents", `${km?.active_agents ?? report.agent_reports.length} of ${km?.total_agents || report.agent_reports.length}`],
        ["Resignations", `${km?.resignations ?? 0}`],
        ["Simulation Duration", `${report.completed_rounds} / ${report.total_rounds} weeks`],
      ];

      const colWidths = [contentWidth * 0.6, contentWidth * 0.4];
      const rowH = 7;
      const tableX = margin;

      for (let r = 0; r < metricsData.length; r++) {
        checkPage(rowH + 2);
        const row = metricsData[r];
        const isHeader = r === 0;
        const isEven = r % 2 === 0;

        // Row background
        if (isHeader) {
          pdf.setFillColor(...C.accent);
          pdf.rect(tableX, y - 4.5, contentWidth, rowH, "F");
        } else if (isEven) {
          pdf.setFillColor(...C.tableBg);
          pdf.rect(tableX, y - 4.5, contentWidth, rowH, "F");
        }

        // Row text
        pdf.setFontSize(isHeader ? 8.5 : 9);
        pdf.setFont("helvetica", isHeader ? "bold" : "normal");
        pdf.setTextColor(isHeader ? 255 : C.dark[0], isHeader ? 255 : C.dark[1], isHeader ? 255 : C.dark[2]);
        pdf.text(row[0], tableX + 3, y);
        pdf.setFont("helvetica", isHeader ? "bold" : "bold");
        pdf.text(row[1], tableX + colWidths[0] + 3, y);
        y += rowH;
      }

      // Table border
      pdf.setDrawColor(...C.tableBorder);
      pdf.setLineWidth(0.2);
      pdf.rect(tableX, y - (metricsData.length * rowH) - 4.5, contentWidth, metricsData.length * rowH, "S");
      y += 4;

      drawRule();

      // ═══════════════════════════════════════════════════════
      // 4. AGENT PERFORMANCE (Table)
      // ═══════════════════════════════════════════════════════
      writeSection("4", "Agent Performance Summary");

      // Table header
      const agentCols = [35, 30, 24, 24, 22, contentWidth - 135];
      const agentHeaders = ["Name", "Role", "Morale", "Peak Stress", "Status", "Notes"];
      checkPage(10);

      pdf.setFillColor(...C.accent);
      pdf.rect(margin, y - 4.5, contentWidth, 7, "F");
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      let colX = margin + 2;
      for (let c = 0; c < agentHeaders.length; c++) {
        pdf.text(agentHeaders[c], colX, y);
        colX += agentCols[c];
      }
      y += 7;

      // Agent rows
      for (let r = 0; r < report.agent_reports.length; r++) {
        const agent = report.agent_reports[r];
        checkPage(9);

        if (r % 2 === 0) {
          pdf.setFillColor(...C.tableBg);
          pdf.rect(margin, y - 4.5, contentWidth, 7, "F");
        }

        pdf.setFontSize(8.5);
        colX = margin + 2;

        // Name
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...C.dark);
        pdf.text(agent.name, colX, y);
        colX += agentCols[0];

        // Role
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...C.body);
        pdf.text(agent.role, colX, y);
        colX += agentCols[1];

        // Morale
        pdf.setFont("helvetica", "normal");
        const moraleColor: [number, number, number] = agent.ending_morale < 30 ? C.danger : agent.ending_morale < 50 ? [180, 130, 30] : [40, 140, 70];
        pdf.setTextColor(...moraleColor);
        pdf.text(`${agent.starting_morale} > ${agent.ending_morale}%`, colX, y);
        colX += agentCols[2];

        // Peak Stress
        const stressColor: [number, number, number] = agent.peak_stress > 80 ? C.danger : agent.peak_stress > 60 ? [180, 130, 30] : C.body;
        pdf.setTextColor(...stressColor);
        pdf.text(`${agent.peak_stress}%`, colX, y);
        colX += agentCols[3];

        // Status
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...C.dark);
        pdf.text(agent.status, colX, y);
        colX += agentCols[4];

        // Notes
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...C.muted);
        const note = agent.has_resigned ? `Resigned Wk ${agent.resigned_week}` : agent.status_label;
        const truncNote = note.length > 30 ? note.slice(0, 28) + ".." : note;
        pdf.text(truncNote, colX, y);

        y += 7;
      }

      // Table border
      const tableH = (report.agent_reports.length + 1) * 7;
      pdf.setDrawColor(...C.tableBorder);
      pdf.setLineWidth(0.2);
      pdf.rect(margin, y - tableH - 4.5, contentWidth, tableH, "S");
      y += 4;

      drawRule();

      // ═══════════════════════════════════════════════════════
      // 5. ANALYSIS & INSIGHTS
      // ═══════════════════════════════════════════════════════
      if (report.analysis_insights) {
        writeSection("5", "Analysis & Insights");
        writeText(report.analysis_insights);
        drawRule();
      }

      // ═══════════════════════════════════════════════════════
      // 6. RECOMMENDATIONS
      // ═══════════════════════════════════════════════════════
      writeSection("6", "Recommendations");

      for (let i = 0; i < report.recommendations.length; i++) {
        checkPage(12);
        // Number circle
        pdf.setFillColor(...C.accent);
        pdf.circle(margin + 2.5, y - 1.5, 2.5, "F");
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text(`${i + 1}`, margin + 2.5, y - 0.8, { align: "center" });
        // Recommendation text
        writeText(report.recommendations[i], 9.5, C.body, "normal", 9);
        y += 1;
      }

      drawRule();

      // ═══════════════════════════════════════════════════════
      // 7. CONCLUSION
      // ═══════════════════════════════════════════════════════
      if (report.conclusion) {
        writeSection("7", "Conclusion");
        writeText(report.conclusion);
      }

      // ── Final footer on last page ──
      drawPageFooter();

      // ── Add footers to all previous pages ──
      const totalPages = pdf.getNumberOfPages();
      for (let p = 1; p < totalPages; p++) {
        pdf.setPage(p);
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...C.light);
        pdf.text("TeamDynamics | AI-Powered Team Simulation", margin, pageHeight - 10);
        pdf.text(`Page ${p}`, rightMargin, pageHeight - 10, { align: "right" });
        pdf.setDrawColor(...C.rule);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageHeight - 14, rightMargin, pageHeight - 14);
      }

      pdf.save(`TeamDynamics_Report_${report.company_name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [report]);

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Shareable link copied to clipboard!");
    }
  };

  useEffect(() => {
    if (!simId) {
      // Redirect to demo report when no simulation ID is provided
      router.replace("/report?id=demo");
      return;
    }

    fetch(`${API_BASE}/api/simulation/${simId}/report`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load report");
        return res.json();
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load report:", err);
        setError("Failed to load report. Make sure the backend is running.");
        setLoading(false);
      });
  }, [simId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Generating professional report with AI insights...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-muted-foreground">{error || "Report not found."}</p>
          <Link href="/setup">
            <Button variant="outline">Back to Setup</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Failed": return "bg-red-500/10 text-red-500 border-none";
      case "Critical": return "bg-orange-500/10 text-orange-500 border-none";
      case "Stressed": return "bg-yellow-500/10 text-yellow-500 border-none";
      case "Stable": return "bg-blue-500/10 text-blue-500 border-none";
      case "Thriving": return "bg-green-500/10 text-green-500 border-none";
      default: return "bg-blue-500/10 text-blue-500 border-none";
    }
  };

  const getNameColor = (status: string) => {
    switch (status) {
      case "Failed": return "text-red-400";
      case "Critical": return "text-orange-400";
      case "Stressed": return "text-yellow-400";
      case "Stable": return "text-blue-400";
      case "Thriving": return "text-green-400";
      default: return "text-foreground";
    }
  };

  const km = report.key_metrics;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href={`/simulation?id=${simId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Simulation
          </Link>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
              onClick={copyShareLink}
            >
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button
              size="sm"
              className="h-9"
              onClick={exportToPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Export PDF</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10" ref={reportRef}>

        {/* ─── Report Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 py-6"
        >
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">{report.company_name}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {simId === "demo" ? "Demo Report" : "Post-Simulation Analysis Report"}
          </h1>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {report.crisis_name}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {report.completed_rounds}/{report.total_rounds} Weeks Completed</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {km?.total_agents || report.agent_reports.length} Agents</span>
          </div>
          <div className="pt-2">
            <Badge variant="outline" className={`${km?.resignations > 0 ? 'border-red-500/30 text-red-400' : 'border-green-500/30 text-green-400'}`}>
              {km?.resignations > 0 ? `${km.resignations} Resignation(s)` : "No Resignations"}
            </Badge>
          </div>
        </motion.div>

        <Separator className="opacity-30" />

        {/* ─── 1. Executive Summary ─── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionHeader number="01" icon={FileText} title="Executive Summary" subtitle="High-level overview of simulation outcomes" />
          <Card className="bg-card/40 border-border/50 shadow-lg">
            <CardContent className="pt-6 space-y-4">
              <p className="text-foreground/90 leading-relaxed text-[15px]">
                {report.executive_summary}
              </p>
              <div className="bg-destructive/10 border-l-4 border-l-destructive rounded-r-lg p-4 flex gap-3 text-sm">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-destructive">Critical Finding</span>
                  <p className="text-foreground/80 mt-1">{report.critical_finding}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ─── 2. Simulation Overview ─── */}
        {report.simulation_overview && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <SectionHeader number="02" icon={BookOpen} title="Simulation Overview" subtitle="Objective, scenario, and key parameters" />
            <Card className="bg-card/40 border-border/50 shadow-lg">
              <CardContent className="pt-6">
                <p className="text-foreground/90 leading-relaxed text-[15px] mb-4">
                  {report.simulation_overview}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{report.completed_rounds}</p>
                    <p className="text-xs text-muted-foreground">Weeks Simulated</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{km?.total_agents || report.agent_reports.length}</p>
                    <p className="text-xs text-muted-foreground">Team Members</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold">{km?.resignations ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Resignations</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-destructive">-{report.productivity_drop}%</p>
                    <p className="text-xs text-muted-foreground">Productivity Drop</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ─── 3. Key Metrics ─── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionHeader number="03" icon={BarChart3} title="Key Metrics" subtitle="Quantitative performance indicators" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Shield}
              label="Avg. Morale"
              value={km?.avg_morale ?? 50}
              suffix="%"
              trend={km?.avg_morale >= 60 ? "up" : km?.avg_morale < 40 ? "down" : "neutral"}
              color="bg-emerald-500/10 text-emerald-500"
            />
            <MetricCard
              icon={Zap}
              label="Avg. Stress"
              value={km?.avg_stress ?? 50}
              suffix="%"
              trend={km?.avg_stress > 60 ? "down" : km?.avg_stress < 40 ? "up" : "neutral"}
              color="bg-red-500/10 text-red-500"
            />
            <MetricCard
              icon={Activity}
              label="Avg. Productivity"
              value={km?.avg_productivity ?? 50}
              suffix="%"
              trend={km?.avg_productivity >= 60 ? "up" : km?.avg_productivity < 40 ? "down" : "neutral"}
              color="bg-blue-500/10 text-blue-500"
            />
            <MetricCard
              icon={TrendingDown}
              label="Productivity Drop"
              value={report.productivity_drop}
              suffix="%"
              trend="down"
              color="bg-orange-500/10 text-orange-500"
            />
            <MetricCard
              icon={Users}
              label="Active Agents"
              value={km?.active_agents ?? report.agent_reports.length}
              color="bg-violet-500/10 text-violet-500"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Resignations"
              value={km?.resignations ?? 0}
              trend={km?.resignations > 0 ? "down" : "up"}
              color="bg-rose-500/10 text-rose-500"
            />
            <MetricCard
              icon={Shield}
              label="Avg. Loyalty"
              value={km?.avg_loyalty ?? 50}
              suffix="%"
              trend={km?.avg_loyalty >= 60 ? "up" : km?.avg_loyalty < 40 ? "down" : "neutral"}
              color="bg-cyan-500/10 text-cyan-500"
            />
            <MetricCard
              icon={Clock}
              label="Weeks Completed"
              value={report.completed_rounds}
              suffix={`/${report.total_rounds}`}
              color="bg-amber-500/10 text-amber-500"
            />
          </div>
        </motion.section>

        {/* ─── 4. Simulation Timeline ─── */}
        {report.timeline && report.timeline.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <SectionHeader number="04" icon={Activity} title="Simulation Timeline" subtitle={`Chronological metric trends from Week 0 to ${report.completed_rounds}`} />
            <Card className="bg-card/40 border-border/50 shadow-lg">
              <CardContent className="pt-6">
                <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.15} vertical={false} />
                      <XAxis dataKey="round" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `W${value}`} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(10,10,26,0.95)', borderColor: '#333', borderRadius: '12px', padding: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                        labelStyle={{ color: '#888', marginBottom: '8px', fontWeight: 600 }}
                        formatter={(val: any) => [`${val}%`]}
                        labelFormatter={(label) => `Week ${label}`}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="morale" name="Avg Morale" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="stress" name="Avg Stress" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="output" name="Productivity" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ─── 5. Agent Resiliency Profiles ─── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionHeader number="05" icon={Users} title="Agent Resiliency Profiles" subtitle="Individual performance breakdown by team member" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.agent_reports.map((agent) => (
              <Card key={agent.id} className="bg-card/40 border-border/50 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className={`text-base font-semibold ${getNameColor(agent.status)}`}>{agent.name}</CardTitle>
                      <CardDescription className="mt-0.5">{agent.role} • {agent.status_label}</CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(agent.status)}>{agent.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Morale bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Morale</span>
                        <span className="font-medium">
                          <span className="text-muted-foreground text-xs mr-1">{agent.starting_morale}% →</span>
                          <span className={`${agent.ending_morale < 30 ? 'text-red-400' : agent.ending_morale < 50 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {agent.ending_morale}%
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-secondary/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            agent.ending_morale < 30 ? 'bg-red-500' :
                            agent.ending_morale < 50 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${agent.ending_morale}%` }}
                        />
                      </div>
                    </div>
                    {/* Peak Stress bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Peak Stress</span>
                        <span className={`font-medium ${agent.peak_stress > 80 ? 'text-red-400' : agent.peak_stress > 60 ? 'text-orange-400' : 'text-foreground'}`}>
                          {agent.peak_stress}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            agent.peak_stress > 80 ? 'bg-red-500' :
                            agent.peak_stress > 60 ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${agent.peak_stress}%` }}
                        />
                      </div>
                    </div>
                    {/* Resigned indicator */}
                    {agent.has_resigned && (
                      <div className="flex items-center gap-2 text-sm text-red-400 mt-2 bg-red-500/10 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-4 h-4" />
                        Resigned at Week {agent.resigned_week}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* ─── 6. Analysis & Insights ─── */}
        {report.analysis_insights && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <SectionHeader number="06" icon={Lightbulb} title="Analysis & Insights" subtitle="In-depth interpretation of simulation dynamics" />
            <Card className="bg-card/40 border-border/50 shadow-lg">
              <CardContent className="pt-6">
                <p className="text-foreground/90 leading-relaxed text-[15px]">
                  {report.analysis_insights}
                </p>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ─── 7. Recommendations ─── */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <SectionHeader number="07" icon={CheckCircle2} title="Recommendations" subtitle="Actionable improvements and strategic suggestions" />
          <Card className="bg-card/40 border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 items-start bg-background/40 rounded-lg p-3.5 border border-border/30">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed pt-1">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* ─── 8. Conclusion ─── */}
        {report.conclusion && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <SectionHeader number="08" icon={Flag} title="Conclusion" subtitle="Final assessment of team performance and readiness" />
            <Card className="bg-gradient-to-br from-card/60 to-card/30 border-border/50 shadow-lg">
              <CardContent className="pt-6">
                <p className="text-foreground/90 leading-relaxed text-[15px]">
                  {report.conclusion}
                </p>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* ─── Footer ─── */}
        <Separator className="opacity-30" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 text-sm text-muted-foreground">
          <p>Generated by <span className="text-foreground font-medium">TeamDynamics</span> • AI-Powered Team Simulation Platform</p>
          <div className="flex gap-3">
            <Link href="/setup">
              <Button variant="outline" size="sm" className="h-9">
                Run Another Simulation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
