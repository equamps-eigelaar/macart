import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, addDays } from "date-fns";
import { Calendar, GripVertical, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const STATIONS = ["press", "cut_1", "cut_2", "cut_3", "de_form", "glue_machine", "glue_hand"];
const STATION_LABELS = {
  press: "Press", cut_1: "Cut 1", cut_2: "Cut 2", cut_3: "Cut 3",
  de_form: "De-Form", glue_machine: "Glue (Machine)", glue_hand: "Glue (Hand)"
};
const UNASSIGNED = "__unassigned__";

const STATUS_COLORS = {
  draft: "border-l-slate-500 bg-slate-500/5",
  released: "border-l-blue-500 bg-blue-500/5",
  in_progress: "border-l-amber-500 bg-amber-500/5",
  complete: "border-l-green-500 bg-green-500/5",
  on_hold: "border-l-orange-500 bg-orange-500/5",
  cancelled: "border-l-red-500 bg-red-500/5",
};
const STATUS_BADGE = {
  draft: "text-slate-400",
  released: "text-blue-400",
  in_progress: "text-amber-400",
  complete: "text-green-400",
  on_hold: "text-orange-400",
  cancelled: "text-red-400",
};

const today = format(new Date(), "yyyy-MM-dd");
const soonDate = format(addDays(new Date(), 3), "yyyy-MM-dd");

function urgency(wo) {
  if (!wo.planned_end) return "normal";
  if (wo.planned_end < today) return "overdue";
  if (wo.planned_end <= soonDate) return "soon";
  return "normal";
}

function WOCard({ wo, index, products }) {
  const product = products.find(p => p.id === wo.product_id);
  const urg = urgency(wo);
  const pct = wo.qty_planned > 0 ? Math.round((wo.qty_produced || 0) / wo.qty_planned * 100) : 0;

  return (
    <Draggable draggableId={wo.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`rounded-lg border-l-4 border border-border p-3 mb-2 select-none transition-shadow
            ${STATUS_COLORS[wo.status] || "bg-secondary/20"}
            ${snapshot.isDragging ? "shadow-xl ring-1 ring-primary/40 opacity-95" : "hover:border-border/80"}
          `}
        >
          <div className="flex items-start gap-2">
            <div {...provided.dragHandleProps} className="mt-0.5 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0">
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-mono text-xs font-bold truncate">{wo.wo_number}</span>
                <span className={`text-xs font-medium flex-shrink-0 ${STATUS_BADGE[wo.status]}`}>
                  {wo.status?.replace(/_/g, " ")}
                </span>
              </div>
              {product && (
                <p className="text-xs text-muted-foreground truncate">{product.product_code} — {product.name}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{(wo.qty_produced || 0).toLocaleString()} / {wo.qty_planned?.toLocaleString()}</span>
                {urg === "overdue" && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                {urg === "soon" && <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                {urg === "normal" && wo.planned_end && <CheckCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />}
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-amber-500" : "bg-slate-600"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              {wo.planned_end && (
                <div className={`text-xs mt-1.5 flex items-center gap-1 ${urg === "overdue" ? "text-red-400" : urg === "soon" ? "text-amber-400" : "text-muted-foreground"}`}>
                  <Calendar className="w-3 h-3" />
                  Due {wo.planned_end}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function StationColumn({ station, wos, products }) {
  const label = STATION_LABELS[station] || station;
  const overdue = wos.filter(w => urgency(w) === "overdue").length;
  const inProgress = wos.filter(w => w.status === "in_progress").length;

  return (
    <div className="flex flex-col bg-card border border-border rounded-xl overflow-hidden min-w-[200px] max-w-[240px] flex-shrink-0">
      <div className="px-3 py-2.5 border-b border-border bg-secondary/30 flex items-center justify-between">
        <span className="font-semibold text-sm">{label}</span>
        <div className="flex items-center gap-1.5">
          {overdue > 0 && (
            <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-medium">{overdue} late</span>
          )}
          {inProgress > 0 && (
            <span className="text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded font-medium">{inProgress} active</span>
          )}
          <span className="text-xs text-muted-foreground">{wos.length}</span>
        </div>
      </div>
      <Droppable droppableId={station}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 min-h-[300px] transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 border-primary/20" : ""}`}
          >
            {wos.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-xs text-muted-foreground/50 text-center mt-6">No orders</div>
            )}
            {wos.map((wo, i) => (
              <WOCard key={wo.id} wo={wo} index={i} products={products} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function ProductionSchedule() {
  const [workOrders, setWorkOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [wos, prods] = await Promise.all([
      base44.entities.WorkOrder.list("planned_end", 300),
      base44.entities.Product.list(),
    ]);
    setWorkOrders(wos);
    setProducts(prods);
  };

  useEffect(() => { load(); }, []);

  const visibleWOs = workOrders.filter(wo => {
    if (statusFilter === "active") return ["released", "in_progress", "draft"].includes(wo.status);
    if (statusFilter === "all") return wo.status !== "cancelled";
    return wo.status === statusFilter;
  });

  // Group by primary station (first in station_route) or unassigned
  const grouped = {};
  [...STATIONS, UNASSIGNED].forEach(s => { grouped[s] = []; });
  visibleWOs.forEach(wo => {
    const primary = wo.station_route?.[0] || UNASSIGNED;
    const key = STATIONS.includes(primary) ? primary : UNASSIGNED;
    grouped[key].push(wo);
  });

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStation = destination.droppableId;
    const wo = workOrders.find(w => w.id === draggableId);
    if (!wo) return;

    // Update local state optimistically
    const updatedRoute = newStation === UNASSIGNED ? [] : [newStation, ...(wo.station_route || []).filter(s => s !== wo.station_route?.[0])];
    setWorkOrders(prev => prev.map(w => w.id === draggableId ? { ...w, station_route: updatedRoute } : w));

    // Persist
    setSaving(true);
    await base44.entities.WorkOrder.update(draggableId, { station_route: updatedRoute });
    setSaving(false);
  };

  const totalActive = workOrders.filter(w => ["released", "in_progress"].includes(w.status)).length;
  const totalOverdue = workOrders.filter(w => urgency(w) === "overdue" && !["complete", "cancelled"].includes(w.status)).length;
  const unassignedCount = grouped[UNASSIGNED].length;

  return (
    <div className="space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Production Schedule</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Drag orders between stations to reassign</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {saving && <span className="text-xs text-muted-foreground animate-pulse">Saving…</span>}
          {totalOverdue > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-500/15 text-red-400 px-2.5 py-1 rounded-lg font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> {totalOverdue} overdue
            </span>
          )}
          {unassignedCount > 0 && (
            <span className="text-xs bg-slate-500/15 text-slate-400 px-2.5 py-1 rounded-lg font-medium">
              {unassignedCount} unassigned
            </span>
          )}
          <span className="text-xs bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-lg font-medium">
            {totalActive} active
          </span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="active">Active (Draft + Released + In Progress)</option>
            <option value="released">Released only</option>
            <option value="in_progress">In Progress only</option>
            <option value="all">All (excl. cancelled)</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Overdue</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> Due in ≤3 days</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/80" /> In Progress</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-500/80" /> Released</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-500/80" /> Draft</span>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATIONS.map(station => (
            <StationColumn
              key={station}
              station={station}
              wos={grouped[station]}
              products={products}
            />
          ))}
          {/* Unassigned column */}
          <div className="flex flex-col bg-card border border-dashed border-border rounded-xl overflow-hidden min-w-[200px] max-w-[240px] flex-shrink-0">
            <div className="px-3 py-2.5 border-b border-border bg-secondary/10 flex items-center justify-between">
              <span className="font-semibold text-sm text-muted-foreground">Unassigned</span>
              <span className="text-xs text-muted-foreground">{grouped[UNASSIGNED].length}</span>
            </div>
            <Droppable droppableId={UNASSIGNED}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-2 min-h-[300px] ${snapshot.isDraggingOver ? "bg-primary/5" : ""}`}
                >
                  {grouped[UNASSIGNED].length === 0 && !snapshot.isDraggingOver && (
                    <div className="text-xs text-muted-foreground/50 text-center mt-6">Drop here to unassign</div>
                  )}
                  {grouped[UNASSIGNED].map((wo, i) => (
                    <WOCard key={wo.id} wo={wo} index={i} products={products} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}