import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { current:"bg-green-500/15 text-green-400", expiring_soon:"bg-amber-500/15 text-amber-400", expired:"bg-red-500/15 text-red-400", not_trained:"bg-slate-500/15 text-slate-400" };
const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand","warehouse","office","general"];
const empty = { employee_name:"", station:"press", competency:"", training_date: format(new Date(),"yyyy-MM-dd"), expiry_date:"", trainer:"", status:"current", certificate_ref:"", notes:"" };

export default function TrainingRecordsPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.TrainingRecord.list("-training_date",200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (editing) await base44.entities.TrainingRecord.update(editing.id, form);
    else await base44.entities.TrainingRecord.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.employee_name?.toLowerCase().includes(search.toLowerCase()) || r.competency?.toLowerCase().includes(search.toLowerCase()));
  const expired = records.filter(r => r.status === "expired" || r.status === "expiring_soon");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Training Records</h1><p className="text-sm text-muted-foreground mt-0.5">{records.length} records</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {expired.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div><p className="text-sm font-medium text-amber-400">Attention: {expired.length} expired or expiring records</p>
            <p className="text-xs text-muted-foreground mt-0.5">{expired.slice(0,3).map(r => `${r.employee_name} – ${r.competency}`).join(" · ")}</p></div>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Record" : "New Training Record"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Employee Name *",k:"employee_name"},{l:"Competency *",k:"competency"},{l:"Trainer",k:"trainer"},{l:"Certificate Ref",k:"certificate_ref"},{l:"Training Date *",k:"training_date",t:"date"},{l:"Expiry Date",k:"expiry_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Station</label>
              <select value={form.station} onChange={e => set("station", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {STATIONS.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["current","expiring_soon","expired","not_trained"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or competency..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Employee","Station","Competency","Trainer","Trained","Expires","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No training records found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">{r.employee_name}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{r.station?.replace("_"," ")}</td>
                  <td className="px-4 py-3">{r.competency}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.trainer || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.training_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.expiry_date || "—"}</td>
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