import React from "react";

export default function StatsCard({ title, value, total, icon: Icon, color, bgColor }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
            {total > 0 && (
              <span className="text-sm text-slate-400 font-medium">/ {total}</span>
            )}
          </div>
          {total > 0 && (
            <div className="mt-3 w-full">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{percentage}% complete</p>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );
}