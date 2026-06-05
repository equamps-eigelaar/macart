import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";

const STATUS_COLORS = {
  open: "bg-red-500/15 text-red-400",
  under_review: "bg-amber-500/15 text-amber-400",
  resolved: "bg-blue-500/15 text-blue-400",
  closed: "bg-green-500/15 text-green-400",
};

const TYPES = ["dimensional","material","print","process","supplier","other"];

export default function NCRRegister() {
  const [ncrs, setNcrs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ncr_number: "", type: "process", description: "", detected_at: "", status: "open", disposition: "", raised_by: "", notes: "" });

  const load = async () => { const d = await base44.entities.NCR.list("-created_date", 200); setNcrs(d); };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.NCR.update(editing.id, form);
    else await base44.entities.NCR.create(form);
    setShowForm(false); setEditing(null); setForm({ ncr_number: "", type: "process", description: "", detected_at: "", status: "open", disposition: "", raised_by: "", notes: "" }); load();
  };

  const openEdit = (n) => { setEditing(n); setForm({ ...n }); setShowForm(true); };

  const filtered = ncrs.filter(n => {
    const ms = !search || n.ncr_number?.toLowerCase().includes(search.toLowerCase()) || n.description?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || n.status === statusFilter;
    return ms && mst;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">NCR Register</h1><p className="text-sm text-muted-foreground mt-0.5">{ncrs.length} total</p></div>
        <button onClick={() => { setEditing(null); setForm({ ncr_number: "", type: "process", description: "", detected_at: "", status: "open", disposition: "", raised_by: "", notes: "" }); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Raise NCR
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit NCR" : "New Non-Conformance Report"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { l: "NCR Number *", k: "ncr_number" },
              { l: "Raised By", k: "raised_by" },
              { l: "Detected At Station", k: "detected_at" },
            ].map(f => (
              <div key={f.k}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["open","under_review","resolved","closed"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Disposition</label>
              <select value={form.disposition} onChange={e => set("disposition", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— None —</option>
                {["rework","scrap","use_as_is","return_to_supplier"].map(d => <option key={d} value={d}>{d.replace(/_/g," ")}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Description *</label>
              <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search NCRs..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["open","under_review","resolved","closed"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">NCR #</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Station</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No NCRs found</td></tr>}
              {filtered.map(n => (
                <tr key={n.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-medium">{n.ncr_number}</td>
                  <td className="px-4 py-3 capitalize">{n.type}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{n.description}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{n.detected_at?.replace("_"," ") || "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[n.status]}`}>{n.status?.replace("_"," ")}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{n.created_date?.slice(0,10)}</td>
                  <td className="px-4 py-3"><button onClick={() => openEdit(n)} className="text-xs text-primary hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}