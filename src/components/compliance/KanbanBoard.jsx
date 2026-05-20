import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { GripVertical, FileText, User, Calendar, AlertTriangle } from "lucide-react";

const COLUMNS = [
  { id: "not_started", label: "Not Started", color: "bg-slate-100 text-slate-600", headerColor: "bg-slate-200/60 border-slate-300", dotColor: "bg-slate-400" },
  { id: "in_progress", label: "In Progress", color: "bg-amber-50 text-amber-700", headerColor: "bg-amber-100/60 border-amber-300", dotColor: "bg-amber-400" },
  { id: "compliant", label: "Compliant", color: "bg-emerald-50 text-emerald-700", headerColor: "bg-emerald-100/60 border-emerald-300", dotColor: "bg-emerald-500" },
  { id: "non_compliant", label: "Non-Compliant", color: "bg-red-50 text-red-700", headerColor: "bg-red-100/60 border-red-300", dotColor: "bg-red-500" },
];

const priorityColors = {
  low: "text-blue-500",
  medium: "text-amber-500",
  high: "text-orange-500",
  critical: "text-red-600",
};

function KanbanCard({ item, index }) {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white rounded-xl border border-slate-200/60 p-3 shadow-sm select-none transition-shadow ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-emerald-400/40 rotate-1" : "hover:shadow-md"
          }`}
        >
          <div className="flex items-start gap-2">
            <div {...provided.dragHandleProps} className="mt-0.5 text-slate-300 hover:text-slate-500 flex-shrink-0 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-mono text-slate-400 font-semibold">{item.clause_id}</span>
                {item.priority && (
                  <AlertTriangle className={`w-3 h-3 ${priorityColors[item.priority]}`} />
                )}
              </div>
              <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2">{item.title}</p>
              {(item.assigned_to || item.due_date) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.assigned_to && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <User className="w-3 h-3" /> {item.assigned_to}
                    </span>
                  )}
                  {item.due_date && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" /> {item.due_date}
                    </span>
                  )}
                </div>
              )}
              {item.evidence_urls?.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <FileText className="w-3 h-3 text-slate-300" />
                  <span className="text-xs text-slate-400">{item.evidence_urls.length} file{item.evidence_urls.length > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function KanbanColumn({ column, items }) {
  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-3 ${column.headerColor}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
        <span className="text-sm font-semibold text-slate-700">{column.label}</span>
        <span className="ml-auto text-xs font-medium text-slate-500 bg-white/70 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[400px] rounded-xl p-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-emerald-50/60 ring-2 ring-emerald-300/40" : "bg-slate-50/50"
            }`}
          >
            {items.map((item, index) => (
              <KanbanCard key={item.id} item={item} index={index} />
            ))}
            {provided.placeholder}
            {items.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-24 text-xs text-slate-300 border-2 border-dashed border-slate-200 rounded-xl">
                Drop items here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function KanbanBoard({ items, onUpdate }) {
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const item = items.find((i) => i.id === draggableId);
    if (!item || item.status === newStatus) return;

    const data = { status: newStatus };
    if (newStatus === "compliant") data.completion_date = new Date().toISOString().split("T")[0];

    await base44.entities.ComplianceItem.update(draggableId, data);
    onUpdate();
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = items.filter((i) => i.status === col.id);
    return acc;
  }, {});

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn key={col.id} column={col} items={grouped[col.id] || []} />
        ))}
      </div>
    </DragDropContext>
  );
}