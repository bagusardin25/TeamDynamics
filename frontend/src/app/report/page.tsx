"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Download, ChevronLeft, Calendar, FileText, AlertTriangle, 
  TrendingDown, Users, Loader2, Activity, Share2, TrendingUp, AlertCircle, RefreshCw 
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

interface Report {
  simulation_id: string;
  company_name: string;
  crisis_name: string;
  total_rounds: number;
  completed_rounds: number;
  executive_summary: string;
  critical_finding: string;
  agent_reports: AgentReport[];
  productivity_drop: number;
  recommendations: string[];
  timeline: { round: number; morale: number; stress: number; output: number }[];
}

function ReportContent() {
  const searchParams = useSearchParams();
  const simId = searchParams.get("id");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = useCallback(async () => {
    if (!reportRef.current || !report) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#1a1a2e",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // top margin

      // First page
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);

      // Additional pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }

      pdf.save(`TeamDynamics_Report_${report.company_name.replace(/\s+/g, "_")}.pdf`);
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
      setError("No simulation ID provided.");
      setLoading(false);
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
  }, [simId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Generating report with AI insights...</p>
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
      case "Stable": return "bg-blue-500/10 text-blue-500 border-none";
      case "Thriving": return "bg-green-500/10 text-green-500 border-none";
      default: return "bg-blue-500/10 text-blue-500 border-none";
    }
  };

  const getNameColor = (status: string) => {
    switch (status) {
      case "Failed": return "text-red-500";
      case "Critical": return "text-orange-500";
      case "Stable": return "text-blue-500";
      case "Thriving": return "text-green-500";
      default: return "text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8" ref={reportRef}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href={`/simulation?id=${simId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Simulation
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Post-Simulation Report</h1>
            <p className="text-muted-foreground">{report.company_name} • {report.crisis_name} • Completed round {report.completed_rounds}/{report.total_rounds}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
              onClick={copyShareLink}
            >
              <Share2 className="w-4 h-4 mr-2" /> Share Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={exportToPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Export to PDF</>
              )}
            </Button>
          </div>
        </div>

        <Separator />


        {/* Timeline Chart */}
        {report.timeline && report.timeline.length > 0 && (
          <Card className="bg-card/40 border-border/50 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-primary" />
                <CardTitle>Simulation Timeline</CardTitle>
              </div>
              <CardDescription>Chronological overview of company metrics from Week 0 to {report.completed_rounds}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.2} vertical={false} />
                    <XAxis dataKey="round" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `W${value}`} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                      labelStyle={{ color: '#888', marginBottom: '4px' }}
                      formatter={(val: number) => [`${val}%`]}
                      labelFormatter={(label) => `Week ${label}`}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="morale" name="Avg Morale" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="stress" name="Avg Stress" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="output" name="Productivity" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Executive Summary */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-card/40 border-border/50 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle>Executive Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {report.executive_summary}
                </p>
                <div className="bg-destructive/10 border-l-4 border-l-destructive rounded-r-lg p-4 flex gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Critical Finding:</span>
                    <p className="text-muted-foreground mt-1">{report.critical_finding}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Journeys */}
            <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Agent Resiliency Profiles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.agent_reports.map((agent) => (
                <Card key={agent.id} className="bg-background/40 border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className={`text-base ${getNameColor(agent.status)}`}>{agent.name} ({agent.role})</CardTitle>
                        <CardDescription>{agent.status_label}</CardDescription>
                      </div>
                      <Badge variant="outline" className={getStatusColor(agent.status)}>{agent.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting Morale</span>
                        <span>{agent.starting_morale}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ending Morale</span>
                        <span className={`font-bold ${agent.ending_morale < 30 ? 'text-red-500' : agent.ending_morale < 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                          {agent.ending_morale}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peak Stress</span>
                        <span>{agent.peak_stress}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column Metrics */}
          <div className="space-y-6">
            <Card className="bg-card/40 border-border/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Productivity Impact</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="w-32 h-32 rounded-full border-8 border-secondary flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-8 border-destructive" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${Math.min(100, report.productivity_drop + 20)}%, 0 ${Math.min(100, report.productivity_drop + 20)}%)` }} />
                  <span className="text-3xl font-bold flex items-center gap-1">
                    <TrendingDown className="w-6 h-6 text-destructive" /> {report.productivity_drop}%
                  </span>
                </div>
                <p className="text-sm text-center text-muted-foreground mt-4">
                  Overall output dropped compared to baseline.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Link href="/setup">
              <Button className="w-full" variant="outline">
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
