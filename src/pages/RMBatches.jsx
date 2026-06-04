import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { quarantine:"bg-amber-500/15 text-amber-400", released:"bg-green-500/15 text-green-400", hold:"bg-orange-500/15 text-orange-400", consumed:"bg-slate-500/15 text-slate-400", rejected:"bg-red-500/15 text-red-400" };
const empty = { batch_id:"", raw_material_id:"", supplier_id:"", supplier_lot_ref:"", received_date: format(new Date(),"yyyy-MM-dd"), qty_received:"", qty_remaining:"", unit:"sheets", status:"quarantine", storage_location:"", notes:"" };

export default function RMBatches() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.RMBatch.list("-received_date",200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (editing) await base44.entities.RMBatch.update(editing.id, form);
    else await base44.entities.RMBatch.create({ ...form, qty_remaining: form.qty_remaining || form.qty_received });
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.batch_id?.toLowerCase().includes(search.toLowerCase()) || r.supplier_lot_ref?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">RM Batches</h1><p className="text-sm text-muted-foreground mt-0.5">Raw material batch tracking</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Receive Batch
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Batch" : "Receive New Batch"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Batch ID *",k:"batch_id"},{l:"Supplier Lot Ref",k:"supplier_lot_ref"},{l:"Received Date",k:"received_date",t:"date"},{l:"Qty Received",k:"qty_received",t:"number"},{l:"Qty Remaining",k:"qty_remaining",t:"number"},{l:"Unit",k:"unit"},{l:"Storage Location",k:"storage_location"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, f.t==="number"?+e.target.value:e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["quarantine","released","hold","consumed","rejected"].map(s => <option key={s} value={s}>{s}</option>)}
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Batch ID","Lot Ref","Received","Qty Recv","Qty Rem","Unit","Location","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No batches found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.batch_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.supplier_lot_ref || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.received_date}</td>
                  <td className="px-4 py-3 font-mono">{r.qty_received?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{r.qty_remaining?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.unit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.storage_location || "—"}</td>
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