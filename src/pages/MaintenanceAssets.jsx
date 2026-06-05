import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Wrench } from "lucide-react";

const STATUS_COLORS = {
  operational: "bg-green-500/15 text-green-400",
  under_maintenance: "bg-amber-500/15 text-amber-400",
  out_of_service: "bg-red-500/15 text-red-400",
  retired: "bg-slate-500/15 text-slate-400",
};

const CATEGORY_COLORS = {
  machine: "bg-blue-500/15 text-blue-400",
  vehicle: "bg-purple-500/15 text-purple-400",
  tool: "bg-amber-500/15 text-amber-400",
  electrical: "bg-yellow-500/15 text-yellow-400",
  plumbing: "bg-cyan-500/15 text-cyan-400",
  hvac: "bg-teal-500/15 text-teal-400",
  other: "bg-slate-500/15 text-slate-400",
};

const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand","warehouse","office","general"];
const CATEGORIES = ["machine","vehicle","tool","electrical","plumbing","hvac","other"];

const empty = {
  asset_code: "", name: "", category: "machine", station: "",
  manufacturer: "", model: "", serial_number: "", install_date: "", status: "operational", notes: ""
};

export default function MaintenanceAssets() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const d = await base44.entities.MaintenanceAsset.list("asset_code", 200);
    setRecords(d);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.MaintenanceAsset.update(editing.id, form);
    else await base44.entities.MaintenanceAsset.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => {
    const ms = !search || r.asset_code?.toLowerCase().includes(search.toLowerCase()) || r.name?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || r.status === statusFilter;
    return ms && mst;
  });

  const stats = {
    total: records.length,
    operational: records.filter(r => r.status === "operational").length,
    under_maintenance: records.filter(r => r.status === "under_maintenance").length,
    out_of_service: records.filter(r => r.status === "out_of_service").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-6 h-6" /> Asset Register</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All maintainable assets and equipment</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Assets", value: stats.total, color: "text-foreground" },
          { label: "Operational", value: stats.operational, color: "text-green-400" },
          { label: "Under Maintenance", value: stats.under_maintenance, color: "text-amber-400" },
          { label: "Out of Service", value: stats.out_of_service, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Asset" : "New Asset"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Asset Code *</label>
              <input value={form.asset_code} onChange={e => set("asset_code", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Category *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Station</label>
              <select value={form.station} onChange={e => set("station", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— None —</option>
                {STATIONS.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["operational","under_maintenance","out_of_service","retired"].map(s =>
                  <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Install Date</label>
              <input type="date" value={form.install_date} onChange={e => set("install_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Manufacturer</label>
              <input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Model</label>
              <input value={form.model} onChange={e => set("model", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Serial Number</label>
              <input value={form.serial_number} onChange={e => set("serial_number", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div className="sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["operational","under_maintenance","out_of_service","retired"].map(s =>
            <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Code","Name","Category","Station","Manufacturer / Model","Status","Actions"].map(h =>
                <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No assets found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.asset_code}</td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${CATEGORY_COLORS[r.category]}`}>{r.category}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{r.station?.replace(/_/g," ") || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{[r.manufacturer, r.model].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status?.replace(/_/g," ")}</span></td>
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