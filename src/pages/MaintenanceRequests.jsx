import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, X, Wrench } from "lucide-react";

import { format } from "date-fns";

const PRIORITY_COLORS = {
  critical: "bg-red-600/20 text-red-400",
  high: "bg-orange-600/20 text-orange-400",
  medium: "bg-amber-600/20 text-amber-400",
  low: "bg-slate-600/20 text-slate-400",
};

const STATUS_COLORS = {
  open: "bg-blue-600/20 text-blue-400",
  assigned: "bg-purple-600/20 text-purple-400",
  in_progress: "bg-amber-600/20 text-amber-400",
  on_hold: "bg-orange-600/20 text-orange-400",
  completed: "bg-green-600/20 text-green-400",
  cancelled: "bg-slate-600/20 text-slate-400",
};

const TODAY = format(new Date(), "yyyy-MM-dd");

const EMPTY = {
  request_number: "", asset_name: "", asset_location: "", issue_description: "",
  priority: "medium", status: "open", requested_by: "", assigned_to: "",
  requested_date: TODAY, target_date: "", completed_date: "",
  downtime_incurred: false, resolution_notes: "",
};

export default function MaintenanceRequests() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const data = await base44.entities.MaintenanceRequest.list("-requested_date", 200);
    setRequests(data);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (r) => { setEditing(r); setForm(r); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async () => {
    if (editing) await base44.entities.MaintenanceRequest.update(editing.id, form);
    else await base44.entities.MaintenanceRequest.create(form);
    closeForm(); load();
  };

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || r.request_number?.toLowerCase().includes(q)
      || r.asset_name?.toLowerCase().includes(q)
      || r.assigned_to?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all"
      || (statusFilter === "active" && ["open", "assigned", "in_progress"].includes(r.status))
      || r.status === statusFilter;
    const matchPriority = priorityFilter === "all" || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const openCount = requests.filter(r => ["open", "assigned", "in_progress"].includes(r.status)).length;
  const criticalCount = requests.filter(r => r.priority === "critical" && !["completed", "cancelled"].includes(r.status)).length;
  const downtimeCount = requests.filter(r => r.downtime_incurred).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {openCount} open
            {criticalCount > 0 && <span className="text-red-400 ml-2">· {criticalCount} critical</span>}
            {downtimeCount > 0 && <span className="text-amber-400 ml-2">· {downtimeCount} with downtime</span>}
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Edit Request" : "New Maintenance Request"}</h3>
            <button onClick={closeForm} className="p-1.5 hover:bg-secondary rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Request # *</label>
              <input value={form.request_number} onChange={e => set("request_number", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Asset / Machine *</label>
              <input value={form.asset_name} onChange={e => set("asset_name", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <input value={form.asset_location} onChange={e => set("asset_location", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Priority *</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["critical", "high", "medium", "low"].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["open", "assigned", "in_progress", "on_hold", "completed", "cancelled"].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Requested By</label>
              <input value={form.requested_by} onChange={e => set("requested_by", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
              <input value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Requested Date</label>
              <input type="date" value={form.requested_date} onChange={e => set("requested_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Target Completion</label>
              <input type="date" value={form.target_date} onChange={e => set("target_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            {["completed", "cancelled"].includes(form.status) && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Completed Date</label>
                <input type="date" value={form.completed_date} onChange={e => set("completed_date", e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="downtime" checked={form.downtime_incurred}
                onChange={e => set("downtime_incurred", e.target.checked)}
                className="w-4 h-4 accent-primary" />
              <label htmlFor="downtime" className="text-sm">Downtime incurred</label>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Issue Description *</label>
              <textarea value={form.issue_description} onChange={e => set("issue_description", e.target.value)}
                rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            {["completed", "cancelled"].includes(form.status) && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs text-muted-foreground mb-1 block">Resolution Notes</label>
                <textarea value={form.resolution_notes} onChange={e => set("resolution_notes", e.target.value)}
                  rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={closeForm} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search request #, asset, assignee..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="active">Active</option>
          <option value="all">All Status</option>
          {["open", "assigned", "in_progress", "on_hold", "completed", "cancelled"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Priorities</option>
          {["critical", "high", "medium", "low"].map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Request #</th>
                <th className="px-4 py-3 text-left">Asset</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th className="px-4 py-3 text-left">Target Date</th>
                <th className="px-4 py-3 text-left">Downtime</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-16 text-center">
                  {requests.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Wrench className="w-8 h-8 text-muted-foreground/30" />
                      <div className="font-medium text-foreground">No maintenance requests yet</div>
                      <div className="text-sm text-muted-foreground">Log a request when an asset needs repair or inspection.</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No requests match your filters</span>
                  )}
                </td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className={`hover:bg-secondary/40 transition-colors ${r.priority === "critical" && !["completed","cancelled"].includes(r.status) ? "bg-red-500/5" : ""}`}>
                  <td className="px-4 py-3 font-mono font-medium">{r.request_number}</td>
                  <td className="px-4 py-3 font-medium">{r.asset_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.asset_location || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {r.status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.assigned_to || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.target_date || "—"}</td>
                  <td className="px-4 py-3">
                    {r.downtime_incurred
                      ? <span className="text-xs text-amber-400 font-medium">Yes</span>
                      : <span className="text-xs text-muted-foreground">No</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(r)} className="text-xs text-primary hover:underline">Edit</button>
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
