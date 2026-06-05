import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand"];
const SHIFTS = ["A","B","C"];

function calcOEE(form) {
  const avail = form.planned_time_min > 0
    ? Math.max(0, (form.planned_time_min - (form.downtime_min || 0)) / form.planned_time_min) * 100 : 0;
  const runTime = form.planned_time_min - (form.downtime_min || 0);
  const perf = runTime > 0 && form.ideal_cycle_time_sec > 0
    ? Math.min(100, ((form.total_count || 0) * form.ideal_cycle_time_sec / 60) / runTime * 100) : 0;
  const qual = form.total_count > 0
    ? Math.min(100, (form.good_count || 0) / form.total_count * 100) : 0;
  return { avail, perf, qual, oee: (avail / 100) * (perf / 100) * (qual / 100) * 100 };
}

export default function StationLog() {
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    station: "press", shift: "A", log_date: format(new Date(), "yyyy-MM-dd"),
    planned_time_min: 480, downtime_min: 0, good_count: 0, scrap_count: 0,
    total_count: 0, ideal_cycle_time_sec: 60, notes: ""
  });
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));

  const load = async () => {
    const data = await base44.entities.StationLog.filter({ log_date: dateFilter });
    setLogs(data);
  };

  useEffect(() => { load(); }, [dateFilter]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const oee = calcOEE(form);
    await base44.entities.StationLog.create({
      ...form,
      availability: +oee.avail.toFixed(2),
      performance: +oee.perf.toFixed(2),
      quality: +oee.qual.toFixed(2),
      oee: +oee.oee.toFixed(2),
    });
    setShowForm(false); load();
  };

  const oeePreview = calcOEE(form);
  const oeeColor = oeePreview.oee >= 65 ? "text-green-400" : oeePreview.oee >= 45 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Station Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Log production data per shift</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Log Shift
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">New Station Log</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: "Station", key: "station", type: "select", opts: STATIONS },
              { label: "Shift", key: "shift", type: "select", opts: SHIFTS },
              { label: "Date", key: "log_date", type: "date" },
              { label: "Planned Time (min)", key: "planned_time_min", type: "number" },
              { label: "Downtime (min)", key: "downtime_min", type: "number" },
              { label: "Total Count", key: "total_count", type: "number" },
              { label: "Good Count", key: "good_count", type: "number" },
              { label: "Scrap Count", key: "scrap_count", type: "number" },
              { label: "Ideal Cycle (sec/unit)", key: "ideal_cycle_time_sec", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                {f.type === "select" ? (
                  <select value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                    {f.opts.map(o => <option key={o} value={o}>{o.replace("_"," ")}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={form[f.key]} onChange={e => set(f.key, f.type === "number" ? +e.target.value : e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                )}
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          {/* OEE Preview */}
          <div className="bg-secondary rounded-lg p-3 flex gap-6 text-sm">
            <span className="text-muted-foreground">Preview:</span>
            <span>A: <b className="text-foreground">{oeePreview.avail.toFixed(1)}%</b></span>
            <span>P: <b className="text-foreground">{oeePreview.perf.toFixed(1)}%</b></span>
            <span>Q: <b className="text-foreground">{oeePreview.qual.toFixed(1)}%</b></span>
            <span>OEE: <b className={`font-mono ${oeeColor}`}>{oeePreview.oee.toFixed(1)}%</b></span>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save Log</button>
          </div>
        </div>
      )}

      {/* Date filter + table */}
      <div className="flex gap-3 items-center">
        <label className="text-sm text-muted-foreground">Date:</label>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                {["Station","Shift","Date","Planned","Downtime","Good","Scrap","Avail%","Perf%","Qual%","OEE%"].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 && <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">No logs for this date</td></tr>}
              {logs.map(l => {
                const c = l.oee >= 65 ? "text-green-400" : l.oee >= 45 ? "text-amber-400" : "text-red-400";
                return (
                  <tr key={l.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-medium">{l.station?.replace("_"," ")}</td>
                    <td className="px-4 py-3">{l.shift}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.log_date}</td>
                    <td className="px-4 py-3">{l.planned_time_min}</td>
                    <td className="px-4 py-3">{l.downtime_min || 0}</td>
                    <td className="px-4 py-3">{l.good_count}</td>
                    <td className="px-4 py-3">{l.scrap_count}</td>
                    <td className="px-4 py-3">{l.availability?.toFixed(1)}</td>
                    <td className="px-4 py-3">{l.performance?.toFixed(1)}</td>
                    <td className="px-4 py-3">{l.quality?.toFixed(1)}</td>
                    <td className={`px-4 py-3 font-mono font-bold ${c}`}>{l.oee?.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}