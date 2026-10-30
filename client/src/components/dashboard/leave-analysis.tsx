import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LeaveRequest } from "@shared/schema";
import { format, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp } from "lucide-react";

export function LeaveAnalysis() {
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);
  
  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });
  
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  
  const chartData = months.map(month => {
    const monthRequests = leaveRequests.filter(req => {
      const reqDate = new Date(req.startDate);
      return isSameMonth(reqDate, month);
    });
    
    return {
      name: format(month, 'MMM'),
      requests: monthRequests.length,
      approved: monthRequests.filter(r => r.status === 'approved').length,
      pending: monthRequests.filter(r => r.status === 'pending').length,
    };
  });
  
  const totalApprovedThisYear = leaveRequests.filter(r => 
    r.status === 'approved' && new Date(r.startDate) >= yearStart
  ).length;

  return (
    <div className="premium-card-glass overflow-hidden">
      <div className="p-8 pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            Month-wise Leave Analysis
          </h3>
          <p className="text-slate-500 dark:text-slate-400 font-semibold mt-1">Leave trends and approval metrics for {today.getFullYear()}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 self-start md:self-auto">
          <TrendingUp className="h-5 w-5" />
          <span className="text-sm font-bold">{totalApprovedThisYear} Approved Leaves</span>
        </div>
      </div>
      <div className="p-8">
        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--chart-tick)', fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--chart-tick)', fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--dialog-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '16px',
                  color: 'var(--body-text)',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
                cursor={{ fill: 'var(--table-row-hover)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', color: 'var(--chart-tick)' }} />
              <Area 
                type="monotone" 
                dataKey="requests" 
                name="Total Requests"
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRequests)" 
              />
              <Area 
                type="monotone" 
                dataKey="approved" 
                name="Approved"
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorApproved)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
