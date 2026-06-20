import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Factory, ClipboardList, CheckSquare, Microscope, ScanLine,
  Ruler, AlertTriangle, ShieldCheck, Leaf, FileText, BookOpen,
  Users, Package, Truck, Layers, Wrench, ChevronDown, Menu, X,
  Settings, BarChart3, Activity, LogOut, TrendingDown, GraduationCap, BrainCircuit
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const MODULES_TOTAL = 6;

const BI_WEEKLY_TIPS = [
  { week: 1, tip: "Have you added all your Products and Raw Materials? Master data accuracy drives every other metric in the system." },
  { week: 2, tip: "Try logging your first Station Log shift — watch OEE calculate live and see your first downtime breakdown code appear on the dashboard." },
  { week: 3, tip: "Raise an NCR for any non-conformance you've spotted, then link it to a CAPA with a root cause and due date." },
  { week: 4, tip: "Build your HIRA Register for each production station — even logging near-misses is a leading safety indicator." },
  { week: 5, tip: "Check your Compliance Items page — what's your current audit readiness % for your active ISO standards?" },
  { week: 6, tip: "Review the OEE Monitor: which station has the lowest availability? Use the Downtime Analysis on the dashboard to find the top breakdown codes." },
];

function ProgressReminderBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    try {
      const completed = JSON.parse(localStorage.getItem("onboarding_completed") || "{}");
      const reviewedCount = Object.values(completed).filter(Boolean).length;
      if (reviewedCount >= MODULES_TOTAL) return;

      const lastDismissed = localStorage.getItem("reminder_dismissed_at");
      const now = Date.now();
      const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
      if (lastDismissed && now - parseInt(lastDismissed) < TWO_WEEKS_MS) return;

      const installDate = parseInt(localStorage.getItem("app_install_date") || String(now));
      if (!localStorage.getItem("app_install_date")) {
        localStorage.setItem("app_install_date", String(now));
      }
      const weeksSince = Math.floor((now - installDate) / (7 * 24 * 60 * 60 * 1000));
      const tipIndex = Math.floor(weeksSince / 2) % BI_WEEKLY_TIPS.length;
      setTip({ ...BI_WEEKLY_TIPS[tipIndex], reviewed: reviewedCount });
    } catch {}
  }, []);

  if (!tip || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("reminder_dismissed_at", String(Date.now()));
    setDismissed(true);
  };

  const progressPct = Math.round((tip.reviewed / MODULES_TOTAL) * 100);

  return (
    <div className="bg-amber-400/10 border-b border-amber-400/20 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3">
      <GraduationCap className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-amber-400 mr-2">Implementation Reminder</span>
        <span className="text-xs text-foreground">{tip.tip}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
          {tip.reviewed}/{MODULES_TOTAL} reviewed
        </div>
        <Link to="/Onboarding" className="text-xs text-amber-400 font-medium hover:underline whitespace-nowrap">
          Open Guide →
        </Link>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

const navGroups = [
  {
    label: "Production",
    icon: Factory,
    color: "text-amber-400",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Work Orders", path: "/WorkOrders", icon: ClipboardList },
      { label: "Job Card Scan", path: "/JobCardScan", icon: ScanLine },
      { label: "Schedule Board", path: "/ProductionSchedule", icon: BarChart3 },
      { label: "Station Log", path: "/StationLog", icon: Activity },
      { label: "OEE Monitor", path: "/OEE", icon: BarChart3 },
      { label: "Scrap Tracking", path: "/ScrapTracking", icon: TrendingDown },
      { label: "Customer Orders", path: "/CustomerOrders", icon: ClipboardList },
      { label: "Order Status", path: "/OrderStatusDashboard", icon: Activity },
      { label: "Dispatch", path: "/Dispatch", icon: Truck },
    ]
  },
  {
    label: "Quality",
    icon: CheckSquare,
    color: "text-blue-400",
    items: [
      { label: "NCR Register", path: "/NCR", icon: AlertTriangle },
      { label: "CAPA Tracker", path: "/CAPA", icon: ShieldCheck },
      { label: "RM Inspection", path: "/RMInspection", icon: Microscope },
      { label: "In-Process QC", path: "/QualityCheck", icon: Ruler },
      { label: "Calibration", path: "/Calibration", icon: Wrench },
      { label: "Customer Complaints", path: "/CustomerComplaints", icon: Users },
      { label: "Process Compliance", path: "/ProcessAudits", icon: CheckSquare },
    ]
  },
  {
    label: "Environment & Safety",
    icon: Leaf,
    color: "text-green-400",
    items: [
      { label: "HIRA Register", path: "/HIRA", icon: AlertTriangle },
      { label: "Incident Log", path: "/Incidents", icon: FileText },
      { label: "Env Aspects", path: "/EnvAspects", icon: Leaf },
      { label: "Env Objectives", path: "/EnvObjectives", icon: BarChart3 },
      { label: "Safety Inspections", path: "/SafetyInspections", icon: ShieldCheck },
    ]
  },
  {
    label: "IMS Compliance",
    icon: BookOpen,
    color: "text-purple-400",
    items: [
      { label: "Standards", path: "/Standards", icon: BookOpen },
      { label: "Compliance Items", path: "/Compliance", icon: BookOpen },
      { label: "Obligations", path: "/ComplianceObligations", icon: FileText },
      { label: "Training Records", path: "/Training", icon: Users },
      { label: "Internal Audits", path: "/InternalAudits", icon: FileText },
      { label: "Document Control", path: "/Documents", icon: FileText },
      { label: "Risk & Opportunity", path: "/RiskOpportunity", icon: AlertTriangle },
    ]
  },
  {
    label: "Maintenance",
    icon: Wrench,
    color: "text-cyan-400",
    items: [
      { label: "Asset Register", path: "/MaintenanceAssets", icon: Wrench },
      { label: "Work Requests", path: "/MaintenanceRequests", icon: ClipboardList },
      { label: "PM Schedules", path: "/PMSchedules", icon: BarChart3 },
    ]
  },
  {
    label: "Master Data",
    icon: Settings,
    color: "text-slate-400",
    items: [
      { label: "Products", path: "/Products", icon: Package },
      { label: "Raw Materials", path: "/RawMaterials", icon: Layers },
      { label: "RM Batches", path: "/RMBatches", icon: Layers },
      { label: "FG Batches", path: "/FGBatches", icon: Package },
      { label: "Customers", path: "/Customers", icon: Users },
      { label: "Suppliers", path: "/Suppliers", icon: Truck },
      { label: "Instruments", path: "/Instruments", icon: Wrench },
      { label: "Downtime Reasons", path: "/DowntimeReasons", icon: AlertTriangle },
    ]
  }
];

function NavGroup({ group, isOpen, onToggle, currentPath, onNavigate }) {
  const hasActive = group.items.some(i => i.path === currentPath);
  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
          hasActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <group.icon className={`w-4 h-4 ${group.color}`} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="mt-0.5 ml-2 pl-3 border-l border-border space-y-0.5">
          {group.items.map(item => {
            const active = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState(() => {
    const init = {};
    navGroups.forEach(g => { init[g.label] = g.items.some(i => i.path === currentPath) || g.label === "Production"; });
    return init;
  });

  const toggle = (label) => setOpenGroups(p => ({ ...p, [label]: !p[label] }));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-amber flex items-center justify-center flex-shrink-0">
            <Factory className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground tracking-tight">MacArt IMS</div>
            <div className="text-xs text-muted-foreground">Production · Quality · ESG</div>
          </div>
        </div>
      </div>

      {/* Getting Started pinned link */}
      <div className="px-3 pt-3 pb-1">
        <Link
          to="/Onboarding"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPath === "/Onboarding"
              ? "bg-primary/15 text-primary"
              : "bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
          }`}
        >
          <GraduationCap className="w-4 h-4 flex-shrink-0" />
          Getting Started Guide
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navGroups.map(g => (
          <NavGroup
            key={g.label}
            group={g}
            isOpen={openGroups[g.label]}
            onToggle={() => toggle(g.label)}
            currentPath={currentPath}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/AISettings"
          onClick={() => setMobileOpen(false)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentPath === "/AISettings"
              ? "bg-primary/15 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          AI Settings
        </Link>
        <button
          onClick={() => base44.auth.logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-card border-r border-border sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border z-50">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-secondary">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-amber flex items-center justify-center">
              <Factory className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">MacArt IMS</span>
          </div>
        </header>

        <ProgressReminderBanner />
        <main className="flex-1 p-4 md:p-6 max-w-screen-2xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
