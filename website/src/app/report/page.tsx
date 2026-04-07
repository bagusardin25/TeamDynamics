"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download, ChevronLeft, Calendar, FileText, AlertTriangle, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/simulation" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Simulation
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Post-Simulation Report</h1>
            <p className="text-muted-foreground">Pied Piper v2.0 Crisis • Completed round 12/12</p>
          </div>
          <Button variant="outline" size="sm" className="h-10">
            <Download className="w-4 h-4 mr-2" /> Export to PDF
          </Button>
        </div>

        <Separator />

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
                  The simulation ran for 12 virtual weeks following the injection of the <strong>"Mandatory Weekend Coding"</strong> crisis. Overall team morale dropped by <strong>45%</strong> within the first 3 weeks. 
                </p>
                <div className="bg-destructive/10 border-l-4 border-l-destructive rounded-r-lg p-4 flex gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Critical Finding:</span>
                    <p className="text-muted-foreground mt-1">The Junior Dev (Sam) reached a critical burnout state in Week 4, causing productivity to permanently flatline. The Tech Lead (Alex) submitted a virtual resignation in Week 9 due to extreme stress metrics.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Journeys */}
            <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Agent Resiliency Profiles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <Card className="bg-background/40 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base text-red-500">Alex (Tech Lead)</CardTitle>
                      <CardDescription>Resigned • Week 9</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-none">Failed</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Starting Morale</span>
                      <span>80%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ending Morale</span>
                      <span className="text-red-500 font-bold">12%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peak Stress</span>
                      <span>95%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/40 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base text-blue-500">Jordan (PM)</CardTitle>
                      <CardDescription>Survived</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-none">Stable</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Starting Morale</span>
                      <span>75%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ending Morale</span>
                      <span className="text-yellow-500 font-bold">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peak Stress</span>
                      <span>60%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                  <div className="absolute inset-0 rounded-full border-8 border-destructive" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 60%, 0 60%)' }} />
                  <span className="text-3xl font-bold flex items-center gap-1">
                    <TrendingDown className="w-6 h-6 text-destructive" /> 42%
                  </span>
                </div>
                <p className="text-sm text-center text-muted-foreground mt-4">
                  Overall output dropped significantly compared to baseline.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/50 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Provide compensation (bonus/time-off) immediately after deadline pressure.
                  </li>
                  <li className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    Protect Tech Leads from middle-management sandwiching.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
