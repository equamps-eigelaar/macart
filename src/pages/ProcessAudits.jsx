import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const RESULT_COLORS = {
  compliant: "bg-green-500/15 text-green-400",
  non_compliant: "bg-red-500/15 text-red-400",
  observation: "bg-amber-500/15 text-amber-400",
};
const STATUS_COLORS = {
  open: "bg-amber-500/15 text-amber-400",
  closed: "bg-green-500/15 text-green-400",
};

const empty = {
  ref_number: "", process_name: "", station: "press", procedure_ref: "",
  audit_date: format(new Date(), "yyyy-MM-dd"), auditor: "",
  result: "compliant", findings: "", action_required: "", status: "open", notes: ""
};

export default function ProcessAudits() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [filterStation, setFilterStation] = useState("all");

  const load = async () => {
    const d = await base44.entities.ProcessAudit.list("-audit_date", 200);
    setRecords(d);
  };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.ProcessAudit.update(editing.id, form);
    else await base44.entities.ProcessAudit.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const stations = ["all", "press", "cut_1", "cut_2", "cut_3", "de_form", "glue_machine", "glue_hand", "warehouse", "office", "general"];

  const filtered = records.filter(r => {
    const stationMatch = filterStation === "all" || r.station === filterStation;
    const searchMatch = !search || r.ref_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.process_name?.toLowerCase().includes(search.toLowerCase()) || r.auditor?.toLowerCase().includes(search.toLowerCase());
    return stationMatch && searchMatch;
  });

  const compliantCount = records.filter(r => r.result === "compliant").length;
  const ncCount = records.filter(r => r.result === "non_compliant" && r.status === "open").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Process Compliance Audits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Verify procedures are followed on the shop floor</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Audit
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Total Audits</div>
          <div className="text-2xl font-bold mt-1">{records.length}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-green-400"><CheckCircle2 className="w-4 h-4" /> Compliant</div>
          <div className="text-2xl font-bold mt-1">{compliantCount}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-red-400"><AlertTriangle className="w-4 h-4" /> Open NCs</div>
          <div className="text-2xl font-bold mt-1">{ncCount}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Compliance Rate</div>
          <div className="text-2xl font-bold mt-1">{records.length ? Math.round((compliantCount / records.length) * 100) : 0}%</div>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Audit" : "New Process Audit"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { l: "Ref Number *", k: "ref_number" },
              { l: "Process Name *", k: "process_name" },
              { l: "Procedure Ref", k: "procedure_ref" },
              { l: "Audit Date *", k: "audit_date", t: "date" },
              { l: "Auditor", k: "auditor" },
            ].map(f => (
              <div key={f.k}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t || "text"} value={form[f.k]} onChange={e => set(f.k, f.t === "number" ? +e.target.value : e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Station</label>
              <select value={form.station} onChange={e => set("station", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {stations.filter(s => s !== "all").map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Result *</label>
              <select value={form.result} onChange={e => set("result", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["compliant", "non_compliant", "observation"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["open", "closed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Findings</label>
              <textarea rows={2} value={form.findings} onChange={e => set("findings", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Action Required</label>
              <textarea rows={2} value={form.action_required} onChange={e => set("action_required", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="sm:col-span-3">
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

      <div className="flex gap-3 items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search audits..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={filterStation} onChange={e => setFilterStation(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          {stations.map(s => <option key={s} value={s}>{s === "all" ? "All Stations" : s}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                {["Ref", "Process", "Station", "Date", "Result", "Status", "Auditor", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No audits found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold text-xs">{r.ref_number}</td>
                  <td className="px-4 py-3 text-xs max-w-[180px] truncate">{r.process_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.station}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.audit_date}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${RESULT_COLORS[r.result]}`}>{r.result}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.auditor || "—"}</td>
                  <td className="px-4 py-3"><button onClick={() => { setEditing(r); setForm({ ...r }); setShowForm(true); }} className="text-xs text-primary hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}