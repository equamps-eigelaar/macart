import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const F = ({ label, children, span }) => (
  <div className={span ? `sm:col-span-${span}` : ""}>
    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

const Inp = ({ value, onChange, type = "text", placeholder }) => (
  <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder}
    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
);

const CB = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
    <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
      className="w-4 h-4 accent-primary" />
    {label}
  </label>
);

const DEFAULTS = {
  wo_number: "", product_id: "", qty_planned: "", qty_produced: 0,
  status: "draft", planned_start: "", planned_end: "", notes: "",
  master_number: "", ac_number: "", customer_name: "", customer_ref: "",
  box_size: "", box_style: "", die_no: "", sheet_spec: "", board_spec: "",
  board_area: "", board_weight: "", board_spec_detail: "",
  finish_glue: false, finish_stitch: false, finish_tape: false,
  finish_plain: false, finish_1col: false, finish_2col: false, finish_3col: false,
  basis_mass: "", panel_creases: "", flap_creases: "",
  special_instructions: "", commodity: "", contact_person: "", contact_phone: "",
  delivery_address: "", postal_address: "", vat_btw_number: "", quote_number: "",
  qty_sheets_received: "", printer_run: "", printer_waste: "",
  mpact_waste: "", die_cut_waste: "", glue_waste: "", screenprint_waste: "",
  total_run: "", ink_code_1: "", ink_batch_1: "", ink_code_2: "", ink_batch_2: "",
  glue_batch_number: "", die_number: "",
};

const NUMERIC = ["qty_planned","qty_produced","qty_sheets_received","printer_run","printer_waste",
  "mpact_waste","die_cut_waste","glue_waste","screenprint_waste","total_run"];

export default function WorkOrderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...initial });
  const [products, setProducts] = useState([]);

  useEffect(() => { base44.entities.Product.list().then(setProducts); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    const data = { ...form };
    NUMERIC.forEach(k => { if (data[k] !== "" && data[k] !== undefined) data[k] = +data[k]; });
    onSave(data);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{initial ? "Edit Work Order" : "New Work Order"}</h3>
        <button onClick={onCancel} className="p-1.5 hover:bg-secondary rounded-lg"><X className="w-4 h-4" /></button>
      </div>

      {/* ── Core scheduling ── */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Scheduling</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <F label="WO Number *"><Inp value={form.wo_number} onChange={e => set("wo_number", e.target.value)} /></F>
          <F label="Product">
            <select value={form.product_id} onChange={e => set("product_id", e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
              <option value="">— Select —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.product_code} — {p.name}</option>)}
            </select>
          </F>
          <F label="Qty Planned *"><Inp type="number" value={form.qty_planned} onChange={e => set("qty_planned", e.target.value)} /></F>
          <F label="Planned Start *"><Inp type="date" value={form.planned_start} onChange={e => set("planned_start", e.target.value)} /></F>
          <F label="Planned End"><Inp type="date" value={form.planned_end} onChange={e => set("planned_end", e.target.value)} /></F>
          <F label="Status">
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
              {["draft","released","in_progress","complete","on_hold","cancelled"].map(s => (
                <option key={s} value={s}>{s.replace("_"," ")}</option>
              ))}
            </select>
          </F>
        </div>
      </section>

      {/* ── Master Card Header ── */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Master Card — Header</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <F label="Master No."><Inp value={form.master_number} onChange={e => set("master_number", e.target.value)} /></F>
          <F label="A/C No."><Inp value={form.ac_number} onChange={e => set("ac_number", e.target.value)} /></F>
          <F label="Customer Name"><Inp value={form.customer_name} onChange={e => set("customer_name", e.target.value)} /></F>
          <F label="Customer Ref / F No."><Inp value={form.customer_ref} onChange={e => set("customer_ref", e.target.value)} /></F>
          <F label="Quote No."><Inp value={form.quote_number} onChange={e => set("quote_number", e.target.value)} /></F>
          <F label="VAT / BTW No."><Inp value={form.vat_btw_number} onChange={e => set("vat_btw_number", e.target.value)} /></F>
        </div>
      </section>

      {/* ── Box Spec ── */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Box Specification</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <F label="Size"><Inp value={form.box_size} onChange={e => set("box_size", e.target.value)} placeholder="e.g. 670mm x 920mm" /></F>
          <F label="Style"><Inp value={form.box_style} onChange={e => set("box_style", e.target.value)} /></F>
          <F label="Die No."><Inp value={form.die_no} onChange={e => set("die_no", e.target.value)} /></F>
          <F label="Sheet"><Inp value={form.sheet_spec} onChange={e => set("sheet_spec", e.target.value)} /></F>
          <F label="Board"><Inp value={form.board_spec} onChange={e => set("board_spec", e.target.value)} /></F>
          <F label="Area"><Inp value={form.board_area} onChange={e => set("board_area", e.target.value)} /></F>
          <F label="Weight"><Inp value={form.board_weight} onChange={e => set("board_weight", e.target.value)} /></F>
          <F label="Spec"><Inp value={form.board_spec_detail} onChange={e => set("board_spec_detail", e.target.value)} /></F>
          <F label="Basis Mass"><Inp value={form.basis_mass} onChange={e => set("basis_mass", e.target.value)} /></F>
          <F label="Panel Creases"><Inp value={form.panel_creases} onChange={e => set("panel_creases", e.target.value)} /></F>
          <F label="Flap Creases"><Inp value={form.flap_creases} onChange={e => set("flap_creases", e.target.value)} /></F>
          <F label="Commodity"><Inp value={form.commodity} onChange={e => set("commodity", e.target.value)} /></F>
        </div>
      </section>

      {/* ── Finish ── */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Finish / Colours</h4>
        <div className="flex flex-wrap gap-6">
          <CB label="Glue" checked={form.finish_glue} onChange={v => set("finish_glue", v)} />
          <CB label="Stitch" checked={form.finish_stitch} onChange={v => set("finish_stitch", v)} />
          <CB label="Tape" checked={form.finish_tape} onChange={v => set("finish_tape", v)} />
          <CB label="Plain" checked={form.finish_plain} onChange={v => set("finish_plain", v)} />
          <CB label="1 Col" checked={form.finish_1col} onChange={v => set("finish_1col", v)} />
          <CB label="2 Col" checked={form.finish_2col} onChange={v => set("finish_2col", v)} />
          <CB label="3 Col" checked={form.finish_3col} onChange={v => set("finish_3col", v)} />
        </div>
      </section>

      {/* ── Special / Delivery ── */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Special Instructions &amp; Delivery</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Special Instructions" span={2}>
            <textarea value={form.special_instructions ?? ""} onChange={e => set("special_instructions", e.target.value)}
              rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
          </F>
          <F label="Contact Person"><Inp value={form.contact_person} onChange={e => set("contact_person", e.target.value)} /></F>
          <F label="Contact Phone"><Inp value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} /></F>
          <F label="Delivery Address">
            <textarea value={form.delivery_address ?? ""} onChange={e => set("delivery_address", e.target.value)}
              rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
          </F>
          <F label="Postal Address">
            <textarea value={form.postal_address ?? ""} onChange={e => set("postal_address", e.target.value)}
              rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
          </F>
        </div>
      </section>

      {/* ── Job Card Run Data ── */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Job Card — Run Data</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[["Qty Sheets Recv","qty_sheets_received"],["Printer Run","printer_run"],["Printer Waste","printer_waste"],
            ["Mpact Waste","mpact_waste"],["Die Cut Waste","die_cut_waste"],["Glue Waste","glue_waste"],
            ["Screenprint Waste","screenprint_waste"],["Total Run","total_run"]].map(([l,k]) => (
            <F key={k} label={l}><Inp type="number" value={form[k]} onChange={e => set(k, e.target.value)} /></F>
          ))}
        </div>
      </section>

      {/* ── Material References ── */}
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Material References</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[["Ink Code 1","ink_code_1"],["Ink Batch 1","ink_batch_1"],["Ink Code 2","ink_code_2"],
            ["Ink Batch 2","ink_batch_2"],["Glue Batch No.","glue_batch_number"],["Die Number","die_number"]].map(([l,k]) => (
            <F key={k} label={l}><Inp value={form[k]} onChange={e => set(k, e.target.value)} /></F>
          ))}
        </div>
      </section>

      {/* ── Notes ── */}
      <F label="Notes">
        <textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
          rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
      </F>

      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
      </div>
    </div>
  );
}