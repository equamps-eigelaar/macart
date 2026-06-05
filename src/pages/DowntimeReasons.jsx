import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const CATEGORY_COLORS = {
  mechanical: "bg-red-500/15 text-red-400",
  electrical: "bg-orange-500/15 text-orange-400",
  changeover: "bg-blue-500/15 text-blue-400",
  material: "bg-amber-500/15 text-amber-400",
  operator: "bg-purple-500/15 text-purple-400",
  quality: "bg-pink-500/15 text-pink-400",
  planned_maintenance: "bg-green-500/15 text-green-400",
  other: "bg-slate-500/15 text-slate-400",
};

const empty = { code: "", description: "", category: "mechanical", is_active: true };

export default function DowntimeReasonsPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const d = await base44.entities.DowntimeReason.list("code", 200);
    setRecords(d);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.DowntimeReason.update(editing.id, form);
    else await base44.entities.DowntimeReason.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r =>
    !search ||
    r.code?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Downtime Reasons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Reason codes used in station logs</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Reason
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Reason" : "New Downtime Reason"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Code *</label>
              <input value={form.code} onChange={e => set("code", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["mechanical","electrical","changeover","material","operator","quality","planned_maintenance","other"].map(c =>
                  <option key={c} value={c}>{c.replace(/_/g," ")}</option>)}
              </select></div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                Active
              </label>
            </div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Description *</label>
              <input value={form.description} onChange={e => set("description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reasons..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            {["Code","Description","Category","Active","Actions"].map(h =>
              <th key={h} className="px-4 py-3 text-left">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No downtime reasons found</td></tr>}
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono font-bold">{r.code}</td>
                <td className="px-4 py-3">{r.description}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${CATEGORY_COLORS[r.category]}`}>{r.category?.replace(/_/g," ")}</span></td>
                <td className="px-4 py-3"><span className={`text-xs font-medium ${r.is_active ? "text-green-400" : "text-muted-foreground"}`}>{r.is_active ? "Yes" : "No"}</span></td>
                <td className="px-4 py-3"><button onClick={() => { setEditing(r); setForm({...r}); setShowForm(true); }} className="text-xs text-primary hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}