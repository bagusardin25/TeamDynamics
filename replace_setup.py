import os

filepath = "frontend/src/app/setup/page.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State addition
content = content.replace(
    '  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);',
    '  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);\n  const [currentStep, setCurrentStep] = useState(1);'
)

# 2. Main Return body replacement
start_marker = "  return ("
end_marker = "      {/* Create / Edit Agent Modal */}"

parts = content.split("  return (\n    <div className=\"min-h-screen")

if len(parts) >= 2:
    before = parts[0]
    
    body_parts = parts[1].split(end_marker)
    if len(body_parts) >= 2:
        after = "      {/* Create / Edit Agent Modal */}" + body_parts[1]
        
        new_body = """  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header & Stepper */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Configure Simulation</h1>
            <p className="text-muted-foreground">Setup your team, inject the crisis, and watch the chaos.</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep === step ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110' : currentStep > step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{currentStep > step ? '✓' : step}</div>
                {step < 3 && <div className={`w-6 sm:w-12 h-1 rounded-full transition-colors duration-300 ${currentStep > step ? 'bg-primary/50' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 max-w-3xl mx-auto">
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
                      <Input placeholder="e.g. Acme Corp" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Company Culture / Context</label>
                      <Textarea placeholder="Describe the current state of the company..." value={companyCulture} onChange={(e) => setCompanyCulture(e.target.value)} className="min-h-[100px] bg-background/50" />
                    </div>
                  </CardContent>
                </Card>

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
                        <SelectTrigger className="w-full bg-background/50">
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
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pt-2">
                        <label className="text-sm font-medium">Describe Custom Event</label>
                        <Textarea placeholder="e.g. We just lost our biggest client and everyone's panic-blaming each other..." value={customCrisis} onChange={(e) => setCustomCrisis(e.target.value)} className="min-h-[100px] bg-background/50" />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setCurrentStep(2)} size="lg" className="w-full sm:w-auto h-12 px-8">Next: Assemble Team &rarr;</Button>
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Pool */}
                  <Card className="border-border/50 bg-card/20 backdrop-blur-sm border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">Agent Pool</CardTitle>
                      <CardDescription>Click to add presets to your roster.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-[400px] overflow-y-auto p-4 content-start">
                      {availablePresets.map((p) => (
                        <motion.button
                          key={p.id}
                          layoutId={`agent-${p.id}`}
                          onClick={() => { addPresetAgent(p); }}
                          className="flex flex-col text-left border border-border/40 rounded-xl p-3 bg-card hover:bg-primary/5 hover:border-primary/50 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center gap-2 mb-2 w-full">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm text-white ${p.color.replace('text-', 'bg-').replace('/20', '/80')}`}>{p.name.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{p.name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{p.role}</div>
                            </div>
                            <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <Badge variant="secondary" className="text-[9px] w-fit truncate">
                            {p.type}
                          </Badge>
                        </motion.button>
                      ))}
                      <motion.button onClick={openCreateModal} layout className="flex flex-col items-center justify-center text-center border-2 border-dashed border-primary/30 rounded-xl p-4 bg-primary/5 hover:bg-primary/10 transition-colors h-[100px] gap-2 text-primary">
                        <UserPlus className="w-5 h-5" />
                        <span className="text-xs font-semibold">Custom Agent</span>
                      </motion.button>
                    </CardContent>
                  </Card>

                  {/* Right: Roster */}
                  <Card className="border-primary/20 bg-card/50 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2 border-b border-border/50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-5 h-5 text-primary" />
                          <CardTitle>Active Roster</CardTitle>
                        </div>
                        <CardDescription>Your team for the simulation.</CardDescription>
                      </div>
                      <Badge variant={rosterFull ? "destructive" : "secondary"} className="shrink-0 mt-1 shadow-sm">
                        {selectedAgents.length}/8
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 h-[400px] overflow-y-auto">
                      <AnimatePresence>
                        {selectedAgents.length === 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Users className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">Roster is empty.</p>
                            <p className="text-xs">Add up to 8 agents.</p>
                          </motion.div>
                        )}
                        {selectedAgents.map((agent) => (
                          <motion.div
                            key={agent.id}
                            layoutId={`agent-${agent.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            className="border border-border/50 rounded-xl p-3 bg-background/80 backdrop-blur-md relative group cursor-pointer transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(var(--primary),0.15)]"
                            onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                          >
                            <button onClick={(e) => { e.stopPropagation(); removeAgent(agent.id); }} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground z-10"><X className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(agent); }} className="absolute top-2 right-10 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground z-10"><Pencil className="w-3 h-3" /></button>

                            <div className="flex items-center gap-3 mb-2">
                              {/* Soft GLow based on agent color type */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md text-white ${agent.color.replace('text-', 'bg-').replace('/20', '/80')}`}>
                                {agent.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-sm group-hover:text-primary transition-colors">{agent.name}</div>
                                <div className="text-xs text-muted-foreground">{agent.role}</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                               <Badge variant="secondary" className={`${agent.color.includes('border') ? agent.color : agent.color + " border-none"} font-medium text-[10px]`}>{agent.type}</Badge>
                               {agent.model && <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20"><Cpu className="w-2.5 h-2.5 mr-1" />Custom AI</Badge>}
                               {agent.expertise && <Badge variant="outline" className="text-[9px]">🎯 Expert</Badge>}
                            </div>

                            {/* Radar Chart (expanded) */}
                            <AnimatePresence>
                              {expandedAgent === agent.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="mt-3 pt-3 border-t border-border/50 flex flex-col items-center">
                                    <RadarChart size={160} data={[ { label: "EMP", value: agent.personality.empathy }, { label: "AMB", value: agent.personality.ambition }, { label: "RES", value: agent.personality.stressTolerance }, { label: "AGR", value: agent.personality.agreeableness }, { label: "ASR", value: agent.personality.assertiveness } ]} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)} className="h-12 px-6">&larr; Back</Button>
                  <Button onClick={() => setCurrentStep(3)} size="lg" disabled={selectedAgents.length === 0} className="h-12 px-8">Next: Simulation Config &rarr;</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 max-w-2xl mx-auto">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Simulation Parameters</CardTitle>
                    <CardDescription>Adjust duration and pacing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="font-medium">Duration (Weeks)</label>
                        <span className="text-xl font-bold text-primary">{durationWeeks}</span>
                      </div>
                      <Slider value={[durationWeeks]} onValueChange={(val) => setDurationWeeks(val[0])} max={24} min={1} step={1} className="py-4" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="font-medium">Pacing Speed</label>
                        <span className="text-xl font-bold text-primary">{getPacingLabel()}</span>
                      </div>
                      <Slider value={[pacingSpeed]} onValueChange={(val) => setPacingSpeed(val[0])} max={100} step={50} className="py-4" />
                      <p className="text-xs text-muted-foreground">Determines how fast agents reply in the simulated chat UI.</p>
                    </div>

                    <Separator />

                    <motion.div key={estimateCost()} initial={{ opacity: 0.5, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl bg-primary/10 border border-primary/20 p-5 shadow-inner transition-colors duration-500">
                      <h4 className="font-semibold text-primary mb-3">Invoice Estimation</h4>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-muted-foreground">Est. API Calls:</span>
                        <span className="font-mono font-medium">~{estimateApiCalls()}</span>
                      </div>
                      <div className="flex justify-between items-center bg-card/50 px-3 py-2 rounded-lg mt-2 font-medium">
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span className="font-mono text-green-500 font-bold text-lg">~${estimateCost()}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 text-center opacity-70">Charged to your account credits.</p>
                    </motion.div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)} className="h-12 px-6">&larr; Back</Button>
                  <Button className="h-12 px-10 text-md font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-105" onClick={handleStartSimulation} disabled={isLoading || selectedAgents.length === 0}>
                    {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Igniting...</> : <><Play className="w-5 h-5 mr-2" /> Launch Simulation</>}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

"""
        with open(filepath, "w", encoding="utf-8") as out:
            out.write(before + new_body + after)
        print("Success")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
