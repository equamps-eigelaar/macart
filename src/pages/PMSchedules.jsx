import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Calendar, AlertTriangle } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

const FREQ_COLORS = {
  daily: "bg-blue-500/15 text-blue-400",
  weekly: "bg-cyan-500/15 text-cyan-400",
  monthly: "bg-purple-500/15 text-purple-400",
  quarterly: "bg-amber-500/15 text-amber-400",
  bi_annually: "bg-orange-500/15 text-orange-400",
  annually: "bg-red-500/15 text-red-400",
};

function dueBadge(nextDueDate) {
  if (!nextDueDate) return null;
  const days = differenceInDays(parseISO(nextDueDate), new Date());
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: "bg-red-500/15 text-red-400" };
  if (days === 0) return { label: "Due today", cls: "bg-red-500/15 text-red-400" };
  if (days <= 7) return { label: `${days}d left`, cls: "bg-amber-500/15 text-amber-400" };
  if (days <= 30) return { label: `${days}d left`, cls: "bg-yellow-500/15 text-yellow-400" };
  return { label: `${days}d left`, cls: "bg-slate-500/15 text-slate-400" };
}

const empty = {
  schedule_code: "", asset_id: "", task_description: "", frequency: "monthly",
  last_done_date: "", next_due_date: "", assigned_to: "",
  estimated_duration_min: "", is_active: true, notes: ""
};

export default function PMSchedules() {
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [r, a] = await Promise.all([
      base44.entities.PMSchedule.list("next_due_date", 300),
      base44.entities.MaintenanceAsset.list("asset_code", 200),
    ]);
    setRecords(r); setAssets(a);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const data = { ...form, estimated_duration_min: form.estimated_duration_min ? +form.estimated_duration_min : undefined };
    if (editing) await base44.entities.PMSchedule.update(editing.id, data);
    else await base44.entities.PMSchedule.create(data);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const assetLabel = (id) => {
    const a = assets.find(a => a.id === id);
    return a ? `${a.asset_code} — ${a.name}` : "—";
  };

  const activeRecords = records.filter(r => r.is_active !== false);
  const overdueCount = activeRecords.filter(r => r.next_due_date && differenceInDays(parseISO(r.next_due_date), new Date()) < 0).length;
  const dueSoonCount = activeRecords.filter(r => {
    if (!r.next_due_date) return false;
    const d = differenceInDays(parseISO(r.next_due_date), new Date());
    return d >= 0 && d <= 7;
  }).length;

  const filtered = records.filter(r => {
    const ms = !search || r.schedule_code?.toLowerCase().includes(search.toLowerCase()) || r.task_description?.toLowerCase().includes(search.toLowerCase());
    if (showOverdueOnly) {
      const d = r.next_due_date ? differenceInDays(parseISO(r.next_due_date), new Date()) : 999;
      return ms && d < 0;
    }
    return ms;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6" /> PM Schedules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Preventive maintenance task calendar</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Schedule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-2xl font-bold">{activeRecords.length}</div>
          <div className="text-xs text-muted-foreground">Active Schedules</div>
        </div>
        <div className={`border rounded-xl p-4 ${overdueCount > 0 ? "bg-red-500/10 border-red-500/30" : "bg-card border-border"}`}>
          <div className={`text-2xl font-bold flex items-center gap-2 ${overdueCount > 0 ? "text-red-400" : "text-foreground"}`}>
            {overdueCount > 0 && <AlertTriangle className="w-5 h-5" />}{overdueCount}
          </div>
          <div className="text-xs text-muted-foreground">Overdue</div>
        </div>
        <div className={`border rounded-xl p-4 ${dueSoonCount > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-card border-border"}`}>
          <div className={`text-2xl font-bold ${dueSoonCount > 0 ? "text-amber-400" : "text-foreground"}`}>{dueSoonCount}</div>
          <div className="text-xs text-muted-foreground">Due Within 7 Days</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Schedule" : "New PM Schedule"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Schedule Code *</label>
              <input value={form.schedule_code} onChange={e => set("schedule_code", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Asset *</label>
              <select value={form.asset_id} onChange={e => set("asset_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Select Asset —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.asset_code} — {a.name}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Frequency *</label>
              <select value={form.frequency} onChange={e => set("frequency", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["daily","weekly","monthly","quarterly","bi_annually","annually"].map(f =>
                  <option key={f} value={f}>{f.replace(/_/g," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Last Done Date</label>
              <input type="date" value={form.last_done_date} onChange={e => set("last_done_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Next Due Date *</label>
              <input type="date" value={form.next_due_date} onChange={e => set("next_due_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
              <input value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Est. Duration (min)</label>
              <input type="number" value={form.estimated_duration_min} onChange={e => set("estimated_duration_min", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="w-4 h-4 accent-primary" />
                Active
              </label>
            </div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Task Description *</label>
              <textarea rows={2} value={form.task_description} onChange={e => set("task_description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schedules..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          <input type="checkbox" checked={showOverdueOnly} onChange={e => setShowOverdueOnly(e.target.checked)} className="w-4 h-4 accent-primary" />
          Overdue only
        </label>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Code","Asset","Task","Frequency","Last Done","Next Due","Assigned To","Active","Actions"].map(h =>
                <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No schedules found</td></tr>}
              {filtered.map(r => {
                const due = dueBadge(r.next_due_date);
                return (
                  <tr key={r.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-mono font-bold">{r.schedule_code}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{assetLabel(r.asset_id)}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{r.task_description}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${FREQ_COLORS[r.frequency]}`}>{r.frequency?.replace(/_/g," ")}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{r.last_done_date || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{r.next_due_date}</span>
                        {due && <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${due.cls}`}>{due.label}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.assigned_to || "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${r.is_active !== false ? "text-green-400" : "text-muted-foreground"}`}>{r.is_active !== false ? "Yes" : "No"}</span></td>
                    <td className="px-4 py-3"><button onClick={() => { setEditing(r); setForm({...r, estimated_duration_min: r.estimated_duration_min || ""}); setShowForm(true); }} className="text-xs text-primary hover:underline">Edit</button></td>
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