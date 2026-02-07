import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, AlertTriangle, BarChart3, Target, TrendingUp } from "lucide-react";
import StatsCard from "../components/compliance/StatsCard";
import SectionProgress from "../components/compliance/SectionProgress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const SECTIONS = {
  "4": "Context of the Organization",
  "5": "Leadership",
  "6": "Planning",
  "7": "Support",
  "8": "Operation",
  "9": "Performance Evaluation",
  "10": "Improvement",
};

export default function Dashboard() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["compliance-items"],
    queryFn: () => base44.entities.ComplianceItem.list("-created_date", 200),
    initialData: [],
  });

  const total = items.length;
  const compliant = items.filter((i) => i.status === "compliant").length;
  const inProgress = items.filter((i) => i.status === "in_progress").length;
  const nonCompliant = items.filter((i) => i.status === "non_compliant").length;
  const notStarted = items.filter((i) => i.status === "not_started").length;
  const na = items.filter((i) => i.status === "not_applicable").length;

  const pieData = [
    { name: "Compliant", value: compliant, color: "#10b981" },
    { name: "In Progress", value: inProgress, color: "#f59e0b" },
    { name: "Non-Compliant", value: nonCompliant, color: "#ef4444" },
    { name: "Not Started", value: notStarted, color: "#cbd5e1" },
    { name: "N/A", value: na, color: "#94a3b8" },
  ].filter((d) => d.value > 0);

  const sectionStats = Object.entries(SECTIONS).map(([num, title]) => {
    const sectionItems = items.filter((i) => i.section === num);
    return {
      section: num,
      title,
      total: sectionItems.length,
      compliant: sectionItems.filter((i) => i.status === "compliant").length,
      inProgress: sectionItems.filter((i) => i.status === "in_progress").length,
      nonCompliant: sectionItems.filter((i) => i.status === "non_compliant").length,
    };
  });

  const overallPercent = total > 0 ? Math.round((compliant / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 mx-auto flex items-center justify-center mb-6">
          <Target className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">No Requirements Yet</h2>
        <p className="text-slate-500 mb-6">Head over to the Checklist page to start tracking your ISO 9001:2015 compliance.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Dashboard</h1>
        <p className="text-slate-500 mt-1">ISO 9001:2015 Quality Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Overall Progress" value={compliant} total={total} icon={BarChart3} color="bg-emerald-500" bgColor="bg-emerald-50" />
        <StatsCard title="In Progress" value={inProgress} total={total} icon={Clock} color="bg-amber-500" bgColor="bg-amber-50" />
        <StatsCard title="Non-Compliant" value={nonCompliant} total={total} icon={AlertTriangle} color="bg-red-500" bgColor="bg-red-50" />
        <StatsCard title="Compliance Rate" value={`${overallPercent}%`} total={0} icon={TrendingUp} color="bg-blue-500" bgColor="bg-blue-50" />
      </div>

      {/* Chart + Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Status Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [`${val} items`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-slate-500">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Progress */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Sections Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sectionStats.map((s) => (
              <SectionProgress key={s.section} {...s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}