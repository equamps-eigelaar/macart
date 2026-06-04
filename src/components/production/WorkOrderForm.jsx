import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function WorkOrderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    wo_number: "", product_id: "", qty_planned: "", qty_produced: 0,
    status: "draft", planned_start: "", planned_end: "", notes: "",
    ...initial
  });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    base44.entities.Product.list().then(setProducts);
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{initial ? "Edit Work Order" : "New Work Order"}</h3>
        <button onClick={onCancel} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">WO Number *</label>
          <input value={form.wo_number} onChange={e => set("wo_number", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Product</label>
          <select value={form.product_id} onChange={e => set("product_id", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
            <option value="">— Select —</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.product_code} — {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Qty Planned *</label>
          <input type="number" value={form.qty_planned} onChange={e => set("qty_planned", +e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Planned Start *</label>
          <input type="date" value={form.planned_start} onChange={e => set("planned_start", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Planned End</label>
          <input type="date" value={form.planned_end} onChange={e => set("planned_end", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
            {["draft","released","in_progress","complete","on_hold","cancelled"].map(s => (
              <option key={s} value={s}>{s.replace("_"," ")}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
        <button onClick={() => onSave(form)}
          className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
      </div>
    </div>
  );
}