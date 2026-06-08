import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2, X, Save, Search, CheckCircle2 } from "lucide-react";

const F = ({ label, children }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

const Inp = ({ value, onChange, type = "text", placeholder, readOnly }) => (
  <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
    className={`w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary ${readOnly ? "bg-muted text-muted-foreground" : "bg-secondary"}`} />
);

const CB = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer">
    <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-primary" />
    {label}
  </label>
);

export default function JobCardScan() {
  const photoRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [woSearch, setWoSearch] = useState("");
  const [matchedWO, setMatchedWO] = useState(null);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
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
    total_run: "", notes: "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSaved(false);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhoto(file_url);
    setUploading(false);
    // Auto-extract using AI
    setExtracting(true);
    const extracted = await base44.integrations.Core.InvokeLLM({
      prompt: `You are extracting data from a manufacturing job card / master card photo.
      Extract all visible fields and return them in the JSON schema below.
      For boolean fields (finish_glue, finish_stitch etc.), set true if that option appears ticked/checked/marked.
      If a field is not visible or blank, return an empty string or false for booleans.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          master_number: { type: "string" },
          ac_number: { type: "string" },
          customer_name: { type: "string" },
          customer_ref: { type: "string" },
          box_size: { type: "string" },
          box_style: { type: "string" },
          die_no: { type: "string" },
          sheet_spec: { type: "string" },
          board_spec: { type: "string" },
          board_area: { type: "string" },
          board_weight: { type: "string" },
          board_spec_detail: { type: "string" },
          finish_glue: { type: "boolean" },
          finish_stitch: { type: "boolean" },
          finish_tape: { type: "boolean" },
          finish_plain: { type: "boolean" },
          finish_1col: { type: "boolean" },
          finish_2col: { type: "boolean" },
          finish_3col: { type: "boolean" },
          basis_mass: { type: "string" },
          panel_creases: { type: "string" },
          flap_creases: { type: "string" },
          special_instructions: { type: "string" },
          commodity: { type: "string" },
          contact_person: { type: "string" },
          contact_phone: { type: "string" },
          delivery_address: { type: "string" },
          postal_address: { type: "string" },
          vat_btw_number: { type: "string" },
          quote_number: { type: "string" },
          qty_sheets_received: { type: "string" },
          printer_run: { type: "string" },
          printer_waste: { type: "string" },
          mpact_waste: { type: "string" },
          die_cut_waste: { type: "string" },
          glue_waste: { type: "string" },
          screenprint_waste: { type: "string" },
          total_run: { type: "string" },
          notes: { type: "string" }
        }
      }
    });
    setForm(p => ({ ...p, ...extracted }));
    setExtracting(false);
  };

  const handleSearchWO = async () => {
    if (!woSearch.trim()) return;
    setSearching(true);
    const results = await base44.entities.WorkOrder.list("-planned_start", 200);
    const match = results.find(w =>
      w.wo_number?.toLowerCase() === woSearch.toLowerCase() ||
      w.master_number?.toLowerCase() === woSearch.toLowerCase()
    );
    setMatchedWO(match || null);
    setSearching(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const numeric = ["qty_sheets_received","printer_run","printer_waste","mpact_waste","die_cut_waste","glue_waste","screenprint_waste","total_run"];
    const payload = { ...form, job_card_photo: photo };
    numeric.forEach(k => { if (payload[k] !== "" && payload[k] !== undefined) payload[k] = +payload[k]; });

    if (matchedWO) {
      await base44.entities.WorkOrder.update(matchedWO.id, payload);
    } else {
      await base44.entities.WorkOrder.create({
        ...payload,
        wo_number: form.master_number || `SCAN-${Date.now()}`,
        qty_planned: +form.total_run || 0,
        planned_start: new Date().toISOString().split("T")[0],
        status: "draft",
      });
    }
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Job Card Scan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Photograph a completed job card — fields are extracted automatically via AI
        </p>
      </div>

      {/* Photo capture */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold">1. Capture Job Card</h4>
        <input ref={photoRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhotoCapture} className="hidden" />

        {!photo ? (
          <button onClick={() => photoRef.current?.click()} disabled={uploading}
            className="flex items-center justify-center gap-2 w-full py-10 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            {uploading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
              : <><Camera className="w-6 h-6" /> Take Photo / Select from Gallery</>}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img src={photo} alt="Job card" className="max-h-64 rounded-xl border border-border object-contain bg-black" />
              <button onClick={() => { setPhoto(null); setSaved(false); }}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {extracting && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Extracting fields from image…
              </div>
            )}
            {!extracting && (
              <button onClick={() => photoRef.current?.click()}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Replace photo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Link to existing WO */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold">2. Link to Existing Work Order (optional)</h4>
        <div className="flex gap-2">
          <input value={woSearch} onChange={e => setWoSearch(e.target.value)}
            placeholder="WO number or Master No…"
            onKeyDown={e => e.key === "Enter" && handleSearchWO()}
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={handleSearchWO} disabled={searching}
            className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm hover:bg-border transition-colors">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>
        {matchedWO && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4" />
            Matched: <strong>{matchedWO.wo_number}</strong> — data will be merged into this work order
          </div>
        )}
        {woSearch && !matchedWO && !searching && (
          <p className="text-xs text-muted-foreground">No match found — a new Work Order will be created on save.</p>
        )}
      </div>

      {/* Extracted / editable fields */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-6">
        <h4 className="text-sm font-semibold">3. Review &amp; Edit Extracted Data</h4>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Header</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <F label="Master No."><Inp value={form.master_number} onChange={e => set("master_number", e.target.value)} /></F>
            <F label="A/C No."><Inp value={form.ac_number} onChange={e => set("ac_number", e.target.value)} /></F>
            <F label="Customer"><Inp value={form.customer_name} onChange={e => set("customer_name", e.target.value)} /></F>
            <F label="Ref / F No."><Inp value={form.customer_ref} onChange={e => set("customer_ref", e.target.value)} /></F>
            <F label="Quote No."><Inp value={form.quote_number} onChange={e => set("quote_number", e.target.value)} /></F>
            <F label="VAT / BTW No."><Inp value={form.vat_btw_number} onChange={e => set("vat_btw_number", e.target.value)} /></F>
            <F label="Commodity"><Inp value={form.commodity} onChange={e => set("commodity", e.target.value)} /></F>
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Box Spec</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <F label="Size"><Inp value={form.box_size} onChange={e => set("box_size", e.target.value)} /></F>
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
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Finish / Colours</p>
          <div className="flex flex-wrap gap-6">
            {[["Glue","finish_glue"],["Stitch","finish_stitch"],["Tape","finish_tape"],["Plain","finish_plain"],
              ["1 Col","finish_1col"],["2 Col","finish_2col"],["3 Col","finish_3col"]].map(([l,k]) => (
              <CB key={k} label={l} checked={form[k]} onChange={v => set(k, v)} />
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Run Data</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[["Sheets Recv","qty_sheets_received"],["Printer Run","printer_run"],["Printer Waste","printer_waste"],
              ["Mpact Waste","mpact_waste"],["Die Cut Waste","die_cut_waste"],["Glue Waste","glue_waste"],
              ["Screenprint Waste","screenprint_waste"],["Total Run","total_run"]].map(([l,k]) => (
              <F key={k} label={l}><Inp type="number" value={form[k]} onChange={e => set(k, e.target.value)} /></F>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contact &amp; Delivery</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Contact Person"><Inp value={form.contact_person} onChange={e => set("contact_person", e.target.value)} /></F>
            <F label="Phone"><Inp value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} /></F>
            <F label="Delivery Address">
              <textarea value={form.delivery_address ?? ""} onChange={e => set("delivery_address", e.target.value)}
                rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </F>
            <F label="Postal Address">
              <textarea value={form.postal_address ?? ""} onChange={e => set("postal_address", e.target.value)}
                rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </F>
            <F label="Special Instructions">
              <textarea value={form.special_instructions ?? ""} onChange={e => set("special_instructions", e.target.value)}
                rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </F>
            <F label="Notes">
              <textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)}
                rows={2} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </F>
          </div>
        </section>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4" /> Saved successfully
          </span>
        )}
        <button onClick={handleSave} disabled={saving || extracting}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {matchedWO ? "Update Work Order" : "Save as New Work Order"}
        </button>
      </div>
    </div>
  );
}