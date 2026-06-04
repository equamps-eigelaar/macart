import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, addDays, differenceInDays, parseISO } from "date-fns";
import { AlertTriangle, Clock, CheckCircle2, Truck, Package, Factory, RefreshCw } from "lucide-react";

const STATUS_PIPELINE = ["confirmed", "in_production", "dispatched", "complete"];

const STATUS_META = {
  draft:        { label: "Draft",        color: "text-slate-400",  bg: "bg-slate-500/15",  step: 0 },
  confirmed:    { label: "Confirmed",    color: "text-blue-400",   bg: "bg-blue-500/15",   step: 1 },
  in_production:{ label: "In Production",color: "text-amber-400",  bg: "bg-amber-500/15",  step: 2 },
  dispatched:   { label: "Dispatched",   color: "text-purple-400", bg: "bg-purple-500/15", step: 3 },
  complete:     { label: "Complete",     color: "text-green-400",  bg: "bg-green-500/15",  step: 4 },
  cancelled:    { label: "Cancelled",    color: "text-red-400",    bg: "bg-red-500/15",    step: -1 },
};

const PIPELINE_STEPS = [
  { key: "confirmed",     label: "Confirmed",     icon: CheckCircle2 },
  { key: "in_production", label: "In Production", icon: Factory },
  { key: "dispatched",    label: "Dispatched",    icon: Truck },
  { key: "complete",      label: "Complete",      icon: Package },
];

function deadlineUrgency(requiredDate) {
  if (!requiredDate) return null;
  const days = differenceInDays(parseISO(requiredDate), new Date());
  if (days < 0)  return { level: "overdue", days: Math.abs(days), label: `${Math.abs(days)}d overdue` };
  if (days <= 3) return { level: "critical", days, label: `${days}d left` };
  if (days <= 7) return { level: "warning", days, label: `${days}d left` };
  return { level: "ok", days, label: `${days}d left` };
}

