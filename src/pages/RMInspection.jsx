import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";

const empty = { rm_batch_id:"", inspection_date: format(new Date(),"yyyy-MM-dd"), inspector:"", ect_result:"", ect_spec_min:"", caliper_result:"", caliper_spec_min:"", caliper_spec_max:"", grammage_result:"", grammage_spec_min:"", grammage_spec_max:"", visual_ok:true, result:"pass", notes:"" };

export default function RMInspectionPage() {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const load = async () => { const d = await base44.entities.RMInspection.list("-inspection_date", 200); setRecords(d); };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const autoResult = (f) => {
    const ectOk = !f.ect_result || !f.ect_spec_min || +f.ect_result >= +f.ect_spec_min;
    const calOk = !f.caliper_result || !f.caliper_spec_min || !f.caliper_spec_max || (+f.caliper_result >= +f.caliper_spec_min && +f.caliper_result <= +f.caliper_spec_max);
    const gramOk = !f.grammage_result || !f.grammage_spec_min || !f.grammage_spec_max || (+f.grammage_result >= +f.grammage_spec_min && +f.grammage_result <= +f.grammage_spec_max);
    return (ectOk && calOk && gramOk && f.visual_ok) ? "pass" : "fail";
  };

  const handleSave = async () => {
    const result = autoResult(form);
    await base44.entities.RMInspection.create({ ...form, result });
    setShowForm(false); setForm(empty); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">RM Inspection</h1><p className="text-sm text-muted-foreground mt-0.5">Raw material incoming quality control</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Inspection
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">New RM Inspection</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              {l:"RM Batch ID *",k:"rm_batch_id",type:"text"},
              {l:"Date *",k:"inspection_date",type:"date"},
              {l:"Inspector *",k:"inspector",type:"text"},
              {l:"ECT Result (kN/m)",k:"ect_result",type:"number"},
              {l:"ECT Min Spec",k:"ect_spec_min",type:"number"},
              {l:"Caliper Result (mm)",k:"caliper_result",type:"number"},
              {l:"Caliper Min",k:"caliper_spec_min",type:"number"},
              {l:"Caliper Max",k:"caliper_spec_max",type:"number"},
              {l:"Grammage Result (g/m²)",k:"grammage_result",type:"number"},
              {l:"Grammage Min",k:"grammage_spec_min",type:"number"},
              {l:"Grammage Max",k:"grammage_spec_max",type:"number"},
            ].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.type} value={form[f.k]} onChange={e => set(f.k, f.type==="number" ? e.target.value : e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div className="flex items-center gap-3 mt-6">
              <input type="checkbox" id="visual_ok" checked={form.visual_ok} onChange={e => set("visual_ok", e.target.checked)} className="w-4 h-4 accent-primary" />
              <label htmlFor="visual_ok" className="text-sm">Visual OK</label>
            </div>
            <div className="col-span-2 lg:col-span-4">
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save Inspection</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                {["Batch","Date","Inspector","ECT","Caliper","Grammage","Visual","Result"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No inspections recorded</td></tr>}
              {records.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono font-medium">{r.rm_batch_id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.inspection_date}</td>
                  <td className="px-4 py-3">{r.inspector}</td>
                  <td className="px-4 py-3 font-mono">{r.ect_result ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{r.caliper_result ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{r.grammage_result ?? "—"}</td>
                  <td className="px-4 py-3">{r.visual_ok ? "✓" : "✗"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${r.result === "pass" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{r.result}</span>
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