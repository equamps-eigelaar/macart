import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Factory, ClipboardList, CheckSquare, Microscope,
  Ruler, AlertTriangle, ShieldCheck, Leaf, FileText, BookOpen,
  Users, Package, Truck, Layers, Wrench, ChevronDown, Menu, X,
  Settings, BarChart3, Activity, LogOut
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const navGroups = [
  {
    label: "Production",
    icon: Factory,
    color: "text-amber-400",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Work Orders", path: "/WorkOrders", icon: ClipboardList },
      { label: "Station Log", path: "/StationLog", icon: Activity },
      { label: "OEE Monitor", path: "/OEE", icon: BarChart3 },
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
      { label: "Compliance Items", path: "/Compliance", icon: BookOpen },
      { label: "Obligations", path: "/ComplianceObligations", icon: FileText },
      { label: "Training Records", path: "/Training", icon: Users },
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

  const defaultOpen = navGroups.reduce((acc, g) => {
    acc[g.label] = g.items.some(i => i.path === currentPath);
    return acc;
  }, {});
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
      <div className="p-3 border-t border-border">
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

        <main className="flex-1 p-4 md:p-6 max-w-screen-2xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}