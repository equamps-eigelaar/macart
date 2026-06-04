import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { open:"bg-red-500/15 text-red-400", investigating:"bg-amber-500/15 text-amber-400", resolved:"bg-blue-500/15 text-blue-400", closed:"bg-green-500/15 text-green-400" };
const empty = { complaint_number:"", customer_id:"", received_date: format(new Date(),"yyyy-MM-dd"), description:"", complaint_type:"other", status:"open", resolution:"" };

export default function CustomerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [c, cu] = await Promise.all([base44.entities.CustomerComplaint.list("-received_date", 200), base44.entities.Customer.list()]);
    setComplaints(c); setCustomers(cu);
  };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.CustomerComplaint.update(editing.id, form);
    else await base44.entities.CustomerComplaint.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const filtered = complaints.filter(c => !search || c.complaint_number?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));

  const custName = (id) => customers.find(c => c.id === id)?.name || id?.slice(0,8) || "—";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Customer Complaints</h1><p className="text-sm text-muted-foreground mt-0.5">{complaints.length} records</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Complaint
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Complaint" : "New Customer Complaint"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Complaint #</label>
              <input value={form.complaint_number} onChange={e => set("complaint_number", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Customer</label>
              <select value={form.customer_id} onChange={e => set("customer_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Select —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Received Date</label>
              <input type="date" value={form.received_date} onChange={e => set("received_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Type</label>
              <select value={form.complaint_type} onChange={e => set("complaint_type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["dimensional","structural","print_quality","quantity","delivery","other"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["open","investigating","resolved","closed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Description *</label>
              <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Resolution</label>
              <textarea rows={2} value={form.resolution} onChange={e => set("resolution", e.target.value)}
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
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Complaint #","Customer","Date","Type","Description","Status","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No complaints recorded</td></tr>}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-medium">{c.complaint_number}</td>
                  <td className="px-4 py-3">{custName(c.customer_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.received_date}</td>
                  <td className="px-4 py-3 capitalize">{c.complaint_type?.replace("_"," ")}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-muted-foreground">{c.description}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[c.status]}`}>{c.status}</span></td>
                  <td className="px-4 py-3"><button onClick={() => { setEditing(c); setForm({...c}); setShowForm(true); }} className="text-xs text-primary hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}