import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  open: "bg-blue-500/15 text-blue-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  on_hold: "bg-orange-500/15 text-orange-400",
  completed: "bg-green-500/15 text-green-400",
  cancelled: "bg-slate-500/15 text-slate-400",
};

const PRIORITY_COLORS = {
  low: "bg-slate-500/15 text-slate-400",
  medium: "bg-blue-500/15 text-blue-400",
  high: "bg-amber-500/15 text-amber-400",
  critical: "bg-red-500/15 text-red-400",
};

const TYPE_COLORS = {
  corrective: "bg-red-500/15 text-red-400",
  preventive: "bg-green-500/15 text-green-400",
  predictive: "bg-blue-500/15 text-blue-400",
  emergency: "bg-red-600/25 text-red-300",
};

const empty = {
  request_number: "", asset_id: "", type: "corrective", priority: "medium",
  description: "", reported_by: "", reported_date: format(new Date(), "yyyy-MM-dd"),
  assigned_to: "", scheduled_date: "", completed_date: "", downtime_min: "",
  cost: "", status: "open", resolution_notes: ""
};

export default function MaintenanceRequests() {
  const [records, setRecords] = useState([]);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [r, a] = await Promise.all([
      base44.entities.MaintenanceRequest.list("-reported_date", 300),
      base44.entities.MaintenanceAsset.list("asset_code", 200),
    ]);
    setRecords(r); setAssets(a);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    const data = {
      ...form,
      downtime_min: form.downtime_min ? +form.downtime_min : 0,
      cost: form.cost ? +form.cost : undefined,
    };
    if (editing) await base44.entities.MaintenanceRequest.update(editing.id, data);
    else await base44.entities.MaintenanceRequest.create(data);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const assetLabel = (id) => {
    const a = assets.find(a => a.id === id);
    return a ? `${a.asset_code} — ${a.name}` : "—";
  };

  const filtered = records.filter(r => {
    const ms = !search || r.request_number?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || r.status === statusFilter;
    const mp = priorityFilter === "all" || r.priority === priorityFilter;
    return ms && mst && mp;
  });

  const stats = {
    open: records.filter(r => r.status === "open").length,
    in_progress: records.filter(r => r.status === "in_progress").length,
    critical: records.filter(r => r.priority === "critical" && !["completed","cancelled"].includes(r.status)).length,
    completed: records.filter(r => r.status === "completed").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Corrective, preventive and emergency maintenance</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open", value: stats.open, color: "text-blue-400", icon: Clock },
          { label: "In Progress", value: stats.in_progress, color: "text-amber-400", icon: Clock },
          { label: "Critical / Open", value: stats.critical, color: "text-red-400", icon: AlertTriangle },
          { label: "Completed", value: stats.completed, color: "text-green-400", icon: CheckCircle2 },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Request" : "New Maintenance Request"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Request Number *</label>
              <input value={form.request_number} onChange={e => set("request_number", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Asset</label>
              <select value={form.asset_id} onChange={e => set("asset_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Select Asset —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.asset_code} — {a.name}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["corrective","preventive","predictive","emergency"].map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["low","medium","high","critical"].map(p => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["open","in_progress","on_hold","completed","cancelled"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Reported Date</label>
              <input type="date" value={form.reported_date} onChange={e => set("reported_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Reported By</label>
              <input value={form.reported_by} onChange={e => set("reported_by", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
              <input value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Scheduled Date</label>
              <input type="date" value={form.scheduled_date} onChange={e => set("scheduled_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Completed Date</label>
              <input type="date" value={form.completed_date} onChange={e => set("completed_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Downtime (min)</label>
              <input type="number" value={form.downtime_min} onChange={e => set("downtime_min", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Cost (R)</label>
              <input type="number" value={form.cost} onChange={e => set("cost", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Description *</label>
              <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Resolution Notes</label>
              <textarea rows={2} value={form.resolution_notes} onChange={e => set("resolution_notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["open","in_progress","on_hold","completed","cancelled"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Priority</option>
          {["low","medium","high","critical"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Request #","Asset","Type","Priority","Reported","Assigned To","Sched. Date","Status","Actions"].map(h =>
                <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No requests found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.request_number}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{assetLabel(r.asset_id)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${TYPE_COLORS[r.type]}`}>{r.type}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.reported_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.assigned_to || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.scheduled_date || "—"}</td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={async e => { await base44.entities.MaintenanceRequest.update(r.id, { status: e.target.value }); load(); }}
                      className={`text-xs rounded-md px-2 py-0.5 border border-border bg-secondary outline-none focus:ring-1 focus:ring-primary ${STATUS_COLORS[r.status]}`}>
                      {["open","in_progress","on_hold","completed","cancelled"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3"><button onClick={() => { setEditing(r); setForm({...r, downtime_min: r.downtime_min || "", cost: r.cost || ""}); setShowForm(true); }} className="text-xs text-primary hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}