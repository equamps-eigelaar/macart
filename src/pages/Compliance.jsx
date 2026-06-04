import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const STATUS_COLORS = { compliant:"bg-green-500/15 text-green-400", in_progress:"bg-amber-500/15 text-amber-400", non_compliant:"bg-red-500/15 text-red-400", not_applicable:"bg-slate-500/15 text-slate-400" };
const empty = { clause_id:"", standard:"ISO 9001:2015", title:"", description:"", status:"in_progress", evidence:"", owner:"", target_date:"", notes:"" };

export default function CompliancePage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [standardFilter, setStandardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.ComplianceItem.list("-created_date", 500); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.ComplianceItem.update(editing.id, form);
    else await base44.entities.ComplianceItem.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const standards = [...new Set(records.map(r => r.standard).filter(Boolean))];
  const filtered = records.filter(r => {
    const ms = !search || r.clause_id?.toLowerCase().includes(search.toLowerCase()) || r.title?.toLowerCase().includes(search.toLowerCase());
    const mst = standardFilter === "all" || r.standard === standardFilter;
    const mss = statusFilter === "all" || r.status === statusFilter;
    return ms && mst && mss;
  });

  const stats = {
    compliant: records.filter(r => r.status === "compliant").length,
    in_progress: records.filter(r => r.status === "in_progress").length,
    non_compliant: records.filter(r => r.status === "non_compliant").length,
    total: records.filter(r => r.status !== "not_applicable").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">IMS Compliance</h1><p className="text-sm text-muted-foreground mt-0.5">ISO 9001 · ISO 14001 · ISO 45001</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Summary bars */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Compliant", count: stats.compliant, color: "bg-green-400", textColor: "text-green-400" },
          { label: "In Progress", count: stats.in_progress, color: "bg-amber-400", textColor: "text-amber-400" },
          { label: "Non-Compliant", count: stats.non_compliant, color: "bg-red-400", textColor: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.textColor}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            <div className="mt-2 bg-secondary rounded-full h-1.5">
              <div className={`${s.color} h-1.5 rounded-full`} style={{ width: stats.total ? `${(s.count/stats.total)*100}%` : 0 }} />
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Compliance Item" : "New Compliance Item"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Clause ID *",k:"clause_id"},{l:"Title *",k:"title"},{l:"Owner",k:"owner"},{l:"Target Date",k:"target_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Standard</label>
              <select value={form.standard} onChange={e => set("standard", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["ISO 9001:2015","ISO 14001:2015","ISO 45001:2018"].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["compliant","in_progress","non_compliant","not_applicable"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select></div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Evidence / Notes</label>
              <textarea rows={2} value={form.evidence || form.notes} onChange={e => set("evidence", e.target.value)}
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clauses..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Standards</option>
          {standards.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["compliant","in_progress","non_compliant","not_applicable"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Clause","Standard","Title","Owner","Target","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No compliance items found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.clause_id}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.standard}</td>
                  <td className="px-4 py-3 max-w-xs">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.owner || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.target_date || "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status?.replace("_"," ")}</span></td>
                  <td className="px-4 py-3"><button onClick={() => { setEditing(r); setForm({...r}); setShowForm(true); }} className="text-xs text-primary hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}