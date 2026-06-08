import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { subDays, format } from "date-fns";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";

const DAYS_BACK = 30;

const CODE_COLORS = {
  M: "#f59e0b", E: "#3b82f6", D: "#a78bfa",
  A: "#34d399", O: "#f87171"
};
const codeColor = (code) => CODE_COLORS[code?.[0]] ?? "#94a3b8";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <p className="text-amber-400">{payload[0]?.value?.toFixed(0)} min downtime</p>
    </div>
  );
};

const CodeTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      <p className="text-foreground">{payload[0]?.value} occurrence{payload[0]?.value !== 1 ? "s" : ""}</p>
    </div>
  );
};

export default function DowntimeDashboard() {
  const [loading, setLoading] = useState(true);
  const [machineData, setMachineData] = useState([]);
  const [codeData, setCodeData] = useState([]);
  const [range, setRange] = useState(30);
  const [totalDowntime, setTotalDowntime] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const cutoff = format(subDays(new Date(), range), "yyyy-MM-dd");
      const logs = await base44.entities.StationLog.list("-log_date", 500);
      const filtered = logs.filter(l => l.log_date >= cutoff);

      // Aggregate downtime per machine
      const machineMap = {};
      // Aggregate breakdown code frequency
      const codeMap = {};
      let totalDT = 0;
      let totalEv = 0;

      filtered.forEach(log => {
        const machine = log.machine_name || log.station?.replace("_", " ") || "Unknown";
        if (!machineMap[machine]) machineMap[machine] = 0;
        machineMap[machine] += log.downtime_min || 0;
        totalDT += log.downtime_min || 0;

        (log.breakdown_records || []).forEach(br => {
          const code = br.breakdown_code || "O2";
          if (!codeMap[code]) codeMap[code] = { count: 0, totalMin: 0 };
          codeMap[code].count += 1;
          codeMap[code].totalMin += br.total_downtime_min || 0;
          totalEv += 1;
        });
      });

      const machines = Object.entries(machineMap)
        .map(([name, min]) => ({ name, min }))
        .filter(d => d.min > 0)
        .sort((a, b) => b.min - a.min)
        .slice(0, 12);

      const codes = Object.entries(codeMap)
        .map(([code, d]) => ({ code, count: d.count, totalMin: d.totalMin }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setMachineData(machines);
      setCodeData(codes);
      setTotalDowntime(totalDT);
      setTotalEvents(totalEv);
      setLoading(false);
    }
    load();
  }, [range]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">Downtime Analysis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalDowntime.toFixed(0)} min total · {totalEvents} breakdown events
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setRange(d)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${range === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {d}d
            </button>
          ))}
          <Link to="/StationLog" className="text-xs text-primary flex items-center gap-1 hover:underline ml-2">
            Logs <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading downtime data…
        </div>
      ) : machineData.length === 0 && codeData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No downtime recorded in the last {range} days
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">

          {/* Downtime per machine */}
          <div className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Total Downtime per Machine (min)
            </h3>
            {machineData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={machineData} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="min" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {machineData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#f59e0b" : i === 1 ? "#fb923c" : "#64748b"} />
                    ))}
                    <LabelList dataKey="min" position="right" formatter={v => `${v}m`} style={{ fill: "#94a3b8", fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top breakdown codes */}
          <div className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Most Frequent Issue Codes
            </h3>
            {codeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No breakdown codes logged</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={codeData} margin={{ left: 4, right: 32, top: 4, bottom: 4 }}>
                    <XAxis dataKey="code" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip content={<CodeTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {codeData.map((d, i) => (
                        <Cell key={i} fill={codeColor(d.code)} />
                      ))}
                      <LabelList dataKey="count" position="top" style={{ fill: "#94a3b8", fontSize: 11 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Code legend */}
                <div className="mt-3 space-y-1">
                  {codeData.slice(0, 5).map(d => (
                    <div key={d.code} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: codeColor(d.code) }} />
                        <span className="font-mono font-medium text-foreground">{d.code}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>{d.count}×</span>
                        <span>{d.totalMin.toFixed(0)} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}