import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const STATIONS = ["press","cut_1","cut_2","cut_3","de_form","glue_machine","glue_hand"];
const empty = { work_order_id:"", station:"press", check_type:"dimension", check_date: format(new Date(),"yyyy-MM-dd'T'HH:mm"), inspector:"", spec_min:"", spec_max:"", measured_value:"", result:"pass", notes:"" };

function exportCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(","), ...data.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function QualityCheckPage() {
  const [checks, setChecks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [raisingNcr, setRaisingNcr] = useState(null);

  const load = async () => { const d = await base44.entities.QualityCheck.list("-check_date", 200); setChecks(d); };
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calcResult = (f) => {
    if (!f.measured_value) return "pass";
    const v = +f.measured_value;
    if (f.spec_min && v < +f.spec_min) return "fail";
    if (f.spec_max && v > +f.spec_max) return "fail";
    return "pass";
  };

  const handleSave = async () => {
    await base44.entities.QualityCheck.create({ ...form, result: calcResult(form), measured_value: +form.measured_value });
    setShowForm(false); setForm(empty); load();
  };

  const raiseNcr = async (check) => {
    setRaisingNcr(check.id);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      await base44.entities.NCR.create({
        ncr_number: `NCR-QC-${Date.now().toString().slice(-6)}`,
        title: `QC Fail: ${check.check_type} at ${check.station?.replace(/_/g," ")}`,
        source: "in_process",
        status: "open",
        work_order_id: check.work_order_id || "",
        station: check.station,
        description: `In-process QC check failed.\nStation: ${check.station?.replace(/_/g," ")}\nType: ${check.check_type}\nMeasured: ${check.measured_value}\nSpec: ${check.spec_min ?? "—"} – ${check.spec_max ?? "—"}`,
        detected_by: check.inspector,
        detected_date: today,
        notes: check.notes || "",
      });
      alert("NCR created successfully. Go to NCR Register to view it.");
    } finally {
      setRaisingNcr(null);
    }
  };

  const failCount = checks.filter(c => c.result === "fail").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">In-Process QC</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            In-process quality checks by station
            {failCount > 0 && <span className="text-red-400 ml-2">· {failCount} failed</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(checks, "qc-checks.csv")}
            className="flex items-center gap-2 border border-border px-3 py-2 rounded-lg text-sm hover:bg-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> New Check
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">New Quality Check</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Work Order ID</label>
              <input value={form.work_order_id} onChange={e => set("work_order_id", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Station</label>
              <select value={form.station} onChange={e => set("station", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {STATIONS.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Check Type</label>
              <select value={form.check_type} onChange={e => set("check_type", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["ect","caliper","grammage","dimension","visual","other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Date/Time</label>
              <input type="datetime-local" value={form.check_date} onChange={e => set("check_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Inspector</label>
              <input value={form.inspector} onChange={e => set("inspector", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Spec Min</label>
              <input type="number" value={form.spec_min} onChange={e => set("spec_min", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Spec Max</label>
              <input type="number" value={form.spec_max} onChange={e => set("spec_max", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Measured Value *</label>
              <input type="number" value={form.measured_value} onChange={e => set("measured_value", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" /></div>
            <div className="col-span-2 lg:col-span-4"><label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                {["WO","Station","Type","Date","Inspector","Min","Max","Measured","Result",""].map((h, i) => <th key={i} className="px-4 py-3 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {checks.length === 0 && <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">No checks recorded</td></tr>}
              {checks.map(c => (
                <tr key={c.id} className={`hover:bg-secondary/40 ${c.result === "fail" ? "bg-red-500/5" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs">{c.work_order_id?.slice(0,8) || "—"}</td>
                  <td className="px-4 py-3 capitalize">{c.station?.replace("_"," ")}</td>
                  <td className="px-4 py-3">{c.check_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.check_date?.slice(0,16)}</td>
                  <td className="px-4 py-3">{c.inspector}</td>
                  <td className="px-4 py-3 font-mono">{c.spec_min ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{c.spec_max ?? "—"}</td>
                  <td className="px-4 py-3 font-mono font-bold">{c.measured_value}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${c.result==="pass" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{c.result}</span></td>
                  <td className="px-4 py-3">
                    {c.result === "fail" && (
                      <button
                        onClick={() => raiseNcr(c)}
                        disabled={raisingNcr === c.id}
                        className="flex items-center gap-1 text-xs text-red-400 hover:underline disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {raisingNcr === c.id ? "Creating…" : "Raise NCR"}
                      </button>
                    )}
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
