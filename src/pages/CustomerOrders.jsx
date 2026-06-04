import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, ChevronDown, ChevronRight, Package, Truck, Eye } from "lucide-react";
import { format } from "date-fns";

const ORDER_STATUS_COLORS = {
  draft: "bg-slate-500/15 text-slate-400",
  confirmed: "bg-blue-500/15 text-blue-400",
  in_production: "bg-amber-500/15 text-amber-400",
  dispatched: "bg-purple-500/15 text-purple-400",
  complete: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

const LINE_STATUS_COLORS = {
  open: "bg-slate-500/15 text-slate-400",
  partial: "bg-amber-500/15 text-amber-400",
  complete: "bg-green-500/15 text-green-400",
  cancelled: "bg-red-500/15 text-red-400",
};

const emptyOrder = {
  order_number: "", customer_id: "", order_date: format(new Date(), "yyyy-MM-dd"),
  required_date: "", status: "draft", notes: "", total_value: ""
};

const emptyLine = {
  customer_order_id: "", product_id: "", qty_ordered: "", qty_dispatched: 0,
  promised_date: "", status: "open"
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orderLines, setOrderLines] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderForm, setOrderForm] = useState(emptyOrder);

  const [showLineForm, setShowLineForm] = useState(null); // orderId
  const [lineForm, setLineForm] = useState(emptyLine);

  const load = async () => {
    const [o, c, p, ol, wo] = await Promise.all([
      base44.entities.CustomerOrder.list("-order_date", 200),
      base44.entities.Customer.list(),
      base44.entities.Product.list(),
      base44.entities.OrderLine.list("-created_date", 500),
      base44.entities.WorkOrder.list("-planned_start", 200),
    ]);
    setOrders(o);
    setCustomers(c);
    setProducts(p);
    setOrderLines(ol);
    setWorkOrders(wo);
  };

  useEffect(() => { load(); }, []);

  const setO = (k, v) => setOrderForm(p => ({ ...p, [k]: v }));
  const setL = (k, v) => setLineForm(p => ({ ...p, [k]: v }));

  const customerName = (id) => customers.find(c => c.id === id)?.name || id?.slice(0, 8) || "—";
  const productName = (id) => {
    const p = products.find(p => p.id === id);
    return p ? `${p.product_code} — ${p.name}` : id?.slice(0, 8) || "—";
  };
  const linesFor = (orderId) => orderLines.filter(l => l.customer_order_id === orderId);
  const woForOrder = (orderId) => {
    const lines = linesFor(orderId);
    return workOrders.filter(wo => lines.some(l => l.id === wo.order_line_id));
  };

  const handleSaveOrder = async () => {
    const data = { ...orderForm, total_value: orderForm.total_value ? +orderForm.total_value : undefined };
    if (editingOrder) await base44.entities.CustomerOrder.update(editingOrder.id, data);
    else await base44.entities.CustomerOrder.create(data);
    setShowOrderForm(false); setEditingOrder(null); setOrderForm(emptyOrder);
    load();
  };

  const handleSaveLine = async (orderId) => {
    await base44.entities.OrderLine.create({ ...lineForm, customer_order_id: orderId, qty_ordered: +lineForm.qty_ordered, qty_dispatched: +lineForm.qty_dispatched || 0 });
    setShowLineForm(null); setLineForm(emptyLine);
    load();
  };

  const handleUpdateLineStatus = async (line, newStatus) => {
    await base44.entities.OrderLine.update(line.id, { status: newStatus });
    load();
  };

  const handleUpdateOrderStatus = async (order, newStatus) => {
    await base44.entities.CustomerOrder.update(order.id, { status: newStatus });
    load();
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      customerName(o.customer_id).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Summary stats
  const stats = {
    total: orders.length,
    open: orders.filter(o => ["confirmed", "in_production"].includes(o.status)).length,
    dispatched: orders.filter(o => o.status === "dispatched").length,
    complete: orders.filter(o => o.status === "complete").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Order receipt through dispatch</p>
        </div>
        <button onClick={() => { setEditingOrder(null); setOrderForm(emptyOrder); setShowOrderForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: stats.total, color: "text-foreground" },
          { label: "Active", value: stats.open, color: "text-amber-400" },
          { label: "Dispatched", value: stats.dispatched, color: "text-blue-400" },
          { label: "Complete", value: stats.complete, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Order Form */}
      {showOrderForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editingOrder ? "Edit Order" : "New Customer Order"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Order Number *</label>
              <input value={orderForm.order_number} onChange={e => setO("order_number", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Customer *</label>
              <select value={orderForm.customer_id} onChange={e => setO("customer_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Select Customer —</option>
                {customers.filter(c => c.status === "active").map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={orderForm.status} onChange={e => setO("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["draft", "confirmed", "in_production", "dispatched", "complete", "cancelled"].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Order Date</label>
              <input type="date" value={orderForm.order_date} onChange={e => setO("order_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Required Date</label>
              <input type="date" value={orderForm.required_date} onChange={e => setO("required_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Total Value (R)</label>
              <input type="number" value={orderForm.total_value} onChange={e => setO("total_value", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={orderForm.notes} onChange={e => setO("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowOrderForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSaveOrder} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save Order</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Statuses</option>
          {["draft", "confirmed", "in_production", "dispatched", "complete", "cancelled"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">No orders found</div>
        )}
        {filtered.map(order => {
          const lines = linesFor(order.id);
          const wos = woForOrder(order.id);
          const isExpanded = expandedOrder === order.id;
          const isOverdue = order.required_date && order.required_date < format(new Date(), "yyyy-MM-dd") && !["complete", "dispatched", "cancelled"].includes(order.status);

          return (
            <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Order Row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <span className="text-muted-foreground">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm">{order.order_number}</span>
                    <span className="text-muted-foreground text-sm">{customerName(order.customer_id)}</span>
                    {isOverdue && <span className="text-xs bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md font-medium">OVERDUE</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Ordered: {order.order_date} {order.required_date && `· Due: ${order.required_date}`} · {lines.length} line{lines.length !== 1 ? "s" : ""}
                    {wos.length > 0 && ` · ${wos.length} WO`}
                  </div>
                </div>
                {order.total_value && (
                  <div className="text-sm font-mono hidden sm:block">R {(+order.total_value).toLocaleString()}</div>
                )}
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${ORDER_STATUS_COLORS[order.status]}`}>{order.status.replace(/_/g, " ")}</span>
                <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                  <select
                    value={order.status}
                    onChange={e => handleUpdateOrderStatus(order, e.target.value)}
                    className="bg-secondary border border-border rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    {["draft", "confirmed", "in_production", "dispatched", "complete", "cancelled"].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { setEditingOrder(order); setOrderForm({ ...order }); setShowOrderForm(true); }}
                    className="text-xs text-primary hover:underline px-1"
                  >Edit</button>
                </div>
              </div>

              {/* Expanded — Order Lines */}
              {isExpanded && (
                <div className="border-t border-border bg-secondary/10 px-4 py-3 space-y-3">
                  {/* Lines Table */}
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" /> Order Lines
                    </h4>
                    <button
                      onClick={() => { setShowLineForm(order.id); setLineForm({ ...emptyLine, customer_order_id: order.id, promised_date: order.required_date || "" }); }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add Line
                    </button>
                  </div>

                  {showLineForm === order.id && (
                    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                      <h5 className="text-sm font-medium">New Order Line</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs text-muted-foreground mb-1 block">Product *</label>
                          <select value={lineForm.product_id} onChange={e => setL("product_id", e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                            <option value="">— Select Product —</option>
                            {products.filter(p => p.status === "active").map(p => (
                              <option key={p.id} value={p.id}>{p.product_code} — {p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Qty Ordered *</label>
                          <input type="number" value={lineForm.qty_ordered} onChange={e => setL("qty_ordered", e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Promised Date</label>
                          <input type="date" value={lineForm.promised_date} onChange={e => setL("promised_date", e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowLineForm(null)} className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-secondary">Cancel</button>
                        <button onClick={() => handleSaveLine(order.id)} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">Add Line</button>
                      </div>
                    </div>
                  )}

                  {lines.length === 0 && showLineForm !== order.id && (
                    <p className="text-sm text-muted-foreground py-2">No order lines yet.</p>
                  )}

                  {lines.length > 0 && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/30 text-muted-foreground text-xs uppercase tracking-wider">
                            <th className="px-3 py-2 text-left">Product</th>
                            <th className="px-3 py-2 text-right">Ordered</th>
                            <th className="px-3 py-2 text-right">Dispatched</th>
                            <th className="px-3 py-2 text-left">Promised</th>
                            <th className="px-3 py-2 text-left">OTIF</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {lines.map(line => {
                            const pct = line.qty_ordered > 0 ? Math.round((line.qty_dispatched || 0) / line.qty_ordered * 100) : 0;
                            return (
                              <tr key={line.id} className="hover:bg-secondary/20">
                                <td className="px-3 py-2 font-medium">{productName(line.product_id)}</td>
                                <td className="px-3 py-2 text-right font-mono">{line.qty_ordered?.toLocaleString()}</td>
                                <td className="px-3 py-2 text-right font-mono">
                                  <span className={pct >= 100 ? "text-green-400" : pct > 0 ? "text-amber-400" : "text-muted-foreground"}>
                                    {(line.qty_dispatched || 0).toLocaleString()} ({pct}%)
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{line.promised_date || "—"}</td>
                                <td className="px-3 py-2">
                                  {line.otif === true && <span className="text-green-400 text-xs font-medium">✓ Yes</span>}
                                  {line.otif === false && <span className="text-red-400 text-xs font-medium">✗ No</span>}
                                  {line.otif === undefined || line.otif === null ? <span className="text-muted-foreground text-xs">—</span> : null}
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={line.status}
                                    onChange={e => handleUpdateLineStatus(line, e.target.value)}
                                    className={`text-xs rounded-md px-2 py-0.5 border border-border bg-secondary outline-none focus:ring-1 focus:ring-primary ${LINE_STATUS_COLORS[line.status]}`}
                                  >
                                    {["open", "partial", "complete", "cancelled"].map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Linked Work Orders */}
                  {wos.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                        <Truck className="w-3.5 h-3.5" /> Linked Work Orders
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {wos.map(wo => (
                          <span key={wo.id} className="inline-flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-mono">
                            {wo.wo_number}
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              wo.status === "complete" ? "bg-green-500/15 text-green-400" :
                              wo.status === "in_progress" ? "bg-amber-500/15 text-amber-400" :
                              "bg-slate-500/15 text-slate-400"
                            }`}>{wo.status?.replace(/_/g, " ")}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}