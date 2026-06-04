import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Save, X } from "lucide-react";

const STATIONS = ["press", "cut_1", "cut_2", "cut_3", "de_form", "glue_machine", "glue_hand"];

const BLANK = {
  station: "press",
  work_order_id: "",
  product_id: "",
  entry_date: format(new Date(), "yyyy-MM-dd"),
  shift: "A",
  qty_input: "",
  qty_good: "",
  qty_scrap: "",
  notes: "",
};

export default function ScrapEntryForm({ onSaved, onCancel, initial }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...BLANK });
  const [workOrders, setWorkOrders] = useState([]);
  const [bomLines, setBomLines] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.WorkOrder.filter({ status: "in_progress" }),
      base44.entities.BOMLine.list(),
    ]).then(([wos, boms]) => {
      setWorkOrders(wos);
      setBomLines(boms);
    });
  }, []);

  // Auto-fill product when WO is selected
  useEffect(() => {
    if (form.work_order_id) {
      const wo = workOrders.find(w => w.id === form.work_order_id);
      if (wo) setForm(f => ({ ...f, product_id: wo.product_id || "" }));
    }
  }, [form.work_order_id, workOrders]);

  // Auto-calculate qty_scrap from input/good
  const qtyInput = parseFloat(form.qty_input) || 0;
  const qtyGood  = parseFloat(form.qty_good)  || 0;
  const qtyScrap = qtyInput > 0 ? Math.max(0, qtyInput - qtyGood) : 0;
  const scrapPct = qtyInput > 0 ? (qtyScrap / qtyInput) * 100 : 0;

  // Look up BOM scrap factor for this product
  const bomLine = bomLines.find(b => b.product_id === form.product_id);
  const bomScrapFactor = bomLine?.scrap_factor ?? null;
  const bomScrapPct = bomScrapFactor != null ? (bomScrapFactor - 1) * 100 : null;
  const variancePct = (bomScrapPct != null && qtyInput > 0) ? scrapPct - bomScrapPct : null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.station || !form.entry_date || qtyInput <= 0) return;
    setSaving(true);
    const payload = {
      ...form,
      qty_input: qtyInput,
      qty_good: qtyGood,
      qty_scrap: qtyScrap,
      scrap_pct: +scrapPct.toFixed(2),
      bom_scrap_factor: bomScrapFactor,
      bom_scrap_pct: bomScrapPct != null ? +bomScrapPct.toFixed(2) : null,
      variance_pct: variancePct != null ? +variancePct.toFixed(2) : null,
    };
    if (initial?.id) await base44.entities.ScrapEntry.update(initial.id, payload);
    else await base44.entities.ScrapEntry.create(payload);
    setSaving(false);
    onSaved();
  };

  const varianceColor = variancePct == null ? "" : variancePct > 2 ? "text-red-400" : variancePct > 0 ? "text-amber-400" : "text-green-400";

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{initial ? "Edit Scrap Entry" : "New Scrap Entry"}</h3>
        {onCancel && <button onClick={onCancel}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Station *</label>
          <select value={form.station} onChange={e => set("station", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
            {STATIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Date *</label>
          <input type="date" value={form.entry_date} onChange={e => set("entry_date", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Shift</label>
          <select value={form.shift} onChange={e => set("shift", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
            {["A","B","C"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Work Order</label>
          <select value={form.work_order_id} onChange={e => set("work_order_id", e.target.value)}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
            <option value="">— none —</option>
            {workOrders.map(wo => <option key={wo.id} value={wo.id}>{wo.wo_number}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Qty Input *</label>
          <input type="number" value={form.qty_input} onChange={e => set("qty_input", e.target.value)} min="0"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Qty Good *</label>
          <input type="number" value={form.qty_good} onChange={e => set("qty_good", e.target.value)} min="0"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Qty Scrap (auto)</label>
          <div className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground font-mono">
            {qtyInput > 0 ? qtyScrap.toLocaleString() : "—"}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Operator</label>
          <input type="text" value={form.operator_id} onChange={e => set("operator_id", e.target.value)}
            placeholder="Name / ID"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      {/* Live calculation panel */}
      {qtyInput > 0 && (
        <div className="grid grid-cols-3 gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
          <div className="text-center">
            <div className={`text-xl font-bold font-mono ${scrapPct > (bomScrapPct ?? 99) ? "text-red-400" : "text-green-400"}`}>
              {scrapPct.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Actual Scrap %</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold font-mono text-blue-400">
              {bomScrapPct != null ? `${bomScrapPct.toFixed(2)}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">BOM Allowance %</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold font-mono ${varianceColor}`}>
              {variancePct != null ? `${variancePct > 0 ? "+" : ""}${variancePct.toFixed(2)}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Variance</div>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Notes</label>
        <input type="text" value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="Cause, material issue, etc."
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg bg-secondary border border-border hover:bg-secondary/80">Cancel</button>}
        <button onClick={handleSave} disabled={saving || qtyInput <= 0}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Entry"}
        </button>
      </div>
    </div>
  );
}