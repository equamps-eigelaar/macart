import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const STANDARDS = [
  {
    id: "ISO9001",
    code: "ISO 9001:2015",
    name: "Quality Management Systems",
    area: "Quality",
    description: "Specifies requirements for a quality management system to consistently provide products and services that meet customer and regulatory requirements.",
    module: { label: "IMS Compliance", path: "/Compliance" },
  },
  {
    id: "ISO14001",
    code: "ISO 14001:2015",
    name: "Environmental Management Systems",
    area: "Environment",
    description: "Framework for organisations to manage environmental responsibilities in a systematic manner that contributes to environmental sustainability.",
    module: { label: "Env Aspects", path: "/EnvAspects" },
  },
  {
    id: "ISO45001",
    code: "ISO 45001:2018",
    name: "Occupational Health & Safety",
    area: "Safety",
    description: "Provides a framework to improve employee safety, reduce workplace risks and create better, safer working conditions.",
    module: { label: "HIRA Register", path: "/HIRA" },
  },
  {
    id: "FSSC22000",
    code: "FSSC 22000",
    name: "Food Safety Management",
    area: "Food Safety",
    description: "A globally recognised certification scheme for food safety management, built on ISO 22000 with additional sector-specific requirements.",
    module: { label: "IMS Compliance", path: "/Compliance" },
  },
  {
    id: "ISO22000",
    code: "ISO 22000:2018",
    name: "Food Safety Management Systems",
    area: "Food Safety",
    description: "Specifies requirements for a food safety management system covering all organisations in the food chain.",
    module: { label: "IMS Compliance", path: "/Compliance" },
  },
  {
    id: "BRCGS_FSV9",
    code: "BRCGS Food Safety V9",
    name: "Global Standard for Food Safety",
    area: "Food Safety",
    description: "BRCGS Global Standard for Food Safety sets out requirements for food manufacturers to produce safe, legal and quality products.",
    module: { label: "NCR Register", path: "/NCR" },
  },
  {
    id: "ISO50001",
    code: "ISO 50001:2018",
    name: "Energy Management Systems",
    area: "Energy",
    description: "Supports organisations to develop and implement an energy management system to improve energy performance, efficiency and consumption.",
    module: { label: "Env Objectives", path: "/EnvObjectives" },
  },
];

const AREA_COLORS = {
  Quality: "text-blue-400 bg-blue-500/10",
  Environment: "text-green-400 bg-green-500/10",
  Safety: "text-amber-400 bg-amber-500/10",
  "Food Safety": "text-orange-400 bg-orange-500/10",
  Energy: "text-cyan-400 bg-cyan-500/10",
};

export default function StandardsPage() {
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [form, setForm] = useState({ organisation_name: "", certification_target_date: "", notes: "", active_standards: [] });
  const [saving, setSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const load = async () => {
    const records = await base44.entities.ComplianceProfile.list();
    if (records.length > 0) {
      const p = records[0];
      setProfile(p);
      setProfileId(p.id);
      setForm({
        organisation_name: p.organisation_name || "",
        certification_target_date: p.certification_target_date || "",
        notes: p.notes || "",
        active_standards: p.active_standards || [],
      });
    }
  };

  useEffect(() => { load(); }, []);

  const saveProfile = async () => {
    setSaving(true);
    if (profileId) {
      await base44.entities.ComplianceProfile.update(profileId, form);
    } else {
      const created = await base44.entities.ComplianceProfile.create(form);
      setProfileId(created.id);
    }
    setSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const toggleStandard = async (id) => {
    const current = form.active_standards || [];
    const updated = current.includes(id) ? current.filter(s => s !== id) : [...current, id];
    const newForm = { ...form, active_standards: updated };
    setForm(newForm);
    if (profileId) {
      await base44.entities.ComplianceProfile.update(profileId, newForm);
    } else {
      const created = await base44.entities.ComplianceProfile.create(newForm);
      setProfileId(created.id);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const activeStandards = form.active_standards || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Standards & Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Select active compliance standards and manage your organisation profile</p>
      </div>

      {/* Organisation Profile */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base">Organisation Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Organisation Name</label>
            <input
              value={form.organisation_name}
              onChange={e => set("organisation_name", e.target.value)}
              placeholder="e.g. MacArt (Pty) Ltd"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Certification Target Date</label>
            <input
              type="date"
              value={form.certification_target_date}
              onChange={e => set("certification_target_date", e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
            <input
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Additional notes..."
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
            {profileSaved ? "Saved ✓" : saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Standards Grid */}
      <div>
        <h2 className="font-semibold text-base mb-3">Compliance Standards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {STANDARDS.map(std => {
            const active = activeStandards.includes(std.id);
            return (
              <div
                key={std.id}
                className={`bg-card border rounded-xl p-5 flex flex-col gap-3 transition-all cursor-pointer ${
                  active ? "border-primary/50 bg-primary/5" : "border-border hover:border-border/80 hover:bg-secondary/20"
                }`}
                onClick={() => toggleStandard(std.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-sm text-foreground">{std.code}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{std.name}</div>
                  </div>
                  {active
                    ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    : <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  }
                </div>

                <span className={`self-start text-xs font-medium px-2 py-0.5 rounded-md ${AREA_COLORS[std.area] || "text-muted-foreground bg-secondary"}`}>
                  {std.area}
                </span>

                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{std.description}</p>

                {active && (
                  <Link
                    to={std.module.path}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Go to {std.module.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {activeStandards.length > 0 && (
        <div className="text-sm text-muted-foreground text-center pb-2">
          {activeStandards.length} standard{activeStandards.length !== 1 ? "s" : ""} active
        </div>
      )}
    </div>
  );
}