import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Camera, X, ImageIcon, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = { quarantine:"bg-amber-500/15 text-amber-400", released:"bg-green-500/15 text-green-400", hold:"bg-orange-500/15 text-orange-400", consumed:"bg-slate-500/15 text-slate-400", rejected:"bg-red-500/15 text-red-400" };
const empty = { batch_id:"", raw_material_id:"", supplier_id:"", supplier_lot_ref:"", received_date: format(new Date(),"yyyy-MM-dd"), qty_received:"", qty_remaining:"", unit:"sheets", status:"quarantine", storage_location:"", supplier_label_photo:"", notes:"" };

export default function RMBatches() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const photoInputRef = useRef(null);

  const load = async () => { const d = await base44.entities.RMBatch.list("-received_date",200); setRecords(d); };
  useEffect(() => { 
    load(); 
    base44.entities.Supplier.list().then(setSuppliers);
  }, []);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setExtracted(null);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("supplier_label_photo", file_url);
    setUploading(false);

    // Auto-extract supplier info from the photo
    setExtracting(true);
    const res = await base44.functions.invoke("extractSupplierFromLabel", { photo_url: file_url });
    const data = res.data;
    setExtracting(false);

    if (data && !data.error) {
      setExtracted(data);
      // Auto-fill fields if they are currently empty
      if (data.lot_ref) setForm(p => ({ ...p, supplier_lot_ref: p.supplier_lot_ref || data.lot_ref }));
      if (data.matched_supplier_id) setForm(p => ({ ...p, supplier_id: p.supplier_id || data.matched_supplier_id }));
      if (data.qty) setForm(p => ({ ...p, qty_received: p.qty_received || data.qty, qty_remaining: p.qty_remaining || data.qty }));
    }
  };

  const applyExtracted = () => {
    if (!extracted) return;
    setForm(p => ({
      ...p,
      supplier_lot_ref: extracted.lot_ref || p.supplier_lot_ref,
      supplier_id: extracted.matched_supplier_id || p.supplier_id,
      qty_received: extracted.qty || p.qty_received,
      qty_remaining: extracted.qty || p.qty_remaining,
    }));
    setExtracted(null);
  };

  const handleSave = async () => {
    if (editing) await base44.entities.RMBatch.update(editing.id, form);
    else await base44.entities.RMBatch.create({ ...form, qty_remaining: form.qty_remaining || form.qty_received });
    setShowForm(false); setEditing(null); setForm(empty); setExtracted(null); load();
  };

  const filtered = records.filter(r => !search || r.batch_id?.toLowerCase().includes(search.toLowerCase()) || r.supplier_lot_ref?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">RM Batches</h1><p className="text-sm text-muted-foreground mt-0.5">Raw material batch tracking</p></div>
        <button onClick={() => { setEditing(null); setForm(empty); setExtracted(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Receive Batch
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Batch" : "Receive New Batch"}</h3>
          {/* AI extraction result banner */}
          {extracting && (
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              Analysing label with AI — extracting supplier info…
            </div>
          )}
          {extracted && !extracting && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                  <Sparkles className="w-4 h-4" /> AI extracted the following from the label
                </div>
                <button onClick={() => setExtracted(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {extracted.supplier_name && <div><span className="text-muted-foreground">Supplier: </span><span className="text-foreground font-medium">{extracted.supplier_name}{extracted.matched_supplier_id ? " ✓ matched" : " (no match)"}</span></div>}
                {extracted.lot_ref && <div><span className="text-muted-foreground">Lot Ref: </span><span className="text-foreground font-medium">{extracted.lot_ref}</span></div>}
                {extracted.raw_material && <div><span className="text-muted-foreground">Material: </span><span className="text-foreground font-medium">{extracted.raw_material}</span></div>}
                {extracted.qty && <div><span className="text-muted-foreground">Qty: </span><span className="text-foreground font-medium">{extracted.qty}</span></div>}
              </div>
              <button onClick={applyExtracted} className="flex items-center gap-1.5 text-xs text-green-400 font-medium hover:underline">
                <CheckCircle2 className="w-3.5 h-3.5" /> Apply to form fields
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{l:"Batch ID *",k:"batch_id"},{l:"Supplier Lot Ref",k:"supplier_lot_ref"},{l:"Received Date",k:"received_date",t:"date"},{l:"Qty Received",k:"qty_received",t:"number"},{l:"Qty Remaining",k:"qty_remaining",t:"number"},{l:"Unit",k:"unit"},{l:"Storage Location",k:"storage_location"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t||"text"} value={form[f.k]} onChange={e => set(f.k, f.t==="number"?+e.target.value:e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            {/* Supplier dropdown */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Supplier</label>
              <select value={form.supplier_id} onChange={e => set("supplier_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["quarantine","released","hold","consumed","rejected"].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>

            {/* Supplier Label Photo */}
            <div className="sm:col-span-3">
              <label className="text-xs text-muted-foreground mb-2 block">Supplier Label / Delivery Note Photo</label>
              <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
                onChange={handlePhotoCapture} className="hidden" />
              {!form.supplier_label_photo ? (
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full justify-center">
                  {uploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    : <><Camera className="w-5 h-5" /> Take / Select Photo of Supplier Label</>}
                </button>
              ) : (
                <div className="relative inline-block">
                  <img src={form.supplier_label_photo} alt="Supplier label"
                    className="max-h-48 rounded-xl border border-border object-contain bg-black" />
                  <button type="button" onClick={() => set("supplier_label_photo", "")}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => photoInputRef.current?.click()}
                    className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                    <Camera className="w-3.5 h-3.5" /> Replace photo
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..."
          className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["Batch ID","Lot Ref","Received","Qty Recv","Qty Rem","Unit","Location","Status","Photo","Actions"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No batches found</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-bold">{r.batch_id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.supplier_lot_ref || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.received_date}</td>
                  <td className="px-4 py-3 font-mono">{r.qty_received?.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{r.qty_remaining?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.unit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.storage_location || "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    {r.supplier_label_photo
                      ? <a href={r.supplier_label_photo} target="_blank" rel="noopener noreferrer">
                          <img src={r.supplier_label_photo} alt="label" className="w-10 h-10 object-cover rounded-md border border-border hover:scale-150 transition-transform" />
                        </a>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
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