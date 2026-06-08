import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const F = ({ label, children }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, type = "text", placeholder }) => (
  <input
    type={type}
    value={value ?? ""}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
  />
);

export default function WorkOrderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    wo_number: "", product_id: "", qty_planned: "", qty_produced: 0,
    status: "draft", planned_start: "", planned_end: "", notes: "",
    qty_sheets_received: "", printer_run: "", printer_waste: "",
    mpact_waste: "", die_cut_waste: "", glue_waste: "", screenprint_waste: "",
    total_run: "",
    ink_code_1: "", ink_batch_1: "", ink_code_2: "", ink_batch_2: "",
    glue_batch_number: "", die_number: "",
    ...initial
  });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    base44.entities.Product.list().then(setProducts);
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    const data = { ...form };
    // coerce numeric fields
    ["qty_planned","qty_produced","qty_sheets_received","printer_run","printer_waste",
     "mpact_waste","die_cut_waste","glue_waste","screenprint_waste","total_run"
    ].forEach(k => { if (data[k] !== "" && data[k] !== undefined) data[k] = +data[k]; });
    onSave(data);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{initial ? "Edit Work Order" : "New Work Order"}</h3>
        <button onClick={onCancel} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <F label="WO Number *">
          <Input value={form.wo_number} onChange={e => set("wo_number", e.target.value)} />
        </F>
        <F label="Product">
          <select value={form.product_id} onChange={e => set("product_id", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
            <option value="">— Select —</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.product_code} — {p.name}</option>)}
          </select>
        </F>
        <F label="Qty Planned *">
          <Input type="number" value={form.qty_planned} onChange={e => set("qty_planned", e.target.value)} />
        </F>
        <F label="Planned Start *">
          <Input type="date" value={form.planned_start} onChange={e => set("planned_start", e.target.value)} />
        </F>
        <F label="Planned End">
          <Input type="date" value={form.planned_end} onChange={e => set("planned_end", e.target.value)} />
        </F>
        <F label="Status">
          <select value={form.status} onChange={e => set("status", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
            {["draft","released","in_progress","complete","on_hold","cancelled"].map(s => (
              <option key={s} value={s}>{s.replace("_"," ")}</option>
            ))}
          </select>
        </F>
      </div>

      {/* Job Card — Run Data */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Job Card — Run Data</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <F label="Qty Sheets Received">
            <Input type="number" value={form.qty_sheets_received} onChange={e => set("qty_sheets_received", e.target.value)} />
          </F>
          <F label="Printer Run">
            <Input type="number" value={form.printer_run} onChange={e => set("printer_run", e.target.value)} />
          </F>
          <F label="Printer Waste">
            <Input type="number" value={form.printer_waste} onChange={e => set("printer_waste", e.target.value)} />
          </F>
          <F label="Mpact Waste">
            <Input type="number" value={form.mpact_waste} onChange={e => set("mpact_waste", e.target.value)} />
          </F>
          <F label="Die Cut Waste">
            <Input type="number" value={form.die_cut_waste} onChange={e => set("die_cut_waste", e.target.value)} />
          </F>
          <F label="Glue Waste">
            <Input type="number" value={form.glue_waste} onChange={e => set("glue_waste", e.target.value)} />
          </F>
          <F label="Screenprint Waste">
            <Input type="number" value={form.screenprint_waste} onChange={e => set("screenprint_waste", e.target.value)} />
          </F>
          <F label="Total Run">
            <Input type="number" value={form.total_run} onChange={e => set("total_run", e.target.value)} />
          </F>
        </div>
      </div>

      {/* Job Card — Material References */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Job Card — Material References</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <F label="Ink Code 1">
            <Input value={form.ink_code_1} onChange={e => set("ink_code_1", e.target.value)} />
          </F>
          <F label="Ink Batch 1">
            <Input value={form.ink_batch_1} onChange={e => set("ink_batch_1", e.target.value)} />
          </F>
          <F label="Ink Code 2">
            <Input value={form.ink_code_2} onChange={e => set("ink_code_2", e.target.value)} />
          </F>
          <F label="Ink Batch 2">
            <Input value={form.ink_batch_2} onChange={e => set("ink_batch_2", e.target.value)} />
          </F>
          <F label="Glue Batch Number">
            <Input value={form.glue_batch_number} onChange={e => set("glue_batch_number", e.target.value)} />
          </F>
          <F label="Die Number">
            <Input value={form.die_number} onChange={e => set("die_number", e.target.value)} />
          </F>
        </div>
      </div>

      {/* Notes */}
      <F label="Notes">
        <textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
          rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
      </F>

      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
        <button onClick={handleSave}
          className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
      </div>
    </div>
  );
}