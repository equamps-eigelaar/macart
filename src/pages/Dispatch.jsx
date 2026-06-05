import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Truck } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  planned:    "bg-slate-500/15 text-slate-400",
  dispatched: "bg-blue-500/15 text-blue-400",
  delivered:  "bg-green-500/15 text-green-400",
  returned:   "bg-red-500/15 text-red-400",
};

const empty = {
  dispatch_number: "",
  customer_order_id: "",
  order_line_id: "",
  dispatch_date: format(new Date(), "yyyy-MM-dd"),
  qty_dispatched: "",
  carrier: "",
  tracking_ref: "",
  status: "planned",
  notes: "",
};

export default function DispatchPage() {
  const [records, setRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderLines, setOrderLines] = useState([]);
  const [fgBatches, setFgBatches] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [d, o, ol, fg, c] = await Promise.all([
      base44.entities.Dispatch.list("-dispatch_date", 200),
      base44.entities.CustomerOrder.list("-order_date", 200),
      base44.entities.OrderLine.list("-created_date", 500),
      base44.entities.FGBatch.list("-production_date", 200),
      base44.entities.Customer.list(),
    ]);
    setRecords(d);
    setOrders(o);
    setOrderLines(ol);
    setFgBatches(fg);
    setCustomers(c);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const customerName = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    return customers.find(c => c.id === order?.customer_id)?.name || "—";
  };

  const orderNumber = (orderId) => orders.find(o => o.id === orderId)?.order_number || orderId?.slice(0, 8) || "—";

  const linesForOrder = (orderId) =>
    orderLines.filter(l => l.customer_order_id === orderId && l.status !== "cancelled");

  const toggleBatch = (id) =>
    setSelectedBatches(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openForm = (record = null) => {
    setEditing(record);
    setForm(record ? { ...record, qty_dispatched: record.qty_dispatched?.toString() ?? "" } : empty);
    setSelectedBatches(record?.fg_batch_ids ?? []);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, qty_dispatched: +form.qty_dispatched, fg_batch_ids: selectedBatches };
    if (editing) {
      await base44.entities.Dispatch.update(editing.id, data);
    } else {
      await base44.entities.Dispatch.create(data);
    }
    if (form.status === "dispatched" && selectedBatches.length > 0) {
      await Promise.all(
        selectedBatches.map(id => base44.entities.FGBatch.update(id, { status: "dispatched" }))
      );
    }
    setSaving(false);
    setShowForm(false); setEditing(null); setForm(empty); setSelectedBatches([]);
    load();
  };

  const filtered = records.filter(r => {
    const ms = !search ||
      r.dispatch_number?.toLowerCase().includes(search.toLowerCase()) ||
      orderNumber(r.customer_order_id).toLowerCase().includes(search.toLowerCase()) ||
      customerName(r.customer_order_id).toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || r.status === statusFilter;
    return ms && mst;
  });

  const stats = {
    planned:    records.filter(r => r.status === "planned").length,
    dispatched: records.filter(r => r.status === "dispatched").length,
    delivered:  records.filter(r => r.status === "delivered").length,
    total:      records.length,
  };

  // Released batches + any already linked to this record (for edit)
  const availableBatches = fgBatches.filter(b =>
    b.status === "released" || selectedBatches.includes(b.id)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Outbound shipments against customer orders</p>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Dispatch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Planned",    value: stats.planned,    color: "text-muted-foreground" },
          { label: "Dispatched", value: stats.dispatched, color: "text-blue-400" },
          { label: "Delivered",  value: stats.delivered,  color: "text-green-400" },
          { label: "Total",      value: stats.total,      color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-5">
          <h3 className="font-semibold">{editing ? "Edit Dispatch" : "New Dispatch"}</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dispatch Number *</label>
              <input value={form.dispatch_number} onChange={e => set("dispatch_number", e.target.value)}
                placeholder="e.g. DN-001"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Customer Order *</label>
              <select value={form.customer_order_id}
                onChange={e => { set("customer_order_id", e.target.value); set("order_line_id", ""); }}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Select Order —</option>
                {orders
                  .filter(o => !["cancelled", "complete"].includes(o.status))
                  .map(o => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {customers.find(c => c.id === o.customer_id)?.name || "?"}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Order Line</label>
              <select value={form.order_line_id} onChange={e => set("order_line_id", e.target.value)}
                disabled={!form.customer_order_id}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary disabled:opacity-50">
                <option value="">— Not specified —</option>
                {linesForOrder(form.customer_order_id).map((l, i) => (
                  <option key={l.id} value={l.id}>Line {i + 1} · {l.qty_ordered?.toLocaleString()} units</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dispatch Date *</label>
              <input type="date" value={form.dispatch_date} onChange={e => set("dispatch_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Qty Dispatched *</label>
              <input type="number" value={form.qty_dispatched} onChange={e => set("qty_dispatched", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["planned", "dispatched", "delivered", "returned"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Carrier</label>
              <input value={form.carrier} onChange={e => set("carrier", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tracking Ref</label>
              <input value={form.tracking_ref} onChange={e => set("tracking_ref", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <input value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* FG Batch selection */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              Link FG Batches{availableBatches.length === 0 ? " — no released batches available" : ` (${availableBatches.length} released)`}
            </label>
            {availableBatches.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableBatches.map(b => (
                    <label key={b.id}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${selectedBatches.includes(b.id) ? "border-primary/50 bg-primary/5" : "border-border hover:bg-secondary"}`}>
                      <input type="checkbox" checked={selectedBatches.includes(b.id)}
                        onChange={() => toggleBatch(b.id)} className="w-4 h-4 accent-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold truncate">{b.batch_id}</div>
                        <div className="text-xs text-muted-foreground">{b.qty_available?.toLocaleString()} units</div>
                      </div>
                    </label>
                  ))}
                </div>
                {form.status === "dispatched" && selectedBatches.length > 0 && (
                  <p className="text-xs text-amber-400 mt-2">
                    Saving as "dispatched" will update {selectedBatches.length} batch{selectedBatches.length !== 1 ? "es" : ""} to dispatched status in FG Batches.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Release batches in FG Batches first to link them here.</p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(empty); setSelectedBatches([]); }}
              className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-60">
              <Truck className="w-4 h-4" />
              {saving ? "Saving…" : editing ? "Update" : "Save Dispatch"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search dispatch number, order or customer..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["planned", "dispatched", "delivered", "returned"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                {["Dispatch #", "Order", "Customer", "Date", "Qty", "Carrier", "Tracking", "Batches", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    {records.length === 0 ? (
                      <div>
                        <div className="font-medium text-foreground mb-1">No dispatches recorded yet</div>
                        <div className="text-sm text-muted-foreground">Record a dispatch when finished goods leave the site against a customer order.</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No dispatches match your filters</span>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.dispatch_number}</td>
                  <td className="px-4 py-3 font-mono text-xs">{orderNumber(r.customer_order_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{customerName(r.customer_order_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.dispatch_date}</td>
                  <td className="px-4 py-3 font-mono">{r.qty_dispatched?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.carrier || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.tracking_ref || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.fg_batch_ids?.length || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openForm(r)} className="text-xs text-primary hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
