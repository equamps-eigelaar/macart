import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const empty = { aspect_id:"", activity:"", aspect:"", impact:"", significance_score:0, is_significant:false, controls:"", legal_requirement:"", station:"", review_date:"" };

export default function EnvAspects() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.EnvAspect.list("-created_date", 200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.EnvAspect.update(editing.id, form);
    else await base44.entities.EnvAspect.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.activity?.toLowerCase().includes(search.toLowerCase()) || r.aspect?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Environmental Aspects</h1><p className="text-sm text-muted-foreground mt-0.5">ISO 14001 — Aspects & Impacts Register</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Aspect
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Aspect" : "New Environmental Aspect"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Aspect ID *",k:"aspect_id"},{l:"Activity *",k:"activity"},{l:"Aspect *",k:"aspect"},{l:"Impact *",k:"impact"},{l:"Station",k:"station"},{l:"Significance Score",k:"significance_score",t:"number"},{l:"Legal Requirement",k:"legal_requirement"},{l:"Review Date",k:"review_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t || "text"} value={form[f.k]} onChange={e => set(f.k, f.t==="number" ? +e.target.value : e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div className="flex items-center gap-3 mt-5">
              <input type="checkbox" checked={form.is_significant} onChange={e => set("is_significant", e.target.checked)} className="w-4 h-4 accent-primary" />
              <label className="text-sm">Significant Aspect</label>
            </div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Controls</label>
              <textarea rows={2} value={form.controls} onChange={e => set("controls", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search aspects..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["ID","Activity","Aspect","Impact","Score","Significant","Controls","Review"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No aspects recorded</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => { setEditing(r); setForm({...r}); setShowForm(true); }}>
                  <td className="px-4 py-3 font-mono">{r.aspect_id}</td>
                  <td className="px-4 py-3">{r.activity}</td>
                  <td className="px-4 py-3">{r.aspect}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.impact}</td>
                  <td className="px-4 py-3 font-mono font-bold">{r.significance_score}</td>
                  <td className="px-4 py-3">{r.is_significant ? <span className="text-amber-400 font-medium">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{r.controls || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.review_date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}