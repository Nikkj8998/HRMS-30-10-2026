import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-white/[0.08] gap-4", className)}>
      <div className="flex items-center space-x-3.5">
        {icon && (
          <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/[0.08] text-slate-300 shadow-sm flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white leading-none">{title}</h1>
          {description && <p className="text-sm text-slate-400 mt-1.5 font-medium">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
