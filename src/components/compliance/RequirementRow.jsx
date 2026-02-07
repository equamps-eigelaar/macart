import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Upload, FileText, Calendar, User, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  not_started: { label: "Not Started", className: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "In Progress", className: "bg-amber-50 text-amber-700 border-amber-200" },
  compliant: { label: "Compliant", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  non_compliant: { label: "Non-Compliant", className: "bg-red-50 text-red-700 border-red-200" },
  not_applicable: { label: "N/A", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

const priorityConfig = {
  low: "bg-blue-50 text-blue-600",
  medium: "bg-amber-50 text-amber-600",
  high: "bg-orange-50 text-orange-600",
  critical: "bg-red-50 text-red-600",
};

export default function RequirementRow({ item, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [assignedTo, setAssignedTo] = useState(item.assigned_to || "");
  const [dueDate, setDueDate] = useState(item.due_date || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleStatusChange = async (newStatus) => {
    const data = { status: newStatus };
    if (newStatus === "compliant") {
      data.completion_date = new Date().toISOString().split("T")[0];
    }
    await base44.entities.ComplianceItem.update(item.id, data);
    onUpdate();
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.ComplianceItem.update(item.id, {
      notes,
      assigned_to: assignedTo,
      due_date: dueDate,
    });
    onUpdate();
    setSaving(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const urls = [...(item.evidence_urls || []), file_url];
    await base44.entities.ComplianceItem.update(item.id, { evidence_urls: urls });
    onUpdate();
    setUploading(false);
  };

  const handleRemoveEvidence = async (idx) => {
    const urls = (item.evidence_urls || []).filter((_, i) => i !== idx);
    await base44.entities.ComplianceItem.update(item.id, { evidence_urls: urls });
    onUpdate();
  };

  const status = statusConfig[item.status] || statusConfig.not_started;

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 hover:border-slate-300/60 transition-all duration-200">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-14 flex-shrink-0">
          <span className="text-xs font-mono font-semibold text-slate-400">{item.clause_id}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-800 truncate">{item.title}</h4>
        </div>
        <Badge variant="outline" className={`text-xs border ${priorityConfig[item.priority] || ""} flex-shrink-0`}>
          {item.priority}
        </Badge>
        <Select value={item.status} onValueChange={handleStatusChange}>
          <SelectTrigger className={`w-36 h-8 text-xs border ${status.className}`} onClick={(e) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
            <SelectItem value="not_applicable">N/A</SelectItem>
          </SelectContent>
        </Select>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 border-t border-slate-100 space-y-4">
              {item.description && (
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <User className="w-3.5 h-3.5" /> Assigned To
                  </label>
                  <Input
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="Person responsible"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Due Date
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes, observations, or action items..."
                  className="text-sm min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">Evidence & Documents</label>
                <div className="space-y-2">
                  {(item.evidence_urls || []).map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate flex-1">
                        {url.split("/").pop() || `Document ${idx + 1}`}
                      </a>
                      <button onClick={() => handleRemoveEvidence(idx)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">
                    {uploading ? "Uploading..." : "Upload evidence file"}
                  </span>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}