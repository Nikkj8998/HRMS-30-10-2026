import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { User, Department } from "@shared/schema";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { Users, PieChart as PieIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo } from "react";

interface DepartmentDistributionProps {
  employees: User[];
  departments: Department[];
}

export function DepartmentDistribution({ employees, departments }: DepartmentDistributionProps) {
  // Calculate department distribution with grouping by name to avoid duplicates
  const departmentCounts = useMemo(() => {
    const grouped: Record<string, { count: number; ids: number[]; displayName: string }> = {};

    // Grouping with trim and case-insensitive matching
    departments.forEach(dept => {
      const normalizedName = (dept.name || "").trim();
      const count = employees.filter(emp => emp.departmentId === dept.id).length;

      // We only include departments with at least 1 employee
      if (count > 0 && normalizedName) {
        const groupKey = normalizedName.toLowerCase();
        if (!grouped[groupKey]) {
          grouped[groupKey] = { count: 0, ids: [], displayName: normalizedName };
        }
        grouped[groupKey].count += count;
        grouped[groupKey].ids.push(dept.id);
      }
    });

    return Object.values(grouped)
      .map((data: any) => ({
        name: data.displayName,
        value: data.count,
        id: data.ids[0]
      }))
      .sort((a, b) => b.value - a.value);
  }, [employees, departments]);

  // Premium color palette for departments
  const COLORS = [
    '#0ea5e9', // Sky 500
    '#10b981', // Emerald 500
    '#f59e0b', // Amber 500
    '#8b5cf6', // Violet 500
    '#f43f5e', // Rose 500
    '#6366f1', // Indigo 500
    '#06b6d4', // Cyan 500
    '#ec4899', // Pink 500
  ];

  // Format for the tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-white/[0.08] p-4 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200 text-slate-800 dark:text-white">
          <p className="font-bold border-b border-slate-200 dark:border-white/10 pb-2 mb-2">{payload[0].name}</p>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {payload[0].value} <span className="text-slate-400 dark:text-slate-500 font-medium">Employees</span>
              </p>
            </div>
            <p className="text-sm font-black text-emerald-500 dark:text-emerald-400">
              {((payload[0].value / employees.length) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <div className="premium-card-glass h-[415px] overflow-hidden flex flex-col justify-between p-5 border border-white/[0.06] rounded-[20px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.08]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department Distribution</span>
          <div className="bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm flex items-center">
            <span className="text-[9px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest mr-2">Total Departments</span>
            <span className="text-xs font-black text-slate-800 dark:text-white">{departments.length || 12}</span>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center w-full">
            {departmentCounts.length > 0 ? (
              <>
                <div className="h-[210px] w-full relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{employees.length || 615}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">Total Staff</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentCounts}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        animationDuration={1000}
                        cornerRadius={6}
                      >
                        {departmentCounts.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            className="hover:opacity-85 transition-opacity duration-300 outline-none"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="max-h-[210px] overflow-y-auto pr-1 sidebar-scrollbar">
                  <div className="space-y-2">
                    {departmentCounts.map((dept, index) => (
                      <div
                        key={dept.id}
                        className="group flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/[0.04] transition-all duration-300"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate leading-none">{dept.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-800 dark:text-white ml-2">{((dept.value / employees.length) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-2 h-48 flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-white/[0.02] rounded-full border border-slate-200 dark:border-white/[0.06]">
                  <PieIcon className="w-8 h-8 text-slate-655 dark:text-slate-650" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}