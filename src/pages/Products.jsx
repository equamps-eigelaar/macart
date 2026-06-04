import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const empty = { product_code:"", name:"", description:"", type:"box", flute_profile:"", print_type:"none", length_mm:"", width_mm:"", height_mm:"", status:"active" };

export default function Products() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.Product.list(); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (editing) await base44.entities.Product.update(editing.id, form);
    else await base44.entities.Product.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.product_code?.toLowerCase().includes(search.toLowerCase()) || r.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-sm text-muted-foreground mt-0.5">{records.length} products</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Product" : "New Product"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Code *",k:"product_code"},{l:"Name *",k:"name"},{l:"Flute Profile",k:"flute_profile"},{l:"Length mm",k:"length_mm",t:"number"},{l:"Width mm",k:"width_mm",t:"number"},{l:"Height mm",k:"height_mm",t:"number"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["box","divider","pad","sheet","other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Print Type</label>
              <select value={form.print_type} onChange={e => set("print_type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["none","flexo_1c","flexo_2c","flexo_4c"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["active","inactive","development"].map(s => <option key={s} value={s}>{s}</option>)}
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Code","Name","Type","Flute","L×W×H mm","Print","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No products found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.product_code}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 capitalize">{r.type}</td>
                  <td className="px-4 py-3">{r.flute_profile || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.length_mm && r.width_mm ? `${r.length_mm}×${r.width_mm}×${r.height_mm||"?"}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.print_type?.replace("_"," ")}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.status==="active" ? "bg-green-500/15 text-green-400" : "bg-slate-500/15 text-slate-400"}`}>{r.status}</span></td>
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