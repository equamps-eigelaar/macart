import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const STATUS_COLORS = { approved:"bg-green-500/15 text-green-400", pending:"bg-amber-500/15 text-amber-400", conditional:"bg-blue-500/15 text-blue-400", suspended:"bg-red-500/15 text-red-400", removed:"bg-slate-500/15 text-slate-400" };
const empty = { supplier_code:"", name:"", contact_name:"", email:"", phone:"", address:"", approval_status:"pending", notes:"" };

export default function Suppliers() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.Supplier.list(); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (editing) await base44.entities.Supplier.update(editing.id, form);
    else await base44.entities.Supplier.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.supplier_code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Suppliers</h1><p className="text-sm text-muted-foreground mt-0.5">{records.length} suppliers</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Supplier
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Supplier" : "New Supplier"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Supplier Code *",k:"supplier_code"},{l:"Name *",k:"name"},{l:"Contact Name",k:"contact_name"},{l:"Email",k:"email"},{l:"Phone",k:"phone"},{l:"Address",k:"address"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Approval Status</label>
              <select value={form.approval_status} onChange={e => set("approval_status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["pending","approved","conditional","suspended","removed"].map(s => <option key={s} value={s}>{s}</option>)}
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Code","Name","Contact","Email","Phone","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center">
                  {records.length === 0 ? (
                    <div>
                      <div className="font-medium text-foreground mb-1">No suppliers yet</div>
                      <div className="text-sm text-muted-foreground">Add a supplier first — incoming raw material batches are linked to a supplier for traceability.</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No suppliers match your search</span>
                  )}
                </td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.supplier_code}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.contact_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.phone || "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.approval_status]}`}>{r.approval_status}</span></td>
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