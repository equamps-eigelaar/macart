import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, subDays } from "date-fns";
import { AlertTriangle } from "lucide-react";

const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand"];

function OEEBadge({ value }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const color = value >= 65 ? "text-green-400" : value >= 45 ? "text-amber-400" : "text-red-400";
  return <span className={`font-mono font-bold ${color}`}>{value.toFixed(1)}%</span>;
}

export default function OEEMonitor() {
  const [logs, setLogs] = useState([]);
  const [scrapEntries, setScrapEntries] = useState([]);
  const [stationFilter, setStationFilter] = useState("all");
  const [days, setDays] = useState(7);

  useEffect(() => {
    async function load() {
      const from = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
      const [all, scraps] = await Promise.all([
        base44.entities.StationLog.list("-log_date", 500),
        base44.entities.ScrapEntry.list("-entry_date", 500),
      ]);
      setLogs(all.filter(l => l.log_date >= from));
      setScrapEntries(scraps.filter(s => s.entry_date >= from));
    }
    load();
  }, [days]);

  const filtered = stationFilter === "all" ? logs : logs.filter(l => l.station === stationFilter);

  // Group by date for chart
  const byDate = {};
  filtered.forEach(l => {
    if (!byDate[l.log_date]) byDate[l.log_date] = { date: l.log_date, oees: [], avails: [], perfs: [], quals: [] };
    byDate[l.log_date].oees.push(l.oee || 0);
    byDate[l.log_date].avails.push(l.availability || 0);
    byDate[l.log_date].perfs.push(l.performance || 0);
    byDate[l.log_date].quals.push(l.quality || 0);
  });
  const chartData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
    date: d.date.slice(5),
    OEE: +(d.oees.reduce((s, v) => s + v, 0) / d.oees.length).toFixed(1),
    Availability: +(d.avails.reduce((s, v) => s + v, 0) / d.avails.length).toFixed(1),
    Performance: +(d.perfs.reduce((s, v) => s + v, 0) / d.perfs.length).toFixed(1),
    Quality: +(d.quals.reduce((s, v) => s + v, 0) / d.quals.length).toFixed(1),
  }));

  // Station averages
  const stationAverages = STATIONS.map(s => {
    const sl = logs.filter(l => l.station === s);
    if (!sl.length) return { station: s, oee: null, avail: null, perf: null, qual: null };
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      station: s,
      oee: avg(sl.map(l => l.oee || 0)),
      avail: avg(sl.map(l => l.availability || 0)),
      perf: avg(sl.map(l => l.performance || 0)),
      qual: avg(sl.map(l => l.quality || 0)),
    };
  });

  // Scrap summary per station
  const scrapByStation = STATIONS.map(s => {
    const se = scrapEntries.filter(e => e.station === s);
    if (!se.length) return { station: s, avgScrap: null, avgVariance: null, overCount: 0 };
    const totalIn  = se.reduce((a, e) => a + (e.qty_input || 0), 0);
    const totalSc  = se.reduce((a, e) => a + (e.qty_scrap || 0), 0);
    const avgScrap = totalIn > 0 ? (totalSc / totalIn) * 100 : 0;
    const withBOM  = se.filter(e => e.variance_pct != null);
    const avgVariance = withBOM.length ? withBOM.reduce((a, e) => a + e.variance_pct, 0) / withBOM.length : null;
    const overCount = withBOM.filter(e => e.variance_pct > 0).length;
    return { station: s, avgScrap, avgVariance, overCount };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OEE Monitor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overall Equipment Effectiveness by station & date</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select value={stationFilter} onChange={e => setStationFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Stations</option>
          {STATIONS.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select value={days} onChange={e => setDays(+e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">OEE Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              <ReferenceLine y={65} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "WC 65%", fill: "#22c55e", fontSize: 10 }} />
              <Bar dataKey="OEE" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
              <Bar dataKey="Availability" fill="#60a5fa" radius={[3,3,0,0]} />
              <Bar dataKey="Performance" fill="#f59e0b" radius={[3,3,0,0]} />
              <Bar dataKey="Quality" fill="#34d399" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scrap vs BOM panel */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Scrap vs BOM Allowance (last {days} days)</h2>
          <a href="/ScrapTracking" className="text-xs text-primary hover:underline">View full log →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Station</th>
                <th className="px-4 py-3 text-left">Avg Actual Scrap %</th>
                <th className="px-4 py-3 text-left">Avg Variance vs BOM</th>
                <th className="px-4 py-3 text-left">Over-Allowance Runs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scrapByStation.map(s => {
                const varColor = s.avgVariance == null ? "text-muted-foreground" : s.avgVariance > 2 ? "text-red-400" : s.avgVariance > 0 ? "text-amber-400" : "text-green-400";
                return (
                  <tr key={s.station} className={`hover:bg-secondary/40 transition-colors ${(s.avgVariance || 0) > 2 ? "bg-red-500/5" : ""}`}>
                    <td className="px-4 py-3 font-medium capitalize">{s.station.replace(/_/g," ")}</td>
                    <td className="px-4 py-3 font-mono">
                      {s.avgScrap != null ? (
                        <span className={s.avgScrap > 5 ? "text-red-400" : s.avgScrap > 3 ? "text-amber-400" : "text-green-400"}>
                          {s.avgScrap.toFixed(2)}%
                        </span>
                      ) : <span className="text-muted-foreground">no data</span>}
                    </td>
                    <td className={`px-4 py-3 font-mono font-semibold ${varColor}`}>
                      {s.avgVariance != null ? `${s.avgVariance > 0 ? "+" : ""}${s.avgVariance.toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {s.overCount > 0
                        ? <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3"/>{s.overCount}</span>
                        : <span className="text-muted-foreground">{s.avgScrap != null ? "0" : "—"}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Station averages table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Station Averages (last {days} days)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Station</th>
                <th className="px-4 py-3 text-left">Availability</th>
                <th className="px-4 py-3 text-left">Performance</th>
                <th className="px-4 py-3 text-left">Quality</th>
                <th className="px-4 py-3 text-left">OEE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stationAverages.map(s => (
                <tr key={s.station} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium capitalize">{s.station.replace("_"," ")}</td>
                  <td className="px-4 py-3"><OEEBadge value={s.avail} /></td>
                  <td className="px-4 py-3"><OEEBadge value={s.perf} /></td>
                  <td className="px-4 py-3"><OEEBadge value={s.qual} /></td>
                  <td className="px-4 py-3"><OEEBadge value={s.oee} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}