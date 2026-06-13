import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Package } from "lucide-react";

export default function BOM() {
  const [products, setProducts] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [bomLines, setBomLines] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ raw_material_id: "", qty_per_unit: "", unit: "m²", scrap_factor: "1.05", notes: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list("name", 200),
      base44.entities.RawMaterial.list("name", 200),
      base44.entities.BOMLine.list("product_id", 500),
    ]).then(([p, rm, b]) => {
      setProducts(p);
      setRawMaterials(rm);
      setBomLines(b);
      if (p.length > 0 && !selectedProduct) setSelectedProduct(p[0]);
    });
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const productLines = selectedProduct
    ? bomLines.filter(b => b.product_id === selectedProduct.id)
    : [];

  const rmMap = Object.fromEntries(rawMaterials.map(r => [r.id, r]));

  const handleAdd = async () => {
    if (!form.raw_material_id || !form.qty_per_unit || !selectedProduct) return;
    setSaving(true);
    try {
      const line = await base44.entities.BOMLine.create({
        product_id: selectedProduct.id,
        raw_material_id: form.raw_material_id,
        qty_per_unit: +form.qty_per_unit,
        unit: form.unit,
        scrap_factor: +form.scrap_factor || 1.05,
        notes: form.notes,
      });
      setBomLines(prev => [...prev, line]);
      setForm({ raw_material_id: "", qty_per_unit: "", unit: "m²", scrap_factor: "1.05", notes: "" });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (line) => {
    if (!confirm("Remove this BOM line?")) return;
    setDeleting(line.id);
    try {
      await base44.entities.BOMLine.update(line.id, { _deleted: true });
      setBomLines(prev => prev.filter(b => b.id !== line.id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Bill of Materials</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Raw material requirements per finished product</p>
      </div>

      {products.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Package className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <div className="font-medium text-foreground mb-1">No products yet</div>
          <div className="text-sm text-muted-foreground">Add products in Master Data → Products first.</div>
        </div>
      ) : (
        <>
          {/* Product selector */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="text-xs text-muted-foreground mb-2 block">Select Product</label>
            <div className="flex flex-wrap gap-2">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedProduct(p); setShowAdd(false); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedProduct?.id === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {p.product_code ? `${p.product_code} — ` : ""}{p.name}
                </button>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedProduct.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{productLines.length} raw material{productLines.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" /> Add Line
                </button>
              </div>

              {showAdd && (
                <div className="p-4 border-b border-border bg-secondary/20">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Raw Material *</label>
                      <select value={form.raw_material_id} onChange={e => set("raw_material_id", e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                        <option value="">— Select —</option>
                        {rawMaterials.map(r => <option key={r.id} value={r.id}>{r.material_code ? `${r.material_code} — ` : ""}{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Qty per unit *</label>
                      <input type="number" value={form.qty_per_unit} onChange={e => set("qty_per_unit", e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                      <input value={form.unit} onChange={e => set("unit", e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Scrap Factor</label>
                      <input type="number" step="0.01" value={form.scrap_factor} onChange={e => set("scrap_factor", e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="sm:col-span-3 lg:col-span-5">
                      <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                      <input value={form.notes} onChange={e => set("notes", e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-3">
                    <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
                    <button onClick={handleAdd} disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                      {saving ? "Saving…" : "Add"}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider bg-secondary/20">
                      <th className="px-4 py-2.5 text-left">Raw Material</th>
                      <th className="px-4 py-2.5 text-left">Qty / Unit</th>
                      <th className="px-4 py-2.5 text-left">Unit</th>
                      <th className="px-4 py-2.5 text-left">Scrap ×</th>
                      <th className="px-4 py-2.5 text-left">Effective Qty</th>
                      <th className="px-4 py-2.5 text-left">Notes</th>
                      <th className="px-4 py-2.5 text-left w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {productLines.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No BOM lines yet. Click &quot;Add Line&quot; to start.</td></tr>
                    )}
                    {productLines.map(line => {
                      const rm = rmMap[line.raw_material_id];
                      const effQty = ((+line.qty_per_unit || 0) * (+line.scrap_factor || 1)).toFixed(4);
                      return (
                        <tr key={line.id} className="hover:bg-secondary/40">
                          <td className="px-4 py-3 font-medium">
                            {rm ? (rm.material_code ? `${rm.material_code} — ${rm.name}` : rm.name) : line.raw_material_id}
                          </td>
                          <td className="px-4 py-3 font-mono">{line.qty_per_unit}</td>
                          <td className="px-4 py-3 text-muted-foreground">{line.unit}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{line.scrap_factor ?? 1.05}</td>
                          <td className="px-4 py-3 font-mono font-semibold">{effQty} {line.unit}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{line.notes || "—"}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleDelete(line)} disabled={deleting === line.id}
                              className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
