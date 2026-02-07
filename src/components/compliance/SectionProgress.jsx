import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const sectionColors = {
  "4": "bg-blue-500",
  "5": "bg-violet-500",
  "6": "bg-amber-500",
  "7": "bg-cyan-500",
  "8": "bg-rose-500",
  "9": "bg-emerald-500",
  "10": "bg-orange-500",
};

export default function SectionProgress({ section, title, total, compliant, inProgress, nonCompliant }) {
  const percentage = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <Link
      to={createPageUrl(`Checklist?section=${section}`)}
      className="group bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300 block"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${sectionColors[section] || "bg-slate-500"} bg-opacity-15 flex items-center justify-center`}>
            <span className={`text-sm font-bold ${sectionColors[section]?.replace("bg-", "text-") || "text-slate-500"}`}>
              {section}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{total} requirements</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
      
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
        {compliant > 0 && (
          <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(compliant / total) * 100}%` }} />
        )}
        {inProgress > 0 && (
          <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(inProgress / total) * 100}%` }} />
        )}
        {nonCompliant > 0 && (
          <div className="h-full bg-red-400 transition-all duration-500" style={{ width: `${(nonCompliant / total) * 100}%` }} />
        )}
      </div>
      
      <div className="flex gap-4 mt-3 text-xs">
        <span className="text-emerald-600 font-medium">{compliant} compliant</span>
        <span className="text-amber-600 font-medium">{inProgress} in progress</span>
        <span className="text-red-600 font-medium">{nonCompliant} non-compliant</span>
      </div>
    </Link>
  );
}