import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Activity, X } from "lucide-react";
import { format } from "date-fns";

const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand"];
const SHIFTS = ["Day","Night"];

const BREAKDOWN_CODES = [
  { code: "M1", label: "M1 – Bearing / knocking noise" },
  { code: "M2", label: "M2 – Chain / belt issue" },
  { code: "M3", label: "M3 – Ram / platen movement" },
  { code: "M4", label: "M4 – Feed / delivery jam" },
  { code: "E1", label: "E1 – Machine trip" },
  { code: "E2", label: "E2 – Sensor fault" },
  { code: "E3", label: "E3 – Motor issue" },
  { code: "D1", label: "D1 – Poor cut" },
  { code: "D2", label: "D2 – Die movement" },
  { code: "D3", label: "D3 – Stripping problem" },
  { code: "A1", label: "A1 – Low air pressure" },
  { code: "A2", label: "A2 – Air leak" },
  { code: "O1", label: "O1 – Safety stop activated" },
  { code: "O2", label: "O2 – Unknown / other" },
];

const emptyBreakdown = { time_started: "", breakdown_code: "", short_description: "", time_fixed: "", total_downtime_min: "" };

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
    station: "press", shift: "Day", log_date: format(new Date(), "yyyy-MM-dd"),
    planned_time_min: 480, downtime_min: 0, good_count: 0, scrap_count: 0,
    total_count: 0, ideal_cycle_time_sec: 60, notes: "",
    machine_name: "", breakdown_records: []
  });
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));

  const load = async () => {
    const data = await base44.entities.StationLog.filter({ log_date: dateFilter });
    setLogs(data);
  };

  useEffect(() => { load(); }, [dateFilter]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addBreakdown = () => setForm(p => ({ ...p, breakdown_records: [...(p.breakdown_records || []), { ...emptyBreakdown }] }));
  const setBreakdown = (i, k, v) => setForm(p => {
    const rows = [...(p.breakdown_records || [])];
    rows[i] = { ...rows[i], [k]: v };
    return { ...p, breakdown_records: rows };
  });
  const removeBreakdown = (i) => setForm(p => {
    const rows = [...(p.breakdown_records || [])];
    rows.splice(i, 1);
    return { ...p, breakdown_records: rows };
  });

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
          {/* Machine name */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Machine Name</label>
              <input value={form.machine_name || ""} onChange={e => set("machine_name", e.target.value)}
                placeholder="e.g. Die Cutter #1"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Breakdown Records */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Breakdown Record</h4>
              <button type="button" onClick={addBreakdown}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Breakdown
              </button>
            </div>
            {(form.breakdown_records || []).length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No breakdowns logged.</p>
            )}
            {(form.breakdown_records || []).map((row, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2 items-end">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Time Started</label>
                  <input type="time" value={row.time_started} onChange={e => setBreakdown(i, "time_started", e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Breakdown Code</label>
                  <select value={row.breakdown_code} onChange={e => setBreakdown(i, "breakdown_code", e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="">— Code —</option>
                    {BREAKDOWN_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Short Description</label>
                  <input value={row.short_description} onChange={e => setBreakdown(i, "short_description", e.target.value)}
                    placeholder="What happened?"
                    className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Time Fixed</label>
                  <input type="time" value={row.time_fixed} onChange={e => setBreakdown(i, "time_fixed", e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Downtime (min)</label>
                    <input type="number" value={row.total_downtime_min} onChange={e => setBreakdown(i, "total_downtime_min", +e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <button onClick={() => removeBreakdown(i)} className="pb-1.5 text-muted-foreground hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
                {["Station","Shift","Machine","Date","Planned","Downtime","Good","Scrap","Breakdowns","Avail%","Perf%","Qual%","OEE%"].map(h => (
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
                    <td className="px-4 py-3 text-muted-foreground">{l.machine_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.log_date}</td>
                    <td className="px-4 py-3">{l.planned_time_min}</td>
                    <td className="px-4 py-3">{l.downtime_min || 0}</td>
                    <td className="px-4 py-3">{l.good_count}</td>
                    <td className="px-4 py-3">{l.scrap_count}</td>
                    <td className="px-4 py-3 text-center">
                      {l.breakdown_records?.length > 0
                        ? <span className="text-amber-400 font-medium">{l.breakdown_records.length}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
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