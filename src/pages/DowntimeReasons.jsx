import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";

const CATEGORY_COLORS = {
  mechanical:          "bg-red-500/15 text-red-400",
  electrical:          "bg-orange-500/15 text-orange-400",
  changeover:          "bg-blue-500/15 text-blue-400",
  material:            "bg-amber-500/15 text-amber-400",
  operator:            "bg-purple-500/15 text-purple-400",
  quality:             "bg-rose-500/15 text-rose-400",
  planned_maintenance: "bg-green-500/15 text-green-400",
  other:               "bg-slate-500/15 text-slate-400",
};

const CATEGORIES = [
  "mechanical", "electrical", "changeover", "material",
  "operator", "quality", "planned_maintenance", "other",
];

const empty = { code: "", description: "", category: "mechanical", is_active: true };

export default function DowntimeReasons() {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.DowntimeReason.list(); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.DowntimeReason.update(editing.id, form);
    else await base44.entities.DowntimeReason.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const active = records.filter(r => r.is_active !== false).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Downtime Reasons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Reference codes selected when logging downtime in Station Log</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Reason
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Reason" : "New Downtime Reason"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Code *</label>
              <input value={form.code} onChange={e => set("code", e.target.value)}
                placeholder="e.g. M-01"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
              <input value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="e.g. Corrugator jam"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="is_active" checked={form.is_active !== false}
                onChange={e => set("is_active", e.target.checked)}
                className="w-4 h-4 accent-primary" />
              <label htmlFor="is_active" className="text-sm">Active — show in Station Log</label>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty); }}
              className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <span className="text-sm font-semibold">{active} active</span>
          {records.length - active > 0 && (
            <span className="text-sm text-muted-foreground"> · {records.length - active} inactive</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                {["Code", "Description", "Category", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="font-medium text-foreground mb-1">No downtime reasons yet</div>
                    <div className="text-sm text-muted-foreground">Add reason codes here — operators pick them when logging downtime minutes in Station Log.</div>
                  </td>
                </tr>
              )}
              {records.map(r => (
                <tr key={r.id} className={`hover:bg-secondary/40 ${r.is_active === false ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-mono font-bold">{r.code}</td>
                  <td className="px-4 py-3">{r.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${CATEGORY_COLORS[r.category]}`}>
                      {r.category?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.is_active !== false ? "bg-green-500/15 text-green-400" : "bg-slate-500/15 text-slate-400"}`}>
                      {r.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditing(r); setForm({ ...r }); setShowForm(true); }}
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
