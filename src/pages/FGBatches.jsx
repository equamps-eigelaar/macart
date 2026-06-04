import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { quarantine:"bg-amber-500/15 text-amber-400", released:"bg-green-500/15 text-green-400", hold:"bg-orange-500/15 text-orange-400", dispatched:"bg-blue-500/15 text-blue-400", rejected:"bg-red-500/15 text-red-400" };
const empty = { batch_id:"", work_order_id:"", product_id:"", qty_produced:"", qty_available:"", production_date: format(new Date(),"yyyy-MM-dd"), status:"quarantine", notes:"" };

export default function FGBatches() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.FGBatch.list("-production_date",200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (editing) await base44.entities.FGBatch.update(editing.id, form);
    else await base44.entities.FGBatch.create({ ...form, qty_available: form.qty_available || form.qty_produced });
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.batch_id?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">FG Batches</h1><p className="text-sm text-muted-foreground mt-0.5">Finished goods batch traceability</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New FG Batch
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Batch" : "New FG Batch"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Batch ID *",k:"batch_id"},{l:"Work Order ID",k:"work_order_id"},{l:"Product ID",k:"product_id"},{l:"Qty Produced",k:"qty_produced",t:"number"},{l:"Qty Available",k:"qty_available",t:"number"},{l:"Production Date",k:"production_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, f.t==="number"?+e.target.value:e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["quarantine","released","hold","dispatched","rejected"].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search FG batches..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Batch ID","WO","Product","Prod Date","Qty Produced","Qty Available","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No FG batches found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.batch_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.work_order_id?.slice(0,8) || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.product_id?.slice(0,8) || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.production_date}</td>
                  <td className="px-4 py-3 font-mono">{r.qty_produced?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{r.qty_available?.toLocaleString()}</td>
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