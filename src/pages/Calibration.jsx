import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function CalibrationPage() {
  const [instruments, setInstruments] = useState([]);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ instrument_id:"", calibration_date: format(new Date(),"yyyy-MM-dd"), performed_by:"", calibrated_by_external:false, certificate_ref:"", result:"pass", next_due_date:"", notes:"" });
  const today = format(new Date(),"yyyy-MM-dd");

  const load = async () => {
    const [ins, ev] = await Promise.all([
      base44.entities.Instrument.list(),
      base44.entities.CalibrationEvent.list("-calibration_date", 200)
    ]);
    setInstruments(ins); setEvents(ev);
  };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    await base44.entities.CalibrationEvent.create(form);
    // update instrument last/next calibration
    const inst = instruments.find(i => i.id === form.instrument_id || i.instrument_id === form.instrument_id);
    if (inst) await base44.entities.Instrument.update(inst.id, { last_calibration_date: form.calibration_date, next_calibration_date: form.next_due_date, status: form.result === "fail" ? "out_of_service" : "in_service" });
    setShowForm(false); load();
  };

  const overdue = instruments.filter(i => i.next_calibration_date && i.next_calibration_date < today && i.status === "in_service");
  const dueSoon = instruments.filter(i => i.next_calibration_date && i.next_calibration_date >= today && i.next_calibration_date <= format(new Date(Date.now() + 30*24*60*60*1000),"yyyy-MM-dd") && i.status === "in_service");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Calibration</h1><p className="text-sm text-muted-foreground mt-0.5">Instrument calibration status & events</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Log Calibration
        </button>
      </div>

      {/* Alerts */}
      {overdue.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div><p className="text-sm font-medium text-red-400">Overdue Calibrations: {overdue.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{overdue.map(i => i.name).join(", ")}</p></div>
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div><p className="text-sm font-medium text-amber-400">Due within 30 days: {dueSoon.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{dueSoon.map(i => i.name).join(", ")}</p></div>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">Log Calibration Event</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Instrument</label>
              <select value={form.instrument_id} onChange={e => set("instrument_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                <option value="">— Select —</option>
                {instruments.map(i => <option key={i.id} value={i.id}>{i.instrument_id} — {i.name}</option>)}
              </select></div>
            {[{l:"Calibration Date",k:"calibration_date",t:"date"},{l:"Performed By",k:"performed_by",t:"text"},{l:"Certificate Ref",k:"certificate_ref",t:"text"},{l:"Next Due Date",k:"next_due_date",t:"date"}].map(f => (
              <div key={f.k}><label className="text-xs text-muted-foreground mb-1 block">{f.l}</label>
                <input type={f.t} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            ))}
            <div><label className="text-xs text-muted-foreground mb-1 block">Result</label>
              <select value={form.result} onChange={e => set("result", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["pass","fail","adjusted_pass"].map(r => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
              </select></div>
            <div className="flex items-center gap-3 mt-5">
              <input type="checkbox" checked={form.calibrated_by_external} onChange={e => set("calibrated_by_external", e.target.checked)} className="w-4 h-4 accent-primary" />
              <label className="text-sm">External Lab</label>
            </div>
            <div className="col-span-2 sm:col-span-3"><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      {/* Instruments status */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold">Instrument Status</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              {["ID","Name","Type","Location","Last Cal","Next Due","Status"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {instruments.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No instruments registered</td></tr>}
              {instruments.map(i => {
                const isOverdue = i.next_calibration_date && i.next_calibration_date < today;
                return (
                  <tr key={i.id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-mono">{i.instrument_id}</td>
                    <td className="px-4 py-3 font-medium">{i.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.location || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{i.last_calibration_date || "—"}</td>
                    <td className={`px-4 py-3 font-medium ${isOverdue ? "text-red-400" : "text-foreground"}`}>{i.next_calibration_date || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${i.status === "in_service" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{i.status?.replace("_"," ")}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}