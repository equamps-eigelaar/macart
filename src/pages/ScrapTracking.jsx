import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, subDays } from "date-fns";
import { Plus, AlertTriangle, TrendingDown } from "lucide-react";
import ScrapEntryForm from "@/components/scrap/ScrapEntryForm";

const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand"];

function varianceColor(v) {
  if (v == null) return "text-muted-foreground";
  if (v > 2)  return "text-red-400";
  if (v > 0)  return "text-amber-400";
  return "text-green-400";
}

function VarianceBadge({ v }) {
  if (v == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={`font-mono text-xs font-semibold ${varianceColor(v)}`}>
      {v > 0 ? "+" : ""}{v.toFixed(2)}%
    </span>
  );
}

export default function ScrapTracking() {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stationFilter, setStationFilter] = useState("all");
  const [days, setDays] = useState(7);

  const load = async () => {
    const all = await base44.entities.ScrapEntry.list("-entry_date", 500);
    const from = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
    setEntries(all.filter(e => e.entry_date >= from));
  };

  useEffect(() => { load(); }, [days]);

  const filtered = stationFilter === "all" ? entries : entries.filter(e => e.station === stationFilter);

  // Station summary
  const stationSummary = STATIONS.map(s => {
    const se = entries.filter(e => e.station === s);
    if (!se.length) return { station: s, entries: 0, avgScrap: null, avgVariance: null, overCount: 0 };
    const avgScrap = se.reduce((a, e) => a + (e.scrap_pct || 0), 0) / se.length;
    const withBOM = se.filter(e => e.variance_pct != null);
    const avgVariance = withBOM.length ? withBOM.reduce((a, e) => a + e.variance_pct, 0) / withBOM.length : null;
    const overCount = withBOM.filter(e => e.variance_pct > 0).length;
    return { station: s, entries: se.length, avgScrap, avgVariance, overCount };
  });

  const totalScrap   = filtered.reduce((a, e) => a + (e.qty_scrap || 0), 0);
  const totalInput   = filtered.reduce((a, e) => a + (e.qty_input || 0), 0);
  const overBOM      = filtered.filter(e => (e.variance_pct || 0) > 0).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Scrap Tracking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Station-level waste vs BOM scrap allowances</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      {showForm && (
        <ScrapEntryForm
          initial={editing}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold font-mono text-primary">{totalInput > 0 ? ((totalScrap / totalInput) * 100).toFixed(2) : "—"}%</div>
          <div className="text-xs text-muted-foreground mt-0.5">Overall Scrap Rate</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold font-mono">{totalScrap.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Scrap Units</div>
        </div>
        <div className={`border rounded-xl p-4 ${overBOM > 0 ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"}`}>
          <div className={`text-2xl font-bold font-mono ${overBOM > 0 ? "text-red-400" : "text-green-400"}`}>{overBOM}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Entries Over BOM Allowance</div>
        </div>
      </div>

      {/* Station summary */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Station Summary (last {days} days)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Station</th>
                <th className="px-4 py-3 text-left">Entries</th>
                <th className="px-4 py-3 text-left">Avg Scrap %</th>
                <th className="px-4 py-3 text-left">Avg Variance vs BOM</th>
                <th className="px-4 py-3 text-left">Over-BOM Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stationSummary.map(s => (
                <tr key={s.station} className={`hover:bg-secondary/40 transition-colors ${s.avgVariance > 2 ? "bg-red-500/5" : ""}`}>
                  <td className="px-4 py-3 font-medium capitalize">{s.station.replace(/_/g," ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.entries}</td>
                  <td className="px-4 py-3 font-mono">{s.avgScrap != null ? `${s.avgScrap.toFixed(2)}%` : "—"}</td>
                  <td className="px-4 py-3"><VarianceBadge v={s.avgVariance} /></td>
                  <td className="px-4 py-3">
                    {s.overCount > 0
                      ? <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3"/>{s.overCount}</span>
                      : <span className="text-muted-foreground">{s.entries > 0 ? "0" : "—"}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters + detail log */}
      <div className="flex flex-wrap gap-3">
        <select value={stationFilter} onChange={e => setStationFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Stations</option>
          {STATIONS.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
        <select value={days} onChange={e => setDays(+e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Entry Log</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Station</th>
                <th className="px-4 py-3 text-left">Shift</th>
                <th className="px-4 py-3 text-left">Input</th>
                <th className="px-4 py-3 text-left">Good</th>
                <th className="px-4 py-3 text-left">Scrap</th>
                <th className="px-4 py-3 text-left">Scrap %</th>
                <th className="px-4 py-3 text-left">BOM Allow.</th>
                <th className="px-4 py-3 text-left">Variance</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">No entries found</td></tr>
              )}
              {filtered.map(e => (
                <tr key={e.id} className={`hover:bg-secondary/40 transition-colors ${(e.variance_pct || 0) > 2 ? "bg-red-500/5" : ""}`}>
                  <td className="px-4 py-3 text-muted-foreground">{e.entry_date}</td>
                  <td className="px-4 py-3 capitalize font-medium">{e.station?.replace(/_/g," ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.shift || "—"}</td>
                  <td className="px-4 py-3 font-mono">{e.qty_input?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-green-400">{e.qty_good?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-red-400">{e.qty_scrap?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 font-mono">{e.scrap_pct != null ? `${e.scrap_pct.toFixed(2)}%` : "—"}</td>
                  <td className="px-4 py-3 font-mono text-blue-400">{e.bom_scrap_pct != null ? `${e.bom_scrap_pct.toFixed(2)}%` : "—"}</td>
                  <td className="px-4 py-3"><VarianceBadge v={e.variance_pct} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditing(e); setShowForm(true); }}
                      className="text-xs text-primary hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}