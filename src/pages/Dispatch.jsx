import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Truck } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  pending: "bg-amber-500/15 text-amber-400",
  dispatched: "bg-blue-500/15 text-blue-400",
  delivered: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

const empty = {
  dispatch_number: "", customer_order_id: "", dispatch_date: format(new Date(), "yyyy-MM-dd"),
  carrier: "", tracking_ref: "", status: "pending", notes: ""
};

export default function DispatchPage() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [d, o, c] = await Promise.all([
      base44.entities.Dispatch.list("-dispatch_date", 200),
      base44.entities.CustomerOrder.list("-order_date", 200),
      base44.entities.Customer.list(),
    ]);
    setRecords(d);
    setOrders(o);
    setCustomers(c);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (editing) await base44.entities.Dispatch.update(editing.id, form);
    else await base44.entities.Dispatch.create(form);
    setShowForm(false); setEditing(null); setForm(empty); load();
  };

  const orderLabel = (id) => {
    const o = orders.find(o => o.id === id);
    if (!o) return id?.slice(0, 8) || "—";
    const c = customers.find(c => c.id === o.customer_id);
    return `${o.order_number}${c ? ` — ${c.name}` : ""}`;
  };

  const filtered = records.filter(r => {
    const ms = !search || r.dispatch_number?.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || r.status === statusFilter;
    return ms && mst;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6" /> Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Outbound shipment records</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Dispatch
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Dispatch" : "New Dispatch"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Dispatch Number *</label>
              <input value={form.dispatch_number} onChange={e => set("dispatch_number", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Customer Order</label>
              <select value={form.customer_order_id} onChange={e => set("customer_order_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Select Order —</option>
                {orders.map(o => <option key={o.id} value={o.id}>{orderLabel(o.id)}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Dispatch Date</label>
              <input type="date" value={form.dispatch_date} onChange={e => set("dispatch_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Carrier</label>
              <input value={form.carrier} onChange={e => set("carrier", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Tracking Ref</label>
              <input value={form.tracking_ref} onChange={e => set("tracking_ref", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["pending","dispatched","delivered","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
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

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dispatch number..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["pending","dispatched","delivered","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Dispatch #","Order","Date","Carrier","Tracking","Status","Actions"].map(h =>
                <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No dispatch records found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.dispatch_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{orderLabel(r.customer_order_id)}</td>
                  <td className="px-4 py-3">{r.dispatch_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.carrier || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.tracking_ref || "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
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