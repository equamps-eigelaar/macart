import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, ChevronDown, ChevronRight, Loader2, LayoutList, Kanban } from "lucide-react";
import RequirementRow from "../components/compliance/RequirementRow";
import KanbanBoard from "../components/compliance/KanbanBoard";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = {
  "4": "Context of the Organization",
  "5": "Leadership",
  "6": "Planning",
  "7": "Support",
  "8": "Operation",
  "9": "Performance Evaluation",
  "10": "Improvement",
};

export default function Checklist() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const initialSection = urlParams.get("section") || "all";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState(initialSection);
  const [expandedSections, setExpandedSections] = useState(new Set(Object.keys(SECTIONS)));
  const [initializing, setInitializing] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["compliance-items"],
    queryFn: () => base44.entities.ComplianceItem.list("-section", 200),
    initialData: [],
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["compliance-items"] });
  };

  const toggleSection = (section) => {
    const next = new Set(expandedSections);
    if (next.has(section)) next.delete(section);
    else next.add(section);
    setExpandedSections(next);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.clause_id.includes(search);
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      const matchSection = sectionFilter === "all" || item.section === sectionFilter;
      return matchSearch && matchStatus && matchSection;
    });
  }, [items, search, statusFilter, sectionFilter]);

  const groupedItems = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      if (!groups[item.section]) {
        groups[item.section] = {
          title: SECTIONS[item.section] || item.section_title || `Section ${item.section}`,
          items: [],
        };
      }
      groups[item.section].items.push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleInitialize = async () => {
    setInitializing(true);
    const requirements = getISO9001Requirements();
    await base44.entities.ComplianceItem.bulkCreate(requirements);
    handleRefresh();
    setInitializing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 mx-auto flex items-center justify-center mb-6">
          <Filter className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Initialize Your Checklist</h2>
        <p className="text-slate-500 mb-6">
          Load all ISO 9001:2015 requirements (Clauses 4–10) to start tracking your compliance.
        </p>
        <Button
          onClick={handleInitialize}
          disabled={initializing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl"
        >
          {initializing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading Requirements...</>
          ) : (
            "Load ISO 9001:2015 Requirements"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`${viewMode === "kanban" ? "max-w-full" : "max-w-5xl mx-auto"} space-y-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Checklist</h1>
          <p className="text-slate-500 mt-1">{filteredItems.length} of {items.length} requirements shown</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutList className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "kanban" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Kanban className="w-4 h-4" /> Kanban
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by clause or title..."
            className="pl-10 h-10 bg-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-10 bg-white">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
            <SelectItem value="not_applicable">N/A</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-52 h-10 bg-white">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {Object.entries(SECTIONS).map(([num, title]) => (
              <SelectItem key={num} value={num}>
                {num}. {title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <KanbanBoard items={filteredItems} onUpdate={handleRefresh} />
      )}

      {/* Grouped Requirements */}
      {viewMode === "list" && <div className="space-y-4">
        {Object.entries(groupedItems)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([section, group]) => {
            const isExpanded = expandedSections.has(section);
            const compliantCount = group.items.filter((i) => i.status === "compliant").length;
            return (
              <div key={section} className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden">
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center gap-3 p-5 hover:bg-slate-50/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold text-slate-800">
                      Clause {section}: {group.title}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    {compliantCount}/{group.items.length}
                  </Badge>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {group.items
                          .sort((a, b) => a.clause_id.localeCompare(b.clause_id, undefined, { numeric: true }))
                          .map((item) => (
                            <RequirementRow key={item.id} item={item} onUpdate={handleRefresh} />
                          ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
      </div>}
    </div>
  );
}

function getISO9001Requirements() {
  return [
    { clause_id: "4.1", section: "4", section_title: "Context of the Organization", title: "Understanding the organization and its context", description: "Determine external and internal issues relevant to the organization's purpose and strategic direction that affect its ability to achieve intended results of its QMS.", priority: "high" },
    { clause_id: "4.2", section: "4", section_title: "Context of the Organization", title: "Understanding needs and expectations of interested parties", description: "Determine interested parties relevant to the QMS and their requirements. Monitor and review information about these parties.", priority: "high" },
    { clause_id: "4.3", section: "4", section_title: "Context of the Organization", title: "Determining the scope of the QMS", description: "Determine boundaries and applicability of the QMS. The scope shall state types of products/services covered and provide justification for any non-applicable requirement.", priority: "high" },
    { clause_id: "4.4", section: "4", section_title: "Context of the Organization", title: "QMS and its processes", description: "Establish, implement, maintain and continually improve the QMS including needed processes and their interactions. Determine inputs, outputs, sequence, criteria, resources, responsibilities, risks and opportunities.", priority: "critical" },
    { clause_id: "5.1.1", section: "5", section_title: "Leadership", title: "Leadership and commitment — General", description: "Top management shall demonstrate leadership and commitment: accountability for QMS effectiveness, establishing quality policy and objectives, integrating QMS into business processes, promoting process approach and risk-based thinking.", priority: "critical" },
    { clause_id: "5.1.2", section: "5", section_title: "Leadership", title: "Customer focus", description: "Top management shall ensure customer and applicable statutory/regulatory requirements are determined, understood and consistently met. Risks and opportunities affecting conformity are addressed.", priority: "high" },
    { clause_id: "5.2.1", section: "5", section_title: "Leadership", title: "Developing the quality policy", description: "Establish, implement and maintain a quality policy appropriate to the organization's purpose, providing a framework for setting quality objectives, and including commitment to applicable requirements and continual improvement.", priority: "high" },
    { clause_id: "5.2.2", section: "5", section_title: "Leadership", title: "Communicating the quality policy", description: "The quality policy shall be available as documented information, communicated, understood and applied within the organization, and available to relevant interested parties.", priority: "medium" },
    { clause_id: "5.3", section: "5", section_title: "Leadership", title: "Organizational roles, responsibilities and authorities", description: "Top management shall ensure responsibilities and authorities for relevant roles are assigned, communicated and understood. Includes ensuring QMS conformity, process outputs, customer focus promotion, and integrity during changes.", priority: "high" },
    { clause_id: "6.1", section: "6", section_title: "Planning", title: "Actions to address risks and opportunities", description: "Consider issues from 4.1 and 4.2, determine risks and opportunities to assure QMS can achieve intended results, enhance desirable effects, prevent or reduce undesired effects, and achieve improvement. Plan actions to address these.", priority: "critical" },
    { clause_id: "6.2", section: "6", section_title: "Planning", title: "Quality objectives and planning to achieve them", description: "Establish quality objectives at relevant functions, levels and processes. Objectives shall be consistent with quality policy, measurable, monitored, communicated, and updated. Determine what, resources, who, when, and how results evaluated.", priority: "high" },
    { clause_id: "6.3", section: "6", section_title: "Planning", title: "Planning of changes", description: "When changes to the QMS are needed, carry them out in a planned manner considering purpose of changes, integrity of QMS, availability of resources, and allocation of responsibilities.", priority: "medium" },
    { clause_id: "7.1.1", section: "7", section_title: "Support", title: "Resources — General", description: "Determine and provide resources needed for establishment, implementation, maintenance and continual improvement of the QMS. Consider capabilities/constraints of existing internal resources and what needs to be obtained externally.", priority: "high" },
    { clause_id: "7.1.2", section: "7", section_title: "Support", title: "People", description: "Determine and provide persons necessary for effective implementation of QMS and operation and control of its processes.", priority: "medium" },
    { clause_id: "7.1.3", section: "7", section_title: "Support", title: "Infrastructure", description: "Determine, provide and maintain infrastructure necessary for the operation of processes and to achieve conformity of products and services. Includes buildings, equipment, transportation, IT.", priority: "medium" },
    { clause_id: "7.1.4", section: "7", section_title: "Support", title: "Environment for the operation of processes", description: "Determine, provide and maintain the environment necessary for the operation of processes. Includes social, psychological and physical factors.", priority: "medium" },
    { clause_id: "7.1.5", section: "7", section_title: "Support", title: "Monitoring and measuring resources", description: "Determine and provide resources needed for valid and reliable monitoring/measuring results. Ensure resources are suitable, maintained, and retain documented information on fitness for purpose. Includes measurement traceability.", priority: "high" },
    { clause_id: "7.1.6", section: "7", section_title: "Support", title: "Organizational knowledge", description: "Determine knowledge necessary for operation of processes and to achieve conformity. This knowledge shall be maintained and made available. Address changing needs and trends.", priority: "medium" },
    { clause_id: "7.2", section: "7", section_title: "Support", title: "Competence", description: "Determine necessary competence of persons doing work affecting QMS performance. Ensure persons are competent on basis of education, training or experience. Take actions to acquire competence and retain documented information.", priority: "high" },
    { clause_id: "7.3", section: "7", section_title: "Support", title: "Awareness", description: "Ensure persons doing work are aware of: the quality policy, relevant quality objectives, their contribution to QMS effectiveness, and implications of not conforming.", priority: "medium" },
    { clause_id: "7.4", section: "7", section_title: "Support", title: "Communication", description: "Determine internal and external communications relevant to the QMS: what, when, with whom, how, and who communicates.", priority: "medium" },
    { clause_id: "7.5", section: "7", section_title: "Support", title: "Documented information", description: "QMS shall include documented information required by the standard and determined by the organization as necessary. Control creation, updating, and ensure availability, suitability, adequate protection, distribution, access, retrieval, storage, preservation, and retention.", priority: "high" },
    { clause_id: "8.1", section: "8", section_title: "Operation", title: "Operational planning and control", description: "Plan, implement and control processes needed to meet requirements for provision of products and services. Determine requirements, establish criteria, determine resources, implement control, determine and keep documented information.", priority: "high" },
    { clause_id: "8.2", section: "8", section_title: "Operation", title: "Requirements for products and services", description: "Customer communication, determining requirements related to products/services, review of requirements, and changes to requirements. Retain documented information on review results and new requirements.", priority: "high" },
    { clause_id: "8.3", section: "8", section_title: "Operation", title: "Design and development of products and services", description: "Establish, implement and maintain a design and development process. Plan stages, consider nature/duration/complexity, required reviews/verification/validation, responsibilities, resource needs, interfaces, customer involvement, and documented information.", priority: "high" },
    { clause_id: "8.4", section: "8", section_title: "Operation", title: "Control of externally provided processes, products and services", description: "Ensure externally provided processes, products and services conform to requirements. Determine and apply criteria for evaluation, selection, monitoring and re-evaluation of external providers.", priority: "high" },
    { clause_id: "8.5", section: "8", section_title: "Operation", title: "Production and service provision", description: "Implement production and service provision under controlled conditions. Includes documented information, monitoring/measuring, infrastructure, competent persons, validation, actions to prevent human error, and release/delivery/post-delivery activities.", priority: "critical" },
    { clause_id: "8.6", section: "8", section_title: "Operation", title: "Release of products and services", description: "Implement planned arrangements to verify that product and service requirements have been met. Retain documented information on evidence of conformity and traceability to authorizing person(s).", priority: "high" },
    { clause_id: "8.7", section: "8", section_title: "Operation", title: "Control of nonconforming outputs", description: "Ensure outputs that do not conform are identified and controlled. Take appropriate action based on the nature of the nonconformity. Retain documented information describing the nonconformity, actions taken, concessions, and authority.", priority: "high" },
    { clause_id: "9.1", section: "9", section_title: "Performance Evaluation", title: "Monitoring, measurement, analysis and evaluation", description: "Determine what needs to be monitored and measured, methods, when to perform and when to analyse. Evaluate QMS performance and effectiveness. Monitor customer satisfaction. Analyse and evaluate appropriate data.", priority: "high" },
    { clause_id: "9.2", section: "9", section_title: "Performance Evaluation", title: "Internal audit", description: "Conduct internal audits at planned intervals. Plan, establish, implement and maintain audit programme(s). Define audit criteria and scope. Select auditors for objectivity. Report results to relevant management. Take corrective actions. Retain documented information.", priority: "critical" },
    { clause_id: "9.3", section: "9", section_title: "Performance Evaluation", title: "Management review", description: "Top management shall review the QMS at planned intervals. Consider status of actions, changes in external/internal issues, QMS performance and effectiveness, resource adequacy, effectiveness of risk actions, and improvement opportunities. Outputs shall include decisions on improvement, changes needed, and resource needs.", priority: "critical" },
    { clause_id: "10.1", section: "10", section_title: "Improvement", title: "General", description: "Determine and select opportunities for improvement. Implement necessary actions to meet customer requirements and enhance satisfaction. Includes improving products/services, correcting/preventing/reducing undesired effects, and improving QMS performance and effectiveness.", priority: "medium" },
    { clause_id: "10.2", section: "10", section_title: "Improvement", title: "Nonconformity and corrective action", description: "React to nonconformities, take action to control and correct, deal with consequences. Evaluate need to eliminate cause(s). Implement action needed. Review effectiveness. Update risks and opportunities. Make QMS changes if necessary. Retain documented information.", priority: "critical" },
    { clause_id: "10.3", section: "10", section_title: "Improvement", title: "Continual improvement", description: "Continually improve the suitability, adequacy and effectiveness of the QMS. Consider results of analysis and evaluation, and management review outputs, to determine needs or opportunities for continual improvement.", priority: "high" },
  ];
}