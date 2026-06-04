import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Factory, ClipboardList, AlertTriangle, ShieldCheck,
  TrendingUp, Package, Activity, CheckCircle2, XCircle, Clock, ArrowRight
} from "lucide-react";
import { format, subDays } from "date-fns";

function StatCard({ label, value, sub, icon: Icon, color, to }) {
  const card = (
    <div className={`bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:border-primary/40 transition-colors ${to ? "cursor-pointer" : ""}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

function OEEGauge({ value }) {
  const color = value >= 65 ? "text-green-400" : value >= 45 ? "text-amber-400" : "text-red-400";
  const bgColor = value >= 65 ? "bg-green-400/10" : value >= 45 ? "bg-amber-400/10" : "bg-red-400/10";
  return (
    <div className={`rounded-xl p-4 flex flex-col items-center justify-center gap-1 ${bgColor} border border-border`}>
      <div className={`text-3xl font-bold font-mono ${color}`}>{value != null ? `${value.toFixed(1)}%` : "—"}</div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">OEE (Today)</div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState({
    openWOs: 0, openNCRs: 0, openCAPAs: 0,
    openIncidents: 0, avgOee: null, dueCalibrations: 0,
    recentNCRs: [], recentCAPAs: []
  });

  useEffect(() => {
    async function load() {
      const today = format(new Date(), "yyyy-MM-dd");
      const [wos, ncrs, capas, incidents, calEvents, instruments, logs] = await Promise.all([
        base44.entities.WorkOrder.filter({ status: "in_progress" }),
        base44.entities.NCR.filter({ status: "open" }),
        base44.entities.CAPA.filter({ status: "open" }),
        base44.entities.Incident.filter({ status: "reported" }),
        base44.entities.CalibrationEvent.list("-calibration_date", 50),
        base44.entities.Instrument.filter({ status: "in_service" }),
        base44.entities.StationLog.filter({ log_date: today }),
      ]);
      const avgOee = logs.length
        ? logs.reduce((s, l) => s + (l.oee || 0), 0) / logs.length
        : null;
      setSummary({
        openWOs: wos.length,
        openNCRs: ncrs.length,
        openCAPAs: capas.length,
        openIncidents: incidents.length,
        avgOee,
        dueCalibrations: instruments.filter(i => i.next_calibration_date && i.next_calibration_date <= today).length,
        recentNCRs: ncrs.slice(0, 4),
        recentCAPAs: capas.slice(0, 4),
      });
    }
    load();
  }, []);

  const statusColor = { open: "text-red-400", in_progress: "text-amber-400", verify: "text-blue-400", closed: "text-green-400" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{format(new Date(), "EEEE, d MMMM yyyy")} · MacArt Manufacturing</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Work Orders Active" value={summary.openWOs} icon={ClipboardList} color="bg-amber-400/10 text-amber-400" to="/WorkOrders" />
        <StatCard label="Open NCRs" value={summary.openNCRs} icon={AlertTriangle} color="bg-red-400/10 text-red-400" to="/NCR" />
        <StatCard label="Open CAPAs" value={summary.openCAPAs} icon={ShieldCheck} color="bg-orange-400/10 text-orange-400" to="/CAPA" />
        <StatCard label="Open Incidents" value={summary.openIncidents} icon={Activity} color="bg-rose-400/10 text-rose-400" to="/Incidents" />
        <StatCard label="Due Calibrations" value={summary.dueCalibrations} icon={Factory} color="bg-purple-400/10 text-purple-400" to="/Calibration" />
        <OEEGauge value={summary.avgOee} />
      </div>

      {/* Open NCRs & CAPAs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Open NCRs</h2>
            <Link to="/NCR" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-border">
            {summary.recentNCRs.length === 0 && <p className="px-5 py-8 text-sm text-muted-foreground text-center">No open NCRs</p>}
            {summary.recentNCRs.map(n => (
              <div key={n.id} className="px-5 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.ncr_number}</div>
                  <div className="text-xs text-muted-foreground truncate">{n.description?.slice(0, 60)}</div>
                </div>
                <span className="text-xs text-muted-foreground">{n.created_date?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-orange-400" /> Open CAPAs</h2>
            <Link to="/CAPA" className="text-xs text-primary flex items-center gap-1 hover:underline">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-border">
            {summary.recentCAPAs.length === 0 && <p className="px-5 py-8 text-sm text-muted-foreground text-center">No open CAPAs</p>}
            {summary.recentCAPAs.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.capa_number} — {c.title}</div>
                  <div className="text-xs text-muted-foreground">Owner: {c.owner || "—"} · Due: {c.due_date || "—"}</div>
                </div>
                <span className={`text-xs font-medium ${statusColor[c.status] || "text-muted-foreground"}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Log Station", to: "/StationLog", icon: Activity, color: "border-amber-400/30 hover:border-amber-400/60" },
            { label: "Raise NCR", to: "/NCR", icon: AlertTriangle, color: "border-red-400/30 hover:border-red-400/60" },
            { label: "Report Incident", to: "/Incidents", icon: XCircle, color: "border-rose-400/30 hover:border-rose-400/60" },
            { label: "RM Inspection", to: "/RMInspection", icon: Package, color: "border-blue-400/30 hover:border-blue-400/60" },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className={`bg-card border rounded-xl p-4 flex flex-col items-center gap-2 transition-colors ${a.color}`}>
              <a.icon className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}