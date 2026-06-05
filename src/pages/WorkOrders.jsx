import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";
import WorkOrderForm from "@/components/production/WorkOrderForm";

const STATUS_COLORS = {
  draft: "bg-slate-600/20 text-slate-400",
  released: "bg-blue-600/20 text-blue-400",
  in_progress: "bg-amber-600/20 text-amber-400",
  complete: "bg-green-600/20 text-green-400",
  on_hold: "bg-orange-600/20 text-orange-400",
  cancelled: "bg-red-600/20 text-red-400",
};

export default function WorkOrders() {
  const [wos, setWos] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const data = await base44.entities.WorkOrder.list("-planned_start", 100);
    setWos(data);
  };

  useEffect(() => { load(); }, []);

  const filtered = wos.filter(w => {
    const matchSearch = !search || w.wo_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = async (data) => {
    if (editing) await base44.entities.WorkOrder.update(editing.id, data);
    else await base44.entities.WorkOrder.create(data);
    setShowForm(false); setEditing(null); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{wos.length} total</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New WO
        </button>
      </div>

      {showForm && (
        <WorkOrderForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search WO number..."
            className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["draft","released","in_progress","complete","on_hold","cancelled"].map(s => (
            <option key={s} value={s}>{s.replace("_"," ")}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">WO #</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Qty Planned</th>
                <th className="px-4 py-3 text-left">Qty Produced</th>
                <th className="px-4 py-3 text-left">Planned Start</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center">
                  {wos.length === 0 ? (
                    <div>
                      <div className="font-medium text-foreground mb-1">No work orders yet</div>
                      <div className="text-sm text-muted-foreground">Work orders are created from Customer Order lines — start there and add a line to generate a WO.</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No work orders match your filters</span>
                  )}
                </td></tr>
              )}
              {filtered.map(wo => (
                <tr key={wo.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">{wo.wo_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{wo.product_id || "—"}</td>
                  <td className="px-4 py-3">{wo.qty_planned?.toLocaleString()}</td>
                  <td className="px-4 py-3">{wo.qty_produced?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{wo.planned_start}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[wo.status]}`}>
                      {wo.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditing(wo); setShowForm(true); }}
                      className="text-xs text-primary hover:underline">Edit</button>
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