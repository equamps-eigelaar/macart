import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { reported:"bg-red-500/15 text-red-400", investigating:"bg-amber-500/15 text-amber-400", closed:"bg-green-500/15 text-green-400" };
const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand","warehouse","office","general"];
const empty = { incident_number:"", type:"near_miss", station:"press", incident_date: format(new Date(),"yyyy-MM-dd'T'HH:mm"), description:"", injured_person:"", body_part:"", lost_time_days:0, status:"reported", reported_by:"", investigated_by:"" };

export default function IncidentLog() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.Incident.list("-incident_date", 200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.Incident.update(editing.id, form);
    else await base44.entities.Incident.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.incident_number?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Incident Log</h1><p className="text-sm text-muted-foreground mt-0.5">{records.length} records</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Report Incident
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Incident" : "Report New Incident"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Incident # *</label>
              <input value={form.incident_number} onChange={e => set("incident_number", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["injury","near_miss","property_damage","environmental","other"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Station</label>
              <select value={form.station} onChange={e => set("station", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {STATIONS.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Date & Time</label>
              <input type="datetime-local" value={form.incident_date} onChange={e => set("incident_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Reported By</label>
              <input value={form.reported_by} onChange={e => set("reported_by", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["reported","investigating","closed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Injured Person</label>
              <input value={form.injured_person} onChange={e => set("injured_person", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Body Part</label>
              <input value={form.body_part} onChange={e => set("body_part", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Lost Time (days)</label>
              <input type="number" min={0} value={form.lost_time_days} onChange={e => set("lost_time_days", +e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Description *</label>
              <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)}
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Incident #","Type","Station","Date/Time","Description","Lost Days","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No incidents recorded</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-medium">{r.incident_number}</td>
                  <td className="px-4 py-3 capitalize">{r.type?.replace("_"," ")}</td>
                  <td className="px-4 py-3 capitalize">{r.station?.replace("_"," ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.incident_date?.slice(0,16)}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{r.description}</td>
                  <td className="px-4 py-3 text-center">{r.lost_time_days || 0}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
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