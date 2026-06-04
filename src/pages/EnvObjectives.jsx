import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";

const STATUS_COLORS = { on_track:"bg-green-500/15 text-green-400", at_risk:"bg-amber-500/15 text-amber-400", behind:"bg-red-500/15 text-red-400", achieved:"bg-blue-500/15 text-blue-400" };
const empty = { objective_id:"", title:"", description:"", target_value:"", current_value:"", unit:"", target_date:"", status:"on_track", owner:"", measurement_frequency:"monthly" };

export default function EnvObjectives() {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.EnvObjective.list(); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.EnvObjective.update(editing.id, form);
    else await base44.entities.EnvObjective.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const progress = (obj) => {
    if (!obj.target_value || !obj.current_value) return 0;
    return Math.min(100, (+obj.current_value / +obj.target_value) * 100);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Environmental Objectives</h1><p className="text-sm text-muted-foreground mt-0.5">ISO 14001 — Objectives & Targets</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Objective
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Objective" : "New Objective"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Objective ID *",k:"objective_id"},{l:"Title *",k:"title"},{l:"Owner",k:"owner"},{l:"Target Value *",k:"target_value",t:"number"},{l:"Current Value",k:"current_value",t:"number"},{l:"Unit",k:"unit"},{l:"Target Date *",k:"target_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, f.t==="number"?e.target.value:e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["on_track","at_risk","behind","achieved"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Measurement Frequency</label>
              <select value={form.measurement_frequency} onChange={e => set("measurement_frequency", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["weekly","monthly","quarterly","annually"].map(f => <option key={f} value={f}>{f}</option>)}
              </select></div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.length === 0 && <p className="text-muted-foreground text-sm col-span-2 text-center py-12">No objectives defined</p>}
        {records.map(obj => {
          const pct = progress(obj);
          return (
            <div key={obj.id} className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => { setEditing(obj); setForm({...obj}); setShowForm(true); }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{obj.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{obj.objective_id} · {obj.owner || "No owner"} · Due {obj.target_date}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[obj.status]}`}>{obj.status?.replace("_"," ")}</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${obj.status === "achieved" ? "bg-blue-400" : pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-mono font-bold text-foreground">{pct.toFixed(0)}%</span>
              </div>
              <div className="text-xs text-muted-foreground">{obj.current_value ?? "—"} / {obj.target_value} {obj.unit} · {obj.measurement_frequency}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}