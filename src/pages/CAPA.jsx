import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const STATUS_COLORS = { open: "bg-red-500/15 text-red-400", in_progress: "bg-amber-500/15 text-amber-400", verify: "bg-blue-500/15 text-blue-400", closed: "bg-green-500/15 text-green-400", overdue: "bg-rose-500/15 text-rose-400" };
const empty = { capa_number:"", title:"", type:"corrective", root_cause_method:"5_why", root_cause_description:"", action_description:"", owner:"", due_date:"", status:"open", notes:"" };

export default function CAPATracker() {
  const [capas, setCapas] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = async () => { const d = await base44.entities.CAPA.list("-created_date", 200); setCapas(d); };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.CAPA.update(editing.id, form);
    else await base44.entities.CAPA.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = capas.filter(c => {
    const ms = !search || c.capa_number?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || c.status === statusFilter;
    return ms && mst;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">CAPA Tracker</h1><p className="text-sm text-muted-foreground mt-0.5">{capas.length} records</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New CAPA
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit CAPA" : "New CAPA"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[{ l:"CAPA Number *",k:"capa_number"},{l:"Title *",k:"title"},{l:"Owner *",k:"owner"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="corrective">Corrective</option><option value="preventive">Preventive</option>
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Root Cause Method</label>
              <select value={form.root_cause_method} onChange={e => set("root_cause_method", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["5_why","fishbone","fault_tree","other"].map(m => <option key={m} value={m}>{m.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Due Date *</label>
              <input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["open","in_progress","verify","closed","overdue"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Root Cause Description</label>
              <textarea rows={2} value={form.root_cause_description} onChange={e => set("root_cause_description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Action Description</label>
              <textarea rows={2} value={form.action_description} onChange={e => set("action_description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search CAPAs..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["open","in_progress","verify","closed","overdue"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                {["CAPA #","Title","Type","Owner","Due Date","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No CAPAs found</td></tr>}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-medium">{c.capa_number}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{c.title}</td>
                  <td className="px-4 py-3 capitalize">{c.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.owner}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.due_date}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[c.status]}`}>{c.status?.replace("_"," ")}</span></td>
                  <td className="px-4 py-3"><button onClick={() => { setEditing(c); setForm({...c}); setShowForm(true); }} className="text-xs text-primary hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}