import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Factory, CheckSquare, Leaf, BookOpen, Wrench, Settings,
  ChevronDown, ChevronUp, ArrowRight, CheckCircle2, Circle,
  BarChart3, Activity, TrendingDown, ClipboardList, ScanLine,
  AlertTriangle, ShieldCheck, Microscope, Ruler, Users,
  FileText, Package, Layers, Truck
} from "lucide-react";

const MODULES = [
  {
    id: "production",
    label: "Production Management",
    icon: Factory,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    tagline: "From job card to dispatch — track every step of production",
    description:
      "The production module digitises your entire manufacturing flow. Capture job card data via AI scan, schedule work orders across stations, and monitor real-time OEE and scrap performance per shift.",
    keyResults: [
      "OEE benchmarking — target ≥65% availability × performance × quality",
      "Downtime root-cause by breakdown code (Mechanical, Electrical, Die, Air, Other)",
      "Scrap variance vs. BOM allowance — identify cost overruns instantly",
      "On-time In-Full (OTIF) delivery % per customer order",
    ],
    quickStart: [
      "1. Add your Products & Raw Materials in Master Data",
      "2. Create a Work Order and assign a station route",
      "3. Log your first shift in Station Log to see OEE calculated live",
    ],
    tools: [
      { label: "Work Orders", path: "/WorkOrders", icon: ClipboardList },
      { label: "Job Card Scan", path: "/JobCardScan", icon: ScanLine },
      { label: "Schedule Board", path: "/ProductionSchedule", icon: BarChart3 },
      { label: "Station Log", path: "/StationLog", icon: Activity },
      { label: "OEE Monitor", path: "/OEE", icon: BarChart3 },
      { label: "Scrap Tracking", path: "/ScrapTracking", icon: TrendingDown },
    ],
  },
  {
    id: "quality",
    label: "Quality Assurance",
    icon: CheckSquare,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
    tagline: "Prevent, detect, respond — close the quality loop",
    description:
      "From inbound raw material inspection through in-process QC to customer complaint management, the quality module gives you complete traceability and a closed-loop corrective action workflow.",
    keyResults: [
      "First-pass yield trend by station — see where defects originate",
      "Customer complaint closure rate & average response time",
      "CAPA effectiveness — track root cause actions to verified close",
      "Instrument calibration status — maintain measurement traceability",
    ],
    quickStart: [
      "1. Inspect incoming raw material batches in RM Inspection",
      "2. Raise an NCR when a non-conformance is found",
      "3. Link the NCR to a CAPA with root cause and due date",
    ],
    tools: [
      { label: "NCR Register", path: "/NCR", icon: AlertTriangle },
      { label: "CAPA Tracker", path: "/CAPA", icon: ShieldCheck },
      { label: "RM Inspection", path: "/RMInspection", icon: Microscope },
      { label: "In-Process QC", path: "/QualityCheck", icon: Ruler },
      { label: "Calibration", path: "/Calibration", icon: Wrench },
      { label: "Customer Complaints", path: "/CustomerComplaints", icon: Users },
    ],
  },
  {
    id: "safety",
    label: "Environment & Safety",
    icon: Leaf,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/30",
    tagline: "Identify hazards, track incidents, demonstrate ESG compliance",
    description:
      "Manage safety risk from hazard identification through incident investigation. Log environmental aspects and track progress against measurable environmental objectives aligned to ISO 14001 & ISO 45001.",
    keyResults: [
      "Lost-time injury (LTI) frequency rate — benchmark safety performance",
      "Near-miss reporting ratio — leading indicator of culture",
      "Environmental aspect significance scores — prioritise controls",
      "Safety inspection completion rate and finding trends",
    ],
    quickStart: [
      "1. Build your HIRA Register for each production station",
      "2. Log all incidents (including near-misses) in Incident Log",
      "3. Register environmental aspects and set measurable objectives",
    ],
    tools: [
      { label: "HIRA Register", path: "/HIRA", icon: AlertTriangle },
      { label: "Incident Log", path: "/Incidents", icon: FileText },
      { label: "Safety Inspections", path: "/SafetyInspections", icon: ShieldCheck },
      { label: "Env Aspects", path: "/EnvAspects", icon: Leaf },
      { label: "Env Objectives", path: "/EnvObjectives", icon: BarChart3 },
    ],
  },
  {
    id: "compliance",
    label: "IMS Compliance",
    icon: BookOpen,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/30",
    tagline: "Audit-ready at all times across ISO 9001, 14001 & 45001",
    description:
      "Map all management system requirements to compliance items, track legal obligations, and manage training competency records. The compliance module gives you a live audit readiness score so you're never caught off-guard.",
    keyResults: [
      "Audit readiness % per ISO standard — know your gaps before auditors do",
      "Training compliance % — who is current, expiring soon, or lapsed",
      "Legal obligation due date alerts — never miss a regulatory deadline",
      "Evidence document linkage for every compliance clause",
    ],
    quickStart: [
      "1. Select your active standards in Standards setup",
      "2. Populate Compliance Items and assign clause owners",
      "3. Add training records for all employees per station competency",
    ],
    tools: [
      { label: "Standards Setup", path: "/Standards", icon: BookOpen },
      { label: "Compliance Items", path: "/Compliance", icon: BookOpen },
      { label: "Obligations", path: "/ComplianceObligations", icon: FileText },
      { label: "Training Records", path: "/Training", icon: Users },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance & Assets",
    icon: Wrench,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/30",
    tagline: "Maximise machine uptime with planned and responsive maintenance",
    description:
      "Register all production assets, raise corrective and preventive maintenance requests, and schedule recurring PM tasks. Link directly to station log breakdown codes for a full picture of machine reliability.",
    keyResults: [
      "Machine uptime % per asset — track availability over time",
      "PM completion rate — are scheduled tasks being done on time?",
      "Corrective vs. preventive maintenance ratio — trending toward prevention",
      "Maintenance cost tracking per asset",
    ],
    quickStart: [
      "1. Register all machines and equipment in Asset Register",
      "2. Create PM Schedules for each asset with frequency and owner",
      "3. Raise Work Requests when breakdowns occur (link to station log)",
    ],
    tools: [
      { label: "Asset Register", path: "/MaintenanceAssets", icon: Wrench },
      { label: "Work Requests", path: "/MaintenanceRequests", icon: ClipboardList },
      { label: "PM Schedules", path: "/PMSchedules", icon: BarChart3 },
    ],
  },
  {
    id: "masterdata",
    label: "Master Data Setup",
    icon: Settings,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/30",
    tagline: "The foundation — accurate master data drives accurate results",
    description:
      "Master data is the backbone of the entire system. Products carry BOM scrap factors that make scrap variance analysis meaningful. Customers and suppliers drive traceability. Downtime codes standardise breakdown analysis.",
    keyResults: [
      "BOM scrap factor accuracy — without it, scrap variance charts are meaningless",
      "Supplier traceability — link every raw material batch to its source",
      "Standardised downtime codes — consistent data = reliable Pareto analysis",
      "Customer credit & payment terms — support order management decisions",
    ],
    quickStart: [
      "1. Add all Products with BOM scrap factors per station",
      "2. Add Raw Materials, Suppliers and link them in RM Batches",
      "3. Configure Downtime Reason Codes before logging Station data",
    ],
    tools: [
      { label: "Products", path: "/Products", icon: Package },
      { label: "Raw Materials", path: "/RawMaterials", icon: Layers },
      { label: "Customers", path: "/Customers", icon: Users },
      { label: "Suppliers", path: "/Suppliers", icon: Truck },
      { label: "Downtime Codes", path: "/DowntimeReasons", icon: AlertTriangle },
    ],
  },
];

function ModuleCard({ module, isComplete, onToggleComplete }) {
  const [open, setOpen] = useState(false);
  const Icon = module.icon;

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${isComplete ? "border-green-400/30" : module.border}`}>
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${module.bg}`}>
          <Icon className={`w-5 h-5 ${module.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{module.label}</h3>
            {isComplete && (
              <span className="text-xs bg-green-400/10 text-green-400 px-2 py-0.5 rounded-full">Reviewed</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{module.tagline}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">{module.tools.length} tools</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-border px-5 py-5 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Key Results */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Results You'll Get</h4>
              <ul className="space-y-2">
                {module.keyResults.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <BarChart3 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${module.color}`} />
                    <span className="text-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Start */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Start</h4>
              <ul className="space-y-2">
                {module.quickStart.map((s, i) => (
                  <li key={i} className="text-sm text-foreground bg-secondary/50 rounded-lg px-3 py-2 border border-border">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tool Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Explore Tools</h4>
            <div className="flex flex-wrap gap-2">
              {module.tools.map(t => {
                const TIcon = t.icon;
                return (
                  <Link
                    key={t.path}
                    to={t.path}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <TIcon className="w-3.5 h-3.5" />
                    {t.label}
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mark complete */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => onToggleComplete(module.id)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${
                isComplete
                  ? "border-green-400/40 text-green-400 bg-green-400/10 hover:bg-green-400/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {isComplete ? "Marked as Reviewed" : "Mark as Reviewed"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Onboarding() {
  const [completed, setCompleted] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      try {
        const saved = JSON.parse(localStorage.getItem("onboarding_completed") || "{}");
        setCompleted(saved);
      } catch {}
    }).catch(() => {});
  }, []);

  const toggleComplete = (id) => {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    localStorage.setItem("onboarding_completed", JSON.stringify(next));
  };

  const reviewedCount = Object.values(completed).filter(Boolean).length;
  const totalCount = MODULES.length;
  const progressPct = Math.round((reviewedCount / totalCount) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl gradient-amber flex items-center justify-center flex-shrink-0">
            <Factory className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome to MacArt IMS{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              This guide walks you through the 6 core modules of the system — what each one does, what results you can derive, and how to get started quickly.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Modules reviewed</span>
            <span className="text-xs font-semibold text-foreground">{reviewedCount} / {totalCount}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {reviewedCount === totalCount && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All modules reviewed — you're ready to go!
            </p>
          )}
        </div>
      </div>

      {/* First 30 Days */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-3">Your First 30 Days — Recommended Setup Order</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { day: "Day 1–2", action: "Set up Products, Raw Materials & Downtime Codes in Master Data", color: "border-slate-400/30 text-slate-400" },
            { day: "Day 3", action: "Register your machines in Asset Register and create PM Schedules", color: "border-cyan-400/30 text-cyan-400" },
            { day: "Day 4–5", action: "Log your first Station Log entries — see OEE and downtime calculated live", color: "border-amber-400/30 text-amber-400" },
            { day: "Week 2", action: "Raise your first NCR and link it to a CAPA with a root cause and due date", color: "border-blue-400/30 text-blue-400" },
            { day: "Week 3", action: "Build the HIRA Register for each station and log near-misses in Incident Log", color: "border-green-400/30 text-green-400" },
            { day: "Week 4", action: "Map compliance items to your active ISO standards and check audit readiness %", color: "border-purple-400/30 text-purple-400" },
          ].map((step, i) => (
            <div key={i} className={`bg-secondary/40 border rounded-lg p-3 ${step.color}`}>
              <div className={`text-xs font-bold mb-1 ${step.color.split(" ")[1]}`}>{step.day}</div>
              <p className="text-sm text-foreground">{step.action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Module Guides</h2>
        {MODULES.map(m => (
          <ModuleCard
            key={m.id}
            module={m}
            isComplete={!!completed[m.id]}
            onToggleComplete={toggleComplete}
          />
        ))}
      </div>

      {/* Footer CTA */}
      <div className="bg-card border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Ready to start?</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Head to Master Data first — everything else depends on it.</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link to="/Products" className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm hover:border-primary/40 transition-colors">
            <Package className="w-4 h-4" /> Products
          </Link>
          <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}