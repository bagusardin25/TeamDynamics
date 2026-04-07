"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Play, Briefcase, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

// Mock preset agents
const PRESET_AGENTS = [
  { id: "1", name: "Alex", role: "Tech Lead", type: "Strict & Burned Out", color: "bg-red-500/20 text-red-500" },
  { id: "2", name: "Sam", role: "Junior Dev", type: "Ambitious & Naive", color: "bg-green-500/20 text-green-500" },
  { id: "3", name: "Jordan", role: "Product Manager", type: "Empathetic", color: "bg-blue-500/20 text-blue-500" },
  { id: "4", name: "Casey", role: "Senior Dev", type: "Silent & Efficient", color: "bg-purple-500/20 text-purple-500" }
];

export default function SetupPage() {
  const [selectedAgents, setSelectedAgents] = useState(PRESET_AGENTS.slice(0, 3));
  const [crisis, setCrisis] = useState("");
  
  const removeAgent = (id: string) => setSelectedAgents(selectedAgents.filter(a => a.id !== id));
  
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configure Simulation</h1>
            <p className="text-muted-foreground">Setup your team, inject the crisis, and watch the chaos.</p>
          </div>
            <Link href="/simulation">
            </Link>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Main Form Column */}
          <div className="md:col-span-8 space-y-8">
            
            {/* Step 1: Company Profile */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <CardTitle>Company Profile</CardTitle>
                </div>
                <CardDescription>Define the tone and context of your startup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input placeholder="e.g. Acme Corp" defaultValue="Pied Piper" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Culture / Context</label>
                  <Textarea 
                    placeholder="Describe the current state of the company..." 
                    defaultValue="A fast-paced tech startup running low on funding. Everyone is stressed but highly motivated to ship v2.0."
                    className="min-h-[100px] bg-background/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 2: The Team */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-primary" />
                    <CardTitle>Team Roster</CardTitle>
                  </div>
                  <CardDescription>Select the employees who will participate in the simulation.</CardDescription>
                </div>
                <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Custom Agent</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedAgents.map(agent => (
                    <motion.div 
                      key={agent.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border border-border rounded-xl p-4 bg-background/50 relative group"
                    >
                      <button 
                        onClick={() => removeAgent(agent.id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">{agent.role}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`${agent.color} border-none font-medium text-xs`}>
                        {agent.type}
                      </Badge>
                    </motion.div>
                  ))}
                  
                  {/* Add Preset Button */}
                  <div className="border border-dashed border-border rounded-xl p-4 bg-transparent flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors min-h-[100px]">
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">Add from Presets</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Crisis Injection */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl border-t-4 border-t-orange-500">
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <CardTitle>Crisis Injection</CardTitle>
                </div>
                <CardDescription>What event triggers this simulation?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Scenario</label>
                  <Select value={crisis} onValueChange={(val) => setCrisis(val || "")}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Choose a crisis..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rnd1">Mandatory Weekend Coding for v2.0</SelectItem>
                      <SelectItem value="rnd2">Budget Cut: 30% Layoffs Required</SelectItem>
                      <SelectItem value="rnd3">CEO Resigns Unexpectedly</SelectItem>
                      <SelectItem value="rnd4">Critical Database Deleted on Friday</SelectItem>
                      <SelectItem value="custom">Custom Crisis...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {crisis === "custom" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 pt-2"
                  >
                    <label className="text-sm font-medium">Describe Custom Event</label>
                    <Textarea placeholder="e.g. We just lost our biggest client and everyone's panic-blaming each other..." className="min-h-[100px] bg-background/50" />
                  </motion.div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-4 space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Simulation Params</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Duration (Weeks)</label>
                    <span className="text-sm font-bold text-primary">12</span>
                  </div>
                  <Slider defaultValue={[12]} max={24} step={1} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Pacing Speed</label>
                    <span className="text-sm font-bold text-primary">Normal</span>
                  </div>
                  <Slider defaultValue={[50]} max={100} step={50} />
                  <p className="text-xs text-muted-foreground">Determines how fast agents reply in the simulated chat UI.</p>
                </div>

                <Separator />
                
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                  <h4 className="font-semibold text-sm text-primary mb-2">Cost Estimation</h4>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Est. API Calls:</span>
                    <span className="font-mono">~36</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <span className="font-mono text-green-500 font-medium">~$0.02</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6 px-6">
                <Link href="/simulation" className="w-full">
                  <Button className="w-full h-12 text-md font-medium">
                    <Play className="w-4 h-4 mr-2" /> Start Simulation
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
