import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Upload, FileText, Download, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  draft: "bg-slate-500/15 text-slate-400",
  review: "bg-amber-500/15 text-amber-400",
  approved: "bg-green-500/15 text-green-400",
  obsolete: "bg-red-500/15 text-red-400",
};
const TYPE_LABELS = { policy: "Policy", procedure: "Procedure", work_instruction: "Work Instruction", form: "Form", record: "Record", specification: "Specification", manual: "Manual" };

const empty = {
  doc_number: "", title: "", doc_type: "procedure", version: "1.0", status: "draft",
  effective_date: format(new Date(), "yyyy-MM-dd"), review_date: "", owner: "",
  department: "production", clause_ref: "", file_url: "", notes: ""
};

export default function DocumentControl() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    const d = await base44.entities.Document.list("-effective_date", 200);
    setRecords(d);
  };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const today = new Date().toISOString().split("T")[0];
  const overdueReview = records.filter(r => r.review_date && r.review_date < today && r.status === "approved");

  const filtered = records.filter(r =>
    !search || r.doc_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.owner?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Control</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Version-controlled documents & procedures</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {overdueReview.length > 0 && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3 text-sm text-amber-400 flex items-center gap-2">
          <FileText className="w-4 h-4 flex-shrink-0" />
          {overdueReview.length} document{overdueReview.length > 1 ? "s" : ""} overdue for review
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Document" : "Add New Document"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { l: "Doc Number *", k: "doc_number" },
              { l: "Title *", k: "title" },
              { l: "Owner", k: "owner" },
              { l: "Version", k: "version" },
              { l: "Effective Date", k: "effective_date", t: "date" },
              { l: "Review Date", k: "review_date", t: "date" },
              { l: "Clause Ref", k: "clause_ref" },
            ].map(f => (
              <div key={f.k}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t || "text"} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type *</label>
              <select value={form.doc_type} onChange={e => set("doc_type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["draft", "review", "approved", "obsolete"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Department</label>
              <select value={form.department} onChange={e => set("department", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["production", "quality", "maintenance", "warehouse", "hse", "management"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-muted-foreground mb-2 block">Document File</label>
              <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
              {!form.file_url ? (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full justify-center">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-5 h-5" /> Upload Document</>}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <a href={form.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Download className="w-4 h-4" /> View / Download
                  </a>
                  <button onClick={() => set("file_url", "")} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                {["Doc #", "Title", "Type", "Version", "Status", "Effective", "Review", "Owner", "Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No documents found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold text-xs">{r.doc_number}</td>
                  <td className="px-4 py-3 text-xs max-w-[200px] truncate">
                    {r.file_url ? (
                      <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{r.title}</a>
                    ) : r.title}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{TYPE_LABELS[r.doc_type] || r.doc_type}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.version}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.effective_date || "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {r.review_date && r.review_date < today && r.status === "approved"
                      ? <span className="text-amber-400 font-medium">{r.review_date} ⚠</span>
                      : <span className="text-muted-foreground">{r.review_date || "—"}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.owner || "—"}</td>
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