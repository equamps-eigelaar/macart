import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Upload, FileText, X } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { draft:"bg-amber-500/15 text-amber-400", review:"bg-blue-500/15 text-blue-400", approved:"bg-green-500/15 text-green-400", obsolete:"bg-slate-500/15 text-slate-400" };
const TYPE_COLORS = { policy:"bg-purple-500/15 text-purple-400", procedure:"bg-blue-500/15 text-blue-400", work_instruction:"bg-cyan-500/15 text-cyan-400", form:"bg-orange-500/15 text-orange-400", record:"bg-slate-500/15 text-slate-400", specification:"bg-emerald-500/15 text-emerald-400", manual:"bg-violet-500/15 text-violet-400" };

const empty = { doc_number:"", title:"", doc_type:"procedure", version:"1.0", status:"draft", effective_date:"", review_date:"", owner:"", department:"production", clause_ref:"", file_url:"", notes:"" };

export default function Documents() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => { const d = await base44.entities.Document.list("-effective_date",200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("file_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (editing) await base44.entities.Document.update(editing.id, form);
    else await base44.entities.Document.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = records.filter(r => {
    const m = !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.doc_number?.toLowerCase().includes(search.toLowerCase()) || r.owner?.toLowerCase().includes(search.toLowerCase());
    const t = typeFilter==="all" || r.doc_type===typeFilter;
    return m && t;
  });

  const types = ["procedure","work_instruction","policy","form","specification","manual","record"];
  const stats = { total: records.length, approved: records.filter(r=>r.status==="approved").length, draft: records.filter(r=>r.status==="draft").length, review: records.filter(r=>r.status==="review").length };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Document Control</h1><p className="text-sm text-muted-foreground mt-0.5">ISO document management</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Document
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{l:"Total",v:stats.total,c:"text-foreground"},{l:"Approved",v:stats.approved,c:"text-green-400"},{l:"In Review",v:stats.review,c:"text-blue-400"},{l:"Drafts",v:stats.draft,c:"text-amber-400"}].map(s => (
          <div key={s.l} className="bg-card border border-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Document" : "Add Document"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Doc # *",k:"doc_number"},{l:"Title *",k:"title"},{l:"Version",k:"version"},{l:"Owner",k:"owner"},{l:"Effective Date",k:"effective_date",t:"date"},{l:"Review Date",k:"review_date",t:"date"},{l:"ISO Clause",k:"clause_ref"}].map(f => (
              <div key={f.k} className={f.k==="title"?"sm:col-span-2":""}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, f.t==="date"?e.target.value:e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.doc_type} onChange={e=>set("doc_type",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {types.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e=>set("status",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["draft","review","approved","obsolete"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Department</label>
              <select value={form.department} onChange={e=>set("department",e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["production","quality","maintenance","warehouse","hse","management"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e=>set("notes",e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Attach Document File</label>
            {!form.file_url ? (
              <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer w-full justify-center">
                {uploading ? "Uploading…" : <><Upload className="w-4 h-4" /> Choose file</>}
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            ) : (
              <div className="flex items-center gap-3">
                <a href={form.file_url} target="_blank" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <FileText className="w-4 h-4" /> View uploaded file
                </a>
                <button onClick={()=>set("file_url","")} className="text-muted-foreground hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={()=>setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={()=>setTypeFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter==="all"?"bg-primary/20 text-primary":"bg-secondary text-muted-foreground hover:text-foreground"}`}>All</button>
          {types.map(t=>(
            <button key={t} onClick={()=>setTypeFilter(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter===t?"bg-primary/20 text-primary":"bg-secondary text-muted-foreground hover:text-foreground"}`}>{t.replace(/_/g," ")}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.length===0 && <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">No documents found</div>}
        {filtered.map(r=>(
          <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4 hover:border-primary/30 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">{r.doc_number}</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${TYPE_COLORS[r.doc_type]}`}>{r.doc_type?.replace(/_/g," ")}</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
              </div>
              <div className="font-medium mt-1.5">{r.title}</div>
              <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                <span>v{r.version}</span>
                {r.owner && <span>Owner: {r.owner}</span>}
                {r.clause_ref && <span>Clause: {r.clause_ref}</span>}
                {r.effective_date && <span>Effective: {r.effective_date}</span>}
                {r.review_date && <span>Review: {r.review_date}</span>}
                <span>Dept: {r.department}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {r.file_url && <a href={r.file_url} target="_blank" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><FileText className="w-4 h-4" /></a>}
              <button onClick={()=>{setEditing(r);setForm({...r});setShowForm(true)}} className="text-xs text-primary hover:underline">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}