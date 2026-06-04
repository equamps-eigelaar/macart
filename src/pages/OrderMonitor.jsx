import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays, parseISO } from "date-fns";
import { AlertTriangle, Clock, CheckCircle2, Package, Truck, Factory, ClipboardList, RefreshCw } from "lucide-react";

const PIPELINE = [
  { key: "draft",        label: "Draft",       icon: ClipboardList, color: "text-slate-400",  bg: "bg-slate-500/15" },
  { key: "confirmed",    label: "Confirmed",   icon: CheckCircle2,  color: "text-blue-400",   bg: "bg-blue-500/15"  },
  { key: "in_production",label: "Production",  icon: Factory,       color: "text-amber-400",  bg: "bg-amber-500/15" },
  { key: "dispatched",   label: "Dispatched",  icon: Truck,         color: "text-purple-400", bg: "bg-purple-500/15"},
  { key: "complete",     label: "Complete",    icon: Package,       color: "text-green-400",  bg: "bg-green-500/15" },
];

function deadlineInfo(requiredDate) {
  if (!requiredDate) return null;
  const days = differenceInDays(parseISO(requiredDate), new Date());
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, level: "overdue" };
  if (days === 0) return { label: "Due today",                  level: "today"   };
  if (days <= 3)  return { label: `${days}d left`,              level: "soon"    };
  if (days <= 7)  return { label: `${days}d left`,              level: "week"    };
  return { label: `${days}d left`, level: "ok" };
}

const DEADLINE_STYLE = {
  overdue: "bg-red-500/15 text-red-400 border border-red-500/30",
  today:   "bg-red-500/15 text-red-400 border border-red-500/30",
  soon:    "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  week:    "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  ok:      "bg-slate-500/10 text-muted-foreground border border-border",
};

const DEADLINE_ICON = {
  overdue: <AlertTriangle className="w-3.5 h-3.5" />,
  today:   <AlertTriangle className="w-3.5 h-3.5" />,
  soon:    <Clock className="w-3.5 h-3.5" />,
  week:    <Clock className="w-3.5 h-3.5" />,
  ok:      null,
};

function PipelineStep({ step, isActive, isPast }) {
  const Icon = step.icon;
  return (
    <div className={`flex flex-col items-center gap-1 flex-1`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
        isActive ? `${step.bg} border-current ${step.color}` :
        isPast   ? "bg-green-500/10 border-green-500/40 text-green-500" :
                   "bg-secondary border-border text-muted-foreground/30"
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`text-xs font-medium hidden sm:block ${isActive ? step.color : isPast ? "text-green-500/70" : "text-muted-foreground/40"}`}>
        {step.label}
      </span>
    </div>
  );
}

function PipelineBar({ status }) {
  const activeIdx = PIPELINE.findIndex(s => s.key === status);
  return (
    <div className="flex items-start gap-0 w-full">
      {PIPELINE.map((step, i) => (
        <React.Fragment key={step.key}>
          <PipelineStep step={step} isActive={i === activeIdx} isPast={i < activeIdx} />
          {i < PIPELINE.length - 1 && (
            <div className={`flex-1 h-0.5 mt-4 transition-colors ${i < activeIdx ? "bg-green-500/40" : "bg-border"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function OrderCard({ order, customer, lines, workOrders }) {
  const dl = deadlineInfo(order.required_date);
  const totalLines = lines.length;
  const completedLines = lines.filter(l => l.status === "complete").length;
  const linesPct = totalLines > 0 ? Math.round(completedLines / totalLines * 100) : 0;

  // Linked WOs progress
  const linkedWOs = workOrders.filter(wo => lines.some(l => l.id === wo.order_line_id));
  const woInProgress = linkedWOs.filter(w => w.status === "in_progress").length;
  const woComplete = linkedWOs.filter(w => w.status === "complete").length;

  const isUrgent = dl && ["overdue", "today", "soon"].includes(dl.level);

  return (
    <div className={`bg-card border rounded-xl p-4 space-y-4 transition-all ${isUrgent ? "border-amber-500/40" : "border-border"}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-sm">{order.order_number}</span>
            <span className="text-muted-foreground text-sm">{customer?.name || "—"}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Ordered {order.order_date}
            {order.required_date && ` · Required ${order.required_date}`}
            {order.total_value && ` · R ${Number(order.total_value).toLocaleString()}`}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {dl && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${DEADLINE_STYLE[dl.level]}`}>
              {DEADLINE_ICON[dl.level]}
              {dl.label}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <PipelineBar status={order.status} />

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold">{totalLines}</div>
          <div className="text-xs text-muted-foreground">{completedLines}/{totalLines} lines done</div>
          <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${linesPct}%` }} />
          </div>
        </div>
        <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold">{linkedWOs.length}</div>
          <div className="text-xs text-muted-foreground">Work Orders</div>
          <div className="text-xs mt-1">
            {woInProgress > 0 && <span className="text-amber-400">{woInProgress} active</span>}
            {woComplete > 0 && <span className="text-green-400 ml-1">{woComplete} done</span>}
            {linkedWOs.length === 0 && <span className="text-muted-foreground/50">none</span>}
          </div>
        </div>
        <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
          {lines.length > 0 ? (
            <>
              <div className="text-lg font-bold">
                {lines.reduce((s, l) => s + (l.qty_dispatched || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">of {lines.reduce((s, l) => s + (l.qty_ordered || 0), 0).toLocaleString()} dispatched</div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-muted-foreground">—</div>
              <div className="text-xs text-muted-foreground">qty dispatched</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderMonitor() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orderLines, setOrderLines] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    const [o, c, ol, wo] = await Promise.all([
      base44.entities.CustomerOrder.list("required_date", 300),
      base44.entities.Customer.list(),
      base44.entities.OrderLine.list("-created_date", 500),
      base44.entities.WorkOrder.list("-planned_start", 300),
    ]);
    setOrders(o);
    setCustomers(c);
    setOrderLines(ol);
    setWorkOrders(wo);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visibleOrders = orders.filter(o => {
    if (statusFilter === "active") return ["draft", "confirmed", "in_production", "dispatched"].includes(o.status);
    if (statusFilter === "urgent") {
      const dl = deadlineInfo(o.required_date);
      return dl && ["overdue", "today", "soon"].includes(dl.level) && o.status !== "complete" && o.status !== "cancelled";
    }
    return o.status === statusFilter;
  });

  // Summary counts
  const urgentCount = orders.filter(o => {
    const dl = deadlineInfo(o.required_date);
    return dl && ["overdue", "today", "soon"].includes(dl.level) && !["complete", "cancelled"].includes(o.status);
  }).length;
  const byStageCounts = {};
  PIPELINE.forEach(s => { byStageCounts[s.key] = orders.filter(o => o.status === s.key).length; });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order Monitor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Production to dispatch · refreshed {format(lastRefresh, "HH:mm")}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border hover:bg-secondary disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PIPELINE.map(s => (
          <div key={s.key} className={`${s.bg} border border-transparent rounded-xl p-3 text-center cursor-pointer transition-all hover:opacity-90`}
            onClick={() => setStatusFilter(s.key)}>
            <div className={`text-xl font-bold ${s.color}`}>{byStageCounts[s.key]}</div>
            <div className={`text-xs font-medium ${s.color}`}>{s.label}</div>
          </div>
        ))}
        <div className={`${urgentCount > 0 ? "bg-red-500/15 border-red-500/30" : "bg-secondary border-transparent"} border rounded-xl p-3 text-center cursor-pointer hover:opacity-90`}
          onClick={() => setStatusFilter("urgent")}>
          <div className={`text-xl font-bold ${urgentCount > 0 ? "text-red-400" : "text-muted-foreground"}`}>{urgentCount}</div>
          <div className={`text-xs font-medium ${urgentCount > 0 ? "text-red-400" : "text-muted-foreground"}`}>Urgent</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "active", label: "Active" },
          { value: "urgent", label: "Urgent / Overdue" },
          ...PIPELINE.map(s => ({ value: s.key, label: s.label })),
        ].map(f => (
          <button key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Order cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-card border border-border rounded-xl h-48 animate-pulse" />)}
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
          No orders match this filter
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              customer={customers.find(c => c.id === order.customer_id)}
              lines={orderLines.filter(l => l.customer_order_id === order.id)}
              workOrders={workOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
}