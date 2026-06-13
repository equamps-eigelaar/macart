import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const RISK_BANDS = { low: { min:1, max:6, color:"bg-green-500/15 text-green-400", label:"Low" }, medium: { min:7, max:12, color:"bg-amber-500/15 text-amber-400", label:"Medium" }, high: { min:13, max:19, color:"bg-orange-500/15 text-orange-400", label:"High" }, critical: { min:20, max:25, color:"bg-red-500/15 text-red-400", label:"Critical" } };
const STATUS_COLORS = { identified:"bg-slate-500/15 text-slate-400", assessed:"bg-blue-500/15 text-blue-400", treated:"bg-amber-500/15 text-amber-400", monitored:"bg-cyan-500/15 text-cyan-400", closed:"bg-green-500/15 text-green-400" };

function getBand(score) {
  if (score<=6) return RISK_BANDS.low;
  if (score<=12) return RISK_BANDS.medium;
  if (score<=19) return RISK_BANDS.high;
  return RISK_BANDS.critical;
}

const empty = { ref_number:"", type:"risk", category:"quality", description:"", likelihood:1, impact:1, risk_score:1, mitigation:"", owner:"", status:"identified", review_date:"", notes:"" };

export default function RiskOpportunityPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => { const d = await base44.entities.RiskOpportunity.list("-review_date",200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => { const nf = {...form,[k]:v}; if(k==="likelihood"||k==="impact") nf.risk_score = nf.likelihood * nf.impact; setForm(nf); };

  const handleSave = async () => {
    if (editing) await base44.entities.RiskOpportunity.update(editing.id, form);
    else await base44.entities.RiskOpportunity.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => {
    const m = !search || r.ref_number?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()) || r.owner?.toLowerCase().includes(search.toLowerCase());
    const s = statusFilter==="all" || r.status===statusFilter;
    return m && s;
  });

  const risks = records.filter(r=>r.type==="risk");
  const opportunities = records.filter(r=>r.type==="opportunity");
  const openRisks = risks.filter(r=>r.status!=="closed");
  const highCritical = risks.filter(r=>getBand(r.risk_score||1)===RISK_BANDS.high||getBand(r.risk_score||1)===RISK_BANDS.critical);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Risk & Opportunity</h1><p className="text-sm text-muted-foreground mt-0.5">QMS risk register and opportunity tracking</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {l:"Total Risks",v:risks.length,icon:AlertTriangle,c:"text-amber-400"},
          {l:"High/Critical",v:highCritical.length,icon:AlertTriangle,c:"text-red-400"},
          {l:"Open Risks",v:openRisks.length,icon:AlertTriangle,c:"text-orange-400"},
          {l:"Opportunities",v:opportunities.length,icon:TrendingUp,c:"text-green-400"},
        ].map(s => (
          <div key={s.l} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2"><s.icon className={`w-4 h-4 ${s.c}`} /><span className={`text-2xl font-bold ${s.c}`}>{s.v}</span></div>
            <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Item" : "Add Risk / Opportunity"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Ref # *",k:"ref_number"},{l:"Owner",k:"owner"},{l:"Review Date",k:"review_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, f.t==="date"?e.target.value:e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e=>set("type",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="risk">Risk</option><option value="opportunity">Opportunity</option></select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select value={form.category} onChange={e=>set("category",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["quality","safety","environmental","business","operational","supply_chain"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e=>set("status",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["identified","assessed","treated","monitored","closed"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Description *</label>
            <textarea rows={2} value={form.description} onChange={e=>set("description",e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Likelihood (1-5)</label>
              <input type="number" min={1} max={5} value={form.likelihood} onChange={e=>set("likelihood",+e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Impact (1-5)</label>
              <input type="number" min={1} max={5} value={form.impact} onChange={e=>set("impact",+e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Risk Score</label>
              <div className={`px-3 py-2 rounded-lg text-sm font-bold ${getBand(form.risk_score).color}`}>{form.risk_score} — {getBand(form.risk_score).label}</div></div>
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Mitigation / Action Plan</label>
            <textarea rows={2} value={form.mitigation} onChange={e=>set("mitigation",e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e=>set("notes",e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          <div className="flex gap-3 justify-end">
            <button onClick={()=>setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all","identified","assessed","treated","monitored","closed"].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter===s?"bg-primary/20 text-primary":"bg-secondary text-muted-foreground hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Ref","Type","Category","Description","L","I","Score","Mitigation","Owner","Status","Actions"].map(h=><th key={h} className="px-3 py-3 text-left">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length===0 && <tr><td colSpan={11} className="text-center py-12 text-muted-foreground">No items found</td></tr>}
              {filtered.map(r=>{
                const band = getBand(r.risk_score||1);
                return (
                  <tr key={r.id} className="hover:bg-secondary/40">
                    <td className="px-3 py-3 font-mono font-bold text-xs">{r.ref_number}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.type==="risk"?"bg-amber-500/15 text-amber-400":"bg-green-500/15 text-green-400"}`}>{r.type}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{r.category}</td>
                    <td className="px-3 py-3 max-w-[200px] truncate">{r.description}</td>
                    <td className="px-3 py-3 font-mono text-xs">{r.likelihood}</td>
                    <td className="px-3 py-3 font-mono text-xs">{r.impact}</td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${band.color}`}>{r.risk_score}</span></td>
                    <td className="px-3 py-3 max-w-[180px] truncate text-xs text-muted-foreground">{r.mitigation||"—"}</td>
                    <td className="px-3 py-3 text-xs">{r.owner||"—"}</td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                    <td className="px-3 py-3"><button onClick={()=>{setEditing(r);setForm({...r});setShowForm(true)}} className="text-xs text-primary hover:underline">Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}