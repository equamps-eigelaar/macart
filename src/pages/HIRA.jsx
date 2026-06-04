import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand","warehouse","office","general"];
const RISK_COLORS = { low:"bg-green-500/15 text-green-400", medium:"bg-amber-500/15 text-amber-400", high:"bg-orange-500/15 text-orange-400", critical:"bg-red-500/15 text-red-400" };
const empty = { hira_id:"", station:"press", hazard_description:"", potential_harm:"", likelihood_before:3, severity_before:3, risk_score_before:9, controls:"", likelihood_after:2, severity_after:2, risk_score_after:4, risk_level:"medium", responsible:"", review_date:"" };

export default function HIRARegister() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.HIRA.list("-created_date", 200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => {
    const upd = { ...p, [k]: v };
    upd.risk_score_before = (upd.likelihood_before || 1) * (upd.severity_before || 1);
    upd.risk_score_after = (upd.likelihood_after || 1) * (upd.severity_after || 1);
    const score = upd.risk_score_after;
    upd.risk_level = score <= 4 ? "low" : score <= 9 ? "medium" : score <= 16 ? "high" : "critical";
    return upd;
  });

  const handleSave = async () => {
    if (editing) await base44.entities.HIRA.update(editing.id, form);
    else await base44.entities.HIRA.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.hazard_description?.toLowerCase().includes(search.toLowerCase()) || r.station?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">HIRA Register</h1><p className="text-sm text-muted-foreground mt-0.5">Hazard Identification & Risk Assessment</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Hazard
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Hazard" : "New Hazard"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">HIRA ID *</label>
              <input value={form.hira_id} onChange={e => set("hira_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Station</label>
              <select value={form.station} onChange={e => set("station", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {STATIONS.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Responsible</label>
              <input value={form.responsible} onChange={e => set("responsible", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Review Date</label>
              <input type="date" value={form.review_date} onChange={e => set("review_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Hazard Description *</label>
              <textarea rows={2} value={form.hazard_description} onChange={e => set("hazard_description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Potential Harm</label>
              <textarea rows={2} value={form.potential_harm} onChange={e => set("potential_harm", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            {[["likelihood_before","Likelihood (Before)",1,5],["severity_before","Severity (Before)",1,5],["likelihood_after","Likelihood (After)",1,5],["severity_after","Severity (After)",1,5]].map(([k,l,min,max]) => (
              <div key={k}><label className="text-xs text-muted-foreground mb-1 block">{l} (1–5)</label>
                <input type="number" min={min} max={max} value={form[k]} onChange={e => set(k, +e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div className="sm:col-span-4"><label className="text-xs text-muted-foreground mb-1 block">Controls</label>
              <textarea rows={2} value={form.controls} onChange={e => set("controls", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="bg-secondary rounded-lg px-4 py-2 text-sm flex gap-6">
            <span className="text-muted-foreground">Before: <b>{form.risk_score_before}</b></span>
            <span className="text-muted-foreground">After: <b>{form.risk_score_after}</b></span>
            <span className={`font-bold capitalize ${RISK_COLORS[form.risk_level]?.split(" ")[1]}`}>Risk: {form.risk_level}</span>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hazards..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["ID","Station","Hazard","Harm","Before","After","Risk Level","Responsible"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No hazards recorded</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => { setEditing(r); setForm({...r}); setShowForm(true); }}>
                  <td className="px-4 py-3 font-mono">{r.hira_id}</td>
                  <td className="px-4 py-3 capitalize">{r.station?.replace("_"," ")}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.hazard_description}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{r.potential_harm}</td>
                  <td className="px-4 py-3 font-mono font-bold">{r.risk_score_before}</td>
                  <td className="px-4 py-3 font-mono font-bold">{r.risk_score_after}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${RISK_COLORS[r.risk_level]}`}>{r.risk_level}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.responsible || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}