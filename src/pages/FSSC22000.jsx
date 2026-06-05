import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronRight, X } from "lucide-react";

const PARTS = [
  "Part 1 - Program Overview",
  "Part 2 - Organization Requirements",
  "Part 3 - Assessment Process",
  "Part 4 - CAB Requirements",
];

const PART_SHORT = {
  "Part 1 - Program Overview": "Part 1",
  "Part 2 - Organization Requirements": "Part 2",
  "Part 3 - Assessment Process": "Part 3",
  "Part 4 - CAB Requirements": "Part 4",
};

const STATUS_COLORS = {
  not_yet_started: "bg-slate-600/20 text-slate-400",
  in_progress: "bg-amber-600/20 text-amber-400",
  compliant: "bg-green-600/20 text-green-400",
  non_compliant: "bg-red-600/20 text-red-400",
  not_applicable: "bg-slate-600/10 text-slate-500",
};

const IMPL_COLORS = {
  not_started: "text-slate-500",
  designed: "text-blue-400",
  implemented: "text-amber-400",
  verified: "text-green-400",
};

const PRIORITY_DOT = {
  critical: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-amber-400",
  low: "bg-slate-500",
};

function PartProgress({ reqs }) {
  const total = reqs.length;
  const compliant = reqs.filter(r => r.status === "compliant").length;
  const na = reqs.filter(r => r.status === "not_applicable").length;
  const nc = reqs.filter(r => r.status === "non_compliant").length;
  const pct = total - na > 0 ? Math.round(compliant / (total - na) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span>{compliant}/{total - na} compliant{nc > 0 && <span className="text-red-400 ml-1">· {nc} NC</span>}</span>
    </div>
  );
}

function RequirementRow({ req, onEdit }) {
  return (
    <tr className="hover:bg-secondary/40 transition-colors border-b border-border last:border-0">
      <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{req.section}</td>
      <td className="px-4 py-3 text-sm max-w-md">
        <div className="flex items-start gap-2">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[req.priority]}`} />
          <span>{req.requirement}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[req.status]}`}>
          {req.status?.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-xs">
        <span className={IMPL_COLORS[req.implementation_status]}>
          {req.implementation_status?.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{req.assigned_to || "—"}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{req.due_date || "—"}</td>
      <td className="px-4 py-3">
        <button onClick={() => onEdit(req)} className="text-xs text-primary hover:underline">Update</button>
      </td>
    </tr>
  );
}

export default function FSSC22000() {
  const [reqs, setReqs] = useState([]);
  const [expandedParts, setExpandedParts] = useState({ [PARTS[0]]: true, [PARTS[1]]: true, [PARTS[2]]: true, [PARTS[3]]: true });
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    const data = await base44.entities.FSSCRequirement.list("section", 200);
    setReqs(data);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openEdit = (req) => { setEditing(req); setForm(req); };
  const closeEdit = () => { setEditing(null); setForm({}); };

  const handleSave = async () => {
    await base44.entities.FSSCRequirement.update(editing.id, form);
    closeEdit(); load();
  };

  const filtered = reqs.filter(r => statusFilter === "all" || r.status === statusFilter);

  const grouped = {};
  PARTS.forEach(p => { grouped[p] = filtered.filter(r => r.part === p); });

  const totalReqs = reqs.length;
  const compliantCount = reqs.filter(r => r.status === "compliant").length;
  const naCount = reqs.filter(r => r.status === "not_applicable").length;
  const ncCount = reqs.filter(r => r.status === "non_compliant").length;
  const overallPct = totalReqs - naCount > 0 ? Math.round(compliantCount / (totalReqs - naCount) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">FSSC 22000</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Development Program compliance register</p>
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Status</option>
          {["not_yet_started", "in_progress", "compliant", "non_compliant", "not_applicable"].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Overall progress */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Requirements", value: totalReqs, cls: "text-foreground" },
          { label: "Compliant", value: compliantCount, cls: "text-green-400" },
          { label: "Non-Conforming", value: ncCount, cls: ncCount > 0 ? "text-red-400" : "text-muted-foreground" },
          { label: "Overall Progress", value: `${overallPct}%`, cls: overallPct >= 80 ? "text-green-400" : overallPct >= 50 ? "text-amber-400" : "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-muted-foreground">{editing.section}</div>
              <p className="text-sm mt-1 max-w-2xl">{editing.requirement}</p>
            </div>
            <button onClick={closeEdit} className="p-1.5 hover:bg-secondary rounded-lg flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Compliance Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["not_yet_started", "in_progress", "compliant", "non_compliant", "not_applicable"].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Implementation Stage</label>
              <select value={form.implementation_status} onChange={e => set("implementation_status", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
                {["not_started", "designed", "implemented", "verified"].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
              <input value={form.assigned_to || ""} onChange={e => set("assigned_to", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
              <input type="date" value={form.due_date || ""} onChange={e => set("due_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Evidence Date</label>
              <input type="date" value={form.evidence_date || ""} onChange={e => set("evidence_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Next Review Date</label>
              <input type="date" value={form.review_date || ""} onChange={e => set("review_date", e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1 block">Evidence Notes</label>
              <textarea value={form.evidence_notes || ""} onChange={e => set("evidence_notes", e.target.value)}
                rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={closeEdit} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-secondary">Cancel</button>
            <button onClick={handleSave}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Save</button>
          </div>
        </div>
      )}

      {/* Requirements grouped by Part */}
      {PARTS.map(part => {
        const partReqs = grouped[part];
        const allPartReqs = reqs.filter(r => r.part === part);
        const isOpen = expandedParts[part];
        return (
          <div key={part} className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors"
              onClick={() => setExpandedParts(p => ({ ...p, [part]: !p[part] }))}
            >
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <span className="font-semibold text-sm">{part}</span>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {partReqs.length}{statusFilter !== "all" ? ` shown / ${allPartReqs.length}` : ""}
                </span>
              </div>
              <PartProgress reqs={allPartReqs} />
            </button>
            {isOpen && partReqs.length > 0 && (
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs uppercase tracking-wider bg-secondary/20">
                      <th className="px-4 py-2.5 text-left w-16">Section</th>
                      <th className="px-4 py-2.5 text-left">Requirement</th>
                      <th className="px-4 py-2.5 text-left w-36">Status</th>
                      <th className="px-4 py-2.5 text-left w-28">Implementation</th>
                      <th className="px-4 py-2.5 text-left w-28">Assigned</th>
                      <th className="px-4 py-2.5 text-left w-24">Due</th>
                      <th className="px-4 py-2.5 text-left w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {partReqs.map(req => (
                      <RequirementRow key={req.id} req={req} onEdit={openEdit} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isOpen && partReqs.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground border-t border-border">
                No requirements match the current filter
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
