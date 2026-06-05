import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, X, CheckCircle, Clock } from "lucide-react";
import { format, addDays, differenceInDays, parseISO } from "date-fns";

const FREQ_DAYS = { daily: 1, weekly: 7, monthly: 30, quarterly: 90, semi_annual: 180, annual: 365 };

const TODAY = format(new Date(), "yyyy-MM-dd");

function dueStatus(nextDue) {
  if (!nextDue) return "unknown";
  const days = differenceInDays(parseISO(nextDue), new Date());
  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "ok";
}

const DUE_BADGE = {
  overdue:  { label: "Overdue",  cls: "bg-red-500/15 text-red-400" },
  due_soon: { label: "Due soon", cls: "bg-amber-500/15 text-amber-400" },
  ok:       { label: "On track", cls: "bg-green-500/15 text-green-400" },
  unknown:  { label: "No date",  cls: "bg-slate-500/15 text-slate-400" },
};

const EMPTY = {
  pm_number: "", asset_name: "", asset_location: "", task_description: "",
  frequency: "monthly", last_completed: "", next_due: "",
  assigned_to: "", estimated_duration_min: "", is_active: true, notes: "",
};

export default function PMSchedule() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [dueFilter, setDueFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const data = await base44.entities.PreventiveMaintenance.list("next_due", 200);
    setTasks(data);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (t) => { setEditing(t); setForm(t); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async () => {
    if (editing) await base44.entities.PreventiveMaintenance.update(editing.id, form);
    else await base44.entities.PreventiveMaintenance.create(form);
    closeForm(); load();
  };

  const markComplete = async (task) => {
    const completedDate = TODAY;
    const freqDays = FREQ_DAYS[task.frequency] || 30;
    const nextDue = format(addDays(new Date(), freqDays), "yyyy-MM-dd");
    await base44.entities.PreventiveMaintenance.update(task.id, {
      last_completed: completedDate,
      next_due: nextDue,
    });
    load();
  };

  const filtered = tasks.filter(t => {
    if (!showInactive && t.is_active === false) return false;
    const q = search.toLowerCase();
    const matchSearch = !search
      || t.pm_number?.toLowerCase().includes(q)
      || t.asset_name?.toLowerCase().includes(q)
      || t.task_description?.toLowerCase().includes(q);
    const status = dueStatus(t.next_due);
    const matchDue = dueFilter === "all" || status === dueFilter;
    return matchSearch && matchDue;
  });

  const overdueCount = tasks.filter(t => t.is_active !== false && dueStatus(t.next_due) === "overdue").length;
  const dueSoonCount = tasks.filter(t => t.is_active !== false && dueStatus(t.next_due) === "due_soon").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">PM Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Preventive maintenance tasks
            {overdueCount > 0 && <span className="text-red-400 ml-2">· {overdueCount} overdue</span>}
            {dueSoonCount > 0 && <span className="text-amber-400 ml-2">· {dueSoonCount} due soon</span>}
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add PM Task
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Edit PM Task" : "New PM Task"}</h3>
            <button onClick={closeForm} className="p-1.5 hover:bg-secondary rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">PM # *</label>
              <input value={form.pm_number} onChange={e => set("pm_number", e.target.value)}
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
              <label className="text-xs text-muted-foreground mb-1 block">Frequency *</label>
              <select value={form.frequency} onChange={e => set("frequency", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {Object.keys(FREQ_DAYS).map(f => (
                  <option key={f} value={f}>{f.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Last Completed</label>
              <input type="date" value={form.last_completed} onChange={e => set("last_completed", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Next Due</label>
              <input type="date" value={form.next_due} onChange={e => set("next_due", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
              <input value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Est. Duration (min)</label>
              <input type="number" value={form.estimated_duration_min} onChange={e => set("estimated_duration_min", +e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="is_active" checked={form.is_active !== false}
                onChange={e => set("is_active", e.target.checked)}
                className="w-4 h-4 accent-primary" />
              <label htmlFor="is_active" className="text-sm">Active</label>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Task Description *</label>
              <textarea value={form.task_description} onChange={e => set("task_description", e.target.value)}
                rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={closeForm} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search PM #, asset, task..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={dueFilter} onChange={e => setDueFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Due Status</option>
          <option value="overdue">Overdue</option>
          <option value="due_soon">Due Soon (≤7 days)</option>
          <option value="ok">On Track</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)}
            className="w-4 h-4 accent-primary" />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">PM #</th>
                <th className="px-4 py-3 text-left">Asset</th>
                <th className="px-4 py-3 text-left">Task</th>
                <th className="px-4 py-3 text-left">Frequency</th>
                <th className="px-4 py-3 text-left">Last Done</th>
                <th className="px-4 py-3 text-left">Next Due</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Assigned</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-16 text-center">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Clock className="w-8 h-8 text-muted-foreground/30" />
                      <div className="font-medium text-foreground">No PM tasks yet</div>
                      <div className="text-sm text-muted-foreground">Add scheduled maintenance tasks to track upcoming servicing for each machine.</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No tasks match your filters</span>
                  )}
                </td></tr>
              )}
              {filtered.map(t => {
                const ds = dueStatus(t.next_due);
                const badge = DUE_BADGE[ds];
                const daysLeft = t.next_due ? differenceInDays(parseISO(t.next_due), new Date()) : null;
                return (
                  <tr key={t.id} className={`hover:bg-secondary/40 transition-colors ${t.is_active === false ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-mono font-medium">{t.pm_number}</td>
                    <td className="px-4 py-3 font-medium">{t.asset_name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{t.task_description}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{t.frequency?.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.last_completed || "—"}</td>
                    <td className="px-4 py-3">
                      <div>{t.next_due || "—"}</div>
                      {daysLeft !== null && (
                        <div className={`text-xs mt-0.5 ${ds === "overdue" ? "text-red-400" : ds === "due_soon" ? "text-amber-400" : "text-muted-foreground"}`}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "today" : `${daysLeft}d left`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.assigned_to || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => markComplete(t)}
                          className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Done
                        </button>
                        <button onClick={() => openEdit(t)} className="text-xs text-primary hover:underline">Edit</button>
                      </div>
                    </td>
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
