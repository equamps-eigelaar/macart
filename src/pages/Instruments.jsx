import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const STATUS_COLORS = { in_service:"bg-green-500/15 text-green-400", out_of_service:"bg-red-500/15 text-red-400", calibrating:"bg-amber-500/15 text-amber-400", retired:"bg-slate-500/15 text-slate-400" };
const empty = { instrument_id:"", name:"", type:"", manufacturer:"", model:"", serial_number:"", location:"", calibration_frequency_days:365, last_calibration_date:"", next_calibration_date:"", status:"in_service", notes:"" };

export default function Instruments() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.Instrument.list(); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (editing) await base44.entities.Instrument.update(editing.id, form);
    else await base44.entities.Instrument.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.instrument_id?.toLowerCase().includes(search.toLowerCase()));
  const today = new Date().toISOString().slice(0,10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Instruments</h1><p className="text-sm text-muted-foreground mt-0.5">{records.length} instruments</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Instrument
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Instrument" : "New Instrument"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Instrument ID *",k:"instrument_id"},{l:"Name *",k:"name"},{l:"Type *",k:"type"},{l:"Manufacturer",k:"manufacturer"},{l:"Model",k:"model"},{l:"Serial Number",k:"serial_number"},{l:"Location",k:"location"},{l:"Cal. Frequency (days)",k:"calibration_frequency_days",t:"number"},{l:"Last Calibration",k:"last_calibration_date",t:"date"},{l:"Next Due",k:"next_calibration_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, f.t==="number"?+e.target.value:e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["in_service","out_of_service","calibrating","retired"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search instruments..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["ID","Name","Type","Location","Last Cal","Next Due","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No instruments found</td></tr>}
              {filtered.map(r => {
                const overdue = r.next_calibration_date && r.next_calibration_date < today;
                return (
                  <tr key={r.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-mono">{r.instrument_id}</td>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.location || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.last_calibration_date || "—"}</td>
                    <td className={`px-4 py-3 font-medium ${overdue ? "text-red-400" : "text-foreground"}`}>{r.next_calibration_date || "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status?.replace("_"," ")}</span></td>
                    <td className="px-4 py-3"><button onClick={() => { setEditing(r); setForm({...r}); setShowForm(true); }} className="text-xs text-primary hover:underline">Edit</button></td>
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