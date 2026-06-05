import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Building2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  initial_contact: "bg-slate-600/20 text-slate-400",
  quote_requested: "bg-blue-600/20 text-blue-400",
  quote_received: "bg-purple-600/20 text-purple-400",
  assessment_scheduled: "bg-amber-600/20 text-amber-400",
  assessment_complete: "bg-green-600/20 text-green-400",
  on_hold: "bg-orange-600/20 text-orange-400",
};

const STATUSES = ["initial_contact", "quote_requested", "quote_received", "assessment_scheduled", "assessment_complete", "on_hold"];

const EMPTY = {
  cab_name: "", contact_person: "", contact_email: "", sector: "",
  country: "", date: format(new Date(), "yyyy-MM-dd"), status: "initial_contact",
  assessment_date: "", notes: "",
};

export default function CABCorrespondenceePage() {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const data = await base44.entities.CABCorrespondence.list("-date", 100);
    setRecords(data);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (r) => { setEditing(r); setForm(r); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async () => {
    if (editing) await base44.entities.CABCorrespondence.update(editing.id, form);
    else await base44.entities.CABCorrespondence.create(form);
    closeForm(); load();
  };

  const activeCount = records.filter(r => !["assessment_complete", "on_hold"].includes(r.status)).length;
  const scheduledCount = records.filter(r => r.status === "assessment_scheduled").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">CAB Correspondence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Conformity Assessment Body engagement
            {scheduledCount > 0 && <span className="text-amber-400 ml-2">· {scheduledCount} assessment scheduled</span>}
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add CAB
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Edit CAB Record" : "New CAB Record"}</h3>
            <button onClick={closeForm} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">CAB Name *</label>
              <input value={form.cab_name} onChange={e => set("cab_name", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Person</label>
              <input value={form.contact_person} onChange={e => set("contact_person", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Email</label>
              <input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sector</label>
              <input value={form.sector} onChange={e => set("sector", e.target.value)}
                placeholder="e.g. Food Manufacturing - BIII"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Country</label>
              <input value={form.country} onChange={e => set("country", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date of Contact</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assessment Date</label>
              <input type="date" value={form.assessment_date} onChange={e => set("assessment_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={closeForm} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      {records.length === 0 && !showForm ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <div className="font-medium text-foreground mb-1">No CAB records yet</div>
          <div className="text-sm text-muted-foreground">Track your engagement with FSSC-licensed Conformity Assessment Bodies here.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{r.cab_name}</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                    {r.status?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {r.contact_person && <span>{r.contact_person}</span>}
                  {r.contact_email && <span>{r.contact_email}</span>}
                  {r.sector && <span>{r.sector}</span>}
                  {r.country && <span>{r.country}</span>}
                  {r.date && <span>Contact: {r.date}</span>}
                  {r.assessment_date && <span className="text-amber-400">Assessment: {r.assessment_date}</span>}
                </div>
                {r.notes && <p className="text-sm text-muted-foreground mt-2 italic">{r.notes}</p>}
              </div>
              <button onClick={() => openEdit(r)} className="text-xs text-primary hover:underline flex-shrink-0">Edit</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