function DeadlineBadge({ requiredDate }) {
  const urg = deadlineUrgency(requiredDate);
  if (!urg) return null;
  const styles = {
    overdue:  "bg-red-500/20 text-red-400 border border-red-500/30",
    critical: "bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse",
    warning:  "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    ok:       "bg-slate-500/10 text-muted-foreground border border-border",
  };
  const icons = {
    overdue: <AlertTriangle className="w-3 h-3" />,
    critical: <AlertTriangle className="w-3 h-3" />,
    warning: <Clock className="w-3 h-3" />,
    ok: <Clock className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[urg.level]}`}>
      {icons[urg.level]} {urg.label}
    </span>
  );
}

function PipelineTrack({ status }) {
  const currentStep = STATUS_META[status]?.step ?? 0;
  return (
    <div className="flex items-center gap-0">
      {PIPELINE_STEPS.map((step, i) => {
        const done = currentStep > i + 1;
        const active = currentStep === i + 1;
        const upcoming = currentStep < i + 1;
        return (
          <React.Fragment key={step.key}>
            <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all flex-shrink-0
              ${done    ? "bg-green-500/20 border-green-500 text-green-400" : ""}
              ${active  ? "bg-amber-500/20 border-amber-500 text-amber-400" : ""}
              ${upcoming? "bg-secondary border-border text-muted-foreground/40" : ""}
            `}>
              <step.icon className="w-3.5 h-3.5" />
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className={`h-0.5 w-5 flex-shrink-0 ${done ? "bg-green-500/60" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function OrderCard({ order, customer, lines, workOrders }) {
  const urg = deadlineUrgency(order.required_date);
  const meta = STATUS_META[order.status] || STATUS_META.draft;
  const totalQty = lines.reduce((s, l) => s + (l.qty_ordered || 0), 0);
  const dispQty  = lines.reduce((s, l) => s + (l.qty_dispatched || 0), 0);
  const pct = totalQty > 0 ? Math.round(dispQty / totalQty * 100) : 0;
  const linkedWOs = workOrders.filter(wo => lines.some(l => l.id === wo.order_line_id));

  const borderColor = {
    overdue: "border-l-red-500",
    critical: "border-l-red-400",
    warning: "border-l-amber-500",
    ok: "border-l-border",
  }[urg?.level] || "border-l-border";

  return (
    <div className={`bg-card border border-border border-l-4 ${borderColor} rounded-xl p-4 space-y-3`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-sm">{order.order_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{customer?.name || "Unknown customer"}</p>
        </div>
        <DeadlineBadge requiredDate={order.required_date} />
      </div>

      {/* Pipeline */}
      {order.status !== "cancelled" && order.status !== "draft" && (
        <div className="flex items-center gap-3">
          <PipelineTrack status={order.status} />
          <span className="text-xs text-muted-foreground">{meta.label}</span>
        </div>
      )}

      {/* Progress */}
      {totalQty > 0 && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{lines.length} line{lines.length !== 1 ? "s" : ""} · {totalQty.toLocaleString()} units</span>
            <span className={pct >= 100 ? "text-green-400" : "text-muted-foreground"}>{pct}% dispatched</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-primary" : "bg-secondary"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* WOs */}
      {linkedWOs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linkedWOs.map(wo => (
            <span key={wo.id} className={`text-xs px-2 py-0.5 rounded border font-mono
              ${wo.status === "in_progress" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                wo.status === "complete"    ? "bg-green-500/10 border-green-500/30 text-green-400" :
                "bg-secondary border-border text-muted-foreground"}`}>
              {wo.wo_number}
            </span>
          ))}
        </div>
      )}

      {/* Dates */}
      {order.required_date && (
        <p className="text-xs text-muted-foreground">Required: {order.required_date}</p>
      )}
    </div>
  );
}

export default function OrderStatusDashboard() {
  const [orders, setOrders]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [lines, setLines]       = useState([]);
  const [workOrders, setWOs]    = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");

  const load = async () => {
    setLoading(true);
    const [o, c, l, w] = await Promise.all([
      base44.entities.CustomerOrder.list("-required_date", 200),
      base44.entities.Customer.list(),
      base44.entities.OrderLine.list("-created_date", 500),
      base44.entities.WorkOrder.list("-planned_start", 200),
    ]);
    setOrders(o); setCustomers(c); setLines(l); setWOs(w);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = orders.filter(o => {
    if (statusFilter === "active")   return ["confirmed", "in_production", "dispatched"].includes(o.status);
    if (statusFilter === "overdue")  return deadlineUrgency(o.required_date)?.level === "overdue" && o.status !== "complete" && o.status !== "cancelled";
    if (statusFilter === "urgent")   return ["overdue","critical","warning"].includes(deadlineUrgency(o.required_date)?.level) && !["complete","cancelled"].includes(o.status);
    return o.status !== "cancelled";
  });

  // Stats
  const activeOrders  = orders.filter(o => ["confirmed","in_production","dispatched"].includes(o.status));
  const overdueOrders = orders.filter(o => deadlineUrgency(o.required_date)?.level === "overdue" && !["complete","cancelled"].includes(o.status));
  const criticalOrders= orders.filter(o => ["overdue","critical"].includes(deadlineUrgency(o.required_date)?.level) && !["complete","cancelled"].includes(o.status));
  const inProdOrders  = orders.filter(o => o.status === "in_production");

  const stats = [
    { label: "Active Orders",    value: activeOrders.length,   color: "text-blue-400",   bg: "bg-blue-500/10",   onClick: () => setStatusFilter("active") },
    { label: "In Production",    value: inProdOrders.length,   color: "text-amber-400",  bg: "bg-amber-500/10",  onClick: () => setStatusFilter("in_production") },
    { label: "Critical / Overdue",value: criticalOrders.length,color: "text-red-400",    bg: "bg-red-500/10",    onClick: () => setStatusFilter("urgent") },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order Status Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live view of active orders from confirmation to dispatch</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 bg-secondary border border-border px-3 py-2 rounded-lg text-sm hover:bg-secondary/80 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <button key={s.label} onClick={s.onClick}
            className={`${s.bg} border border-border rounded-xl p-4 text-left hover:opacity-80 transition-opacity`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "active",  label: "Active" },
          { key: "urgent",  label: "Urgent / Overdue" },
          { key: "all",     label: "All (excl. cancelled)" },
        ].map(t => (
          <button key={t.key} onClick={() => setStatusFilter(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
          No orders match this filter
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              customer={customers.find(c => c.id === order.customer_id)}
              lines={lines.filter(l => l.customer_order_id === order.id)}
              workOrders={workOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
}