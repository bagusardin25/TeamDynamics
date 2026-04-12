filepath = "frontend/src/app/report/page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update interface
interface_old = """  productivity_drop: number;
  recommendations: string[];
}"""
interface_new = """  productivity_drop: number;
  recommendations: string[];
  timeline: { round: number; morale: number; stress: number; output: number }[];
}"""

# 2. Add Recharts imports
imports_old = """import { Download, ChevronLeft, Calendar, FileText, AlertTriangle, TrendingDown, Users, Loader2 } from "lucide-react";"""
imports_new = """import { Download, ChevronLeft, Calendar, FileText, AlertTriangle, TrendingDown, Users, Loader2, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";"""

# 3. Add Line Chart JSX
chart_jsx = """
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
"""

target_insert = """        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Executive Summary */}"""

if interface_old in content:
    content = content.replace(interface_old, interface_new)
else:
    print("Could not update interface")

if imports_old in content:
    content = content.replace(imports_old, imports_new)
else:
    print("Could not update imports")

if target_insert in content:
    idx = content.find(target_insert)
    # Insert before the columns
    content = content[:idx] + chart_jsx + "\n" + content[idx:]
else:
    print("Could not insert JSX chart")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Success frontend")
