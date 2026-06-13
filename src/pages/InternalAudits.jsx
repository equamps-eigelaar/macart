import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { planned:"bg-blue-500/15 text-blue-400", in_progress:"bg-amber-500/15 text-amber-400", reporting:"bg-purple-500/15 text-purple-400", completed:"bg-green-500/15 text-green-400", closed:"bg-slate-500/15 text-slate-400" };
const TYPE_COLORS = { internal:"bg-cyan-500/15 text-cyan-400", external:"bg-orange-500/15 text-orange-400", supplier:"bg-violet-500/15 text-violet-400", regulatory:"bg-red-500/15 text-red-400" };

const empty = { audit_number:"", audit_type:"internal", standard:"ISO 9001", scope:"", lead_auditor:"", auditee:"", planned_date: format(new Date(),"yyyy-MM-dd"), actual_date:"", status:"planned", findings_total:0, non_conformities:0, observations:0, notes:"" };

export default function InternalAudits() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.InternalAudit.list("-planned_date",200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleSave = async () => {
    if (editing) await base44.entities.InternalAudit.update(editing.id, form);
    else await base44.entities.InternalAudit.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => !search || r.audit_number?.toLowerCase().includes(search.toLowerCase()) || r.scope?.toLowerCase().includes(search.toLowerCase()) || r.auditee?.toLowerCase().includes(search.toLowerCase()));

  const stats = { total: records.length, planned: records.filter(r=>r.status==="planned").length, inProgress: records.filter(r=>r.status==="in_progress").length, completed: records.filter(r=>r.status==="completed"||r.status==="closed").length };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Internal Audit</h1><p className="text-sm text-muted-foreground mt-0.5">ISO audit schedule and findings</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Audit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{l:"Total",v:stats.total,c:"text-foreground"},{l:"Planned",v:stats.planned,c:"text-blue-400"},{l:"In Progress",v:stats.inProgress,c:"text-amber-400"},{l:"Completed",v:stats.completed,c:"text-green-400"}].map(s => (
          <div key={s.l} className="bg-card border border-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Audit" : "Schedule Audit"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Audit # *",k:"audit_number"},{l:"Scope",k:"scope"},{l:"Lead Auditor",k:"lead_auditor"},{l:"Auditee",k:"auditee"},{l:"Planned Date",k:"planned_date",t:"date"},{l:"Actual Date",k:"actual_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, f.t==="date"?e.target.value:e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Audit Type</label>
              <select value={form.audit_type} onChange={e=>set("audit_type",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["internal","external","supplier","regulatory"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Standard</label>
              <select value={form.standard} onChange={e=>set("standard",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["ISO 9001","ISO 14001","ISO 45001","FSSC 22000","ISO 50001","Integrated"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e=>set("status",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["planned","in_progress","reporting","completed","closed"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[{l:"Total Findings",k:"findings_total",t:"number"},{l:"Non-Conformities",k:"non_conformities",t:"number"},{l:"Observations",k:"observations",t:"number"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type="number" value={form[f.k]} onChange={e=>set(f.k,+e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e=>set("notes",e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          <div className="flex gap-3 justify-end">
            <button onClick={()=>setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search audits..." className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Audit #","Type","Standard","Scope","Lead Auditor","Auditee","Planned","Actual","Status","Findings","Actions"].map(h=><th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length===0 && <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">No audits found</td></tr>}
              {filtered.map(r=>(
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.audit_number}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${TYPE_COLORS[r.audit_type]}`}>{r.audit_type}</span></td>
                  <td className="px-4 py-3 text-xs">{r.standard}</td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground">{r.scope||"—"}</td>
                  <td className="px-4 py-3">{r.lead_auditor||"—"}</td>
                  <td className="px-4 py-3">{r.auditee||"—"}</td>
                  <td className="px-4 py-3 text-xs">{r.planned_date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.actual_date||"—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{r.findings_total||0} / {r.non_conformities||0} NC</td>
                  <td className="px-4 py-3"><button onClick={()=>{setEditing(r);setForm({...r});setShowForm(true)}} className="text-xs text-primary hover:underline">Edit</button></td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}