import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, ExternalLink, ShieldCheck, Leaf, Factory, Beaker } from "lucide-react";

const STANDARDS = [
  {
    id: "ISO9001",
    code: "ISO 9001:2015",
    name: "Quality Management System",
    area: "Quality",
    description: "International standard for quality management systems — customer focus, continuous improvement, and risk-based thinking.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: ShieldCheck,
    module: "/QualityCheck",
    moduleLabel: "Quality Checks",
  },
  {
    id: "ISO14001",
    code: "ISO 14001:2015",
    name: "Environmental Management System",
    area: "Environment",
    description: "Framework for managing environmental responsibilities, reducing waste, and ensuring regulatory compliance.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: Leaf,
    module: "/EnvAspects",
    moduleLabel: "Env Aspects",
  },
  {
    id: "ISO45001",
    code: "ISO 45001:2018",
    name: "Occupational Health & Safety",
    area: "Safety",
    description: "Reduces workplace injuries and illnesses through proactive OHS management, hazard identification, and risk controls.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: ShieldCheck,
    module: "/HIRA",
    moduleLabel: "HIRA Register",
  },
  {
    id: "FSSC22000",
    code: "FSSC 22000",
    name: "Food Safety System Certification",
    area: "Food Safety",
    description: "Global food safety management scheme combining ISO 22000, ISO/TS 22002, and FSSC additional requirements.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: Beaker,
    module: "/FSSC22000",
    moduleLabel: "FSSC 22000 Register",
  },
  {
    id: "ISO22000",
    code: "ISO 22000:2018",
    name: "Food Safety Management System",
    area: "Food Safety",
    description: "International standard for food safety management — hazard analysis, PRPs, and HACCP principles.",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
    icon: Beaker,
    module: "/FSSC22000",
    moduleLabel: "FSSC 22000 Register",
  },
  {
    id: "BRCGS",
    code: "BRCGS Food Safety V9",
    name: "BRC Global Standard for Food Safety",
    area: "Food Safety",
    description: "Retailer-recognised food safety scheme covering site management, hazard analysis, product control, and process control.",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: Factory,
    module: null,
    moduleLabel: null,
  },
  {
    id: "ISO50001",
    code: "ISO 50001:2018",
    name: "Energy Management System",
    area: "Energy",
    description: "Helps organisations improve energy performance, increase energy efficiency, and reduce consumption and costs.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: Leaf,
    module: "/EnvObjectives",
    moduleLabel: "Env Objectives",
  },
];

const AREA_ORDER = ["Quality", "Environment", "Safety", "Food Safety", "Energy"];

function StandardCard({ std, active, onToggle, saving }) {
  const Icon = std.icon;
  return (
    <div className={`bg-card border rounded-xl p-5 flex flex-col gap-3 transition-all ${
      active ? `${std.border} shadow-sm` : "border-border opacity-60 hover:opacity-80"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`w-10 h-10 rounded-lg ${std.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${std.color}`} />
        </div>
        <button
          onClick={() => onToggle(std.id)}
          disabled={saving}
          className="flex-shrink-0 mt-0.5"
          aria-label={active ? "Deactivate" : "Activate"}
        >
          {active
            ? <CheckCircle2 className={`w-6 h-6 ${std.color}`} />
            : <Circle className="w-6 h-6 text-muted-foreground" />}
        </button>
      </div>

      <div>
        <div className={`text-xs font-semibold uppercase tracking-wide ${std.color} mb-0.5`}>{std.area}</div>
        <div className="font-bold text-sm">{std.code}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{std.name}</div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{std.description}</p>

      {active && std.module && (
        <a href={std.module}
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${std.color} hover:underline mt-auto`}>
          <ExternalLink className="w-3.5 h-3.5" />
          Go to {std.moduleLabel}
        </a>
      )}
    </div>
  );
}

export default function Standards() {
  const [profile, setProfile] = useState(null);
  const [activeIds, setActiveIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ organisation_name: "", certification_target_date: "", notes: "" });

  const load = async () => {
    const records = await base44.entities.ComplianceProfile.list("-organisation_name", 1);
    if (records.length > 0) {
      const p = records[0];
      setProfile(p);
      setActiveIds(p.active_standards || []);
      setForm({
        organisation_name: p.organisation_name || "",
        certification_target_date: p.certification_target_date || "",
        notes: p.notes || "",
      });
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    const next = activeIds.includes(id)
      ? activeIds.filter(x => x !== id)
      : [...activeIds, id];
    setActiveIds(next);
    setSaving(true);
    try {
      const patch = { active_standards: next };
      if (profile) {
        await base44.entities.ComplianceProfile.update(profile.id, patch);
      } else {
        const created = await base44.entities.ComplianceProfile.create({ ...form, active_standards: next });
        setProfile(created);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const data = { ...form, active_standards: activeIds };
      if (profile) {
        await base44.entities.ComplianceProfile.update(profile.id, data);
      } else {
        const created = await base44.entities.ComplianceProfile.create(data);
        setProfile(created);
      }
    } finally {
      setSaving(false);
    }
  };

  const grouped = AREA_ORDER.reduce((acc, area) => {
    acc[area] = STANDARDS.filter(s => s.area === area);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Compliance Standards</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select the standards your organisation is working towards or is certified to
          {activeIds.length > 0 && <span className="text-primary ml-2">· {activeIds.length} active</span>}
        </p>
      </div>

      {/* Organisation profile */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-sm">Organisation Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Organisation Name</label>
            <input
              value={form.organisation_name}
              onChange={e => setForm(p => ({ ...p, organisation_name: e.target.value }))}
              placeholder="MacArt Manufacturing"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Certification Target Date</label>
            <input
              type="date"
              value={form.certification_target_date}
              onChange={e => setForm(p => ({ ...p, certification_target_date: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <input
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Scope of certification"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Standards grid by area */}
      {AREA_ORDER.map(area => (
        grouped[area].length > 0 && (
          <div key={area} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{area}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grouped[area].map(std => (
                <StandardCard
                  key={std.id}
                  std={std}
                  active={activeIds.includes(std.id)}
                  onToggle={toggle}
                  saving={saving}
                />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
