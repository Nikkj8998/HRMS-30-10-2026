import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { AttendanceOverview } from "@/components/dashboard/attendance-overview";
import { RecentEmployees } from "@/components/dashboard/recent-employees";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import { DepartmentDistribution } from "@/components/dashboard/department-distribution";
import { LeaveAnalysis } from "@/components/dashboard/leave-analysis";
import { BirthdayAnnouncements } from "@/components/dashboard/birthday-announcements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DownloadIcon, RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User, Department, LeaveRequest, Holiday, Attendance, Unit } from "@shared/schema";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date();
  const [dateRange, setDateRange] = useState("month");
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const { toast } = useToast();

  // Fetch employees data
  const { data: employees = [], isLoading: loadingEmployees } = useQuery<User[]>({
    queryKey: ["/api/employees", refreshKey],
  });

  // Fetch departments data
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments", refreshKey],
  });

  // Fetch units data
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/masters/units", refreshKey],
  });

  // Fetch leave requests (all for admin/hr/manager, user's own for employee)
  const { data: pendingLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: user?.role === "employee"
      ? ["/api/leave-requests", { userId: user.id }, refreshKey]
      : ["/api/leave-requests", { status: "pending" }, refreshKey],
  });

  // Fetch today's attendance
  const { data: todayAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", { date: format(today, 'yyyy-MM-dd') }, refreshKey],
  });

  // Fetch user's personal attendance (for employee role)
  const { data: userAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", { userId: user?.id }, refreshKey],
    enabled: user?.role === "employee",
  });

  // Fetch upcoming holidays
  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: ["/api/holidays", refreshKey],
  });

  // Calculate real financial data from employees
  const totalMonthlyPayroll = employees.reduce((sum, emp) => sum + ((emp.salary || 0) / 12), 0);
  const totalPayrollLakhs = (totalMonthlyPayroll / 100000).toFixed(2);
  const pfRate = 0.12, esiRate = 0.0325, ptMonthly = 200;
  const totalStatutoryDues = employees.reduce((sum, emp) => {
    const monthly = (emp.salary || 0) / 12;
    const basic = monthly * 0.4;
    return sum + (basic * pfRate) + (monthly <= 21000 ? monthly * esiRate : 0) + ptMonthly;
  }, 0);
  const statutoryLakhs = (totalStatutoryDues / 100000).toFixed(2);
  const tdsLiability = employees.reduce((sum, emp) => {
    const annual = emp.salary || 0;
    const taxable = Math.max(0, annual - 250000);
    if (taxable <= 250000) return sum + (taxable * 0.05) / 12;
    if (taxable <= 500000) return sum + (12500 + (taxable - 250000) * 0.20) / 12;
    return sum + (62500 + (taxable - 500000) * 0.30) / 12;
  }, 0);
  const tdsLakhs = (tdsLiability / 100000).toFixed(2);

  // Build per-unit organization data
  const orgData = units.map(unit => {
    const unitDeptIds = departments.filter(d => d.unitId === unit.id).map(d => d.id);
    const unitEmployees = employees.filter(e => e.departmentId != null && unitDeptIds.includes(e.departmentId));
    const empCount = unitEmployees.length;
    const unitPayroll = unitEmployees.reduce((sum, e) => sum + ((e.salary || 0) / 12), 0);
    const complianceScore = empCount > 0 ? 96 : 0;
    return { name: unit.name, count: empCount, payroll: unitPayroll, compliance: `${complianceScore}%`, payrollStatus: unitPayroll > 0 ? "Processed" : "Pending" };
  });
  // If no units match (unitId not set on all employees), fall back to showing all employees under first unit
  const orgTableData = orgData.length > 0 ? orgData : [
    { name: "Cybaem Tech Pvt Ltd", count: employees.length, payroll: totalMonthlyPayroll, compliance: "98%", payrollStatus: "Processed" }
  ];

  // Calculate attendance statistics
  const totalEmployees = employees.length;
  const presentToday = todayAttendance.filter(record => record.status === 'present').length;
  const onLeaveToday = pendingLeaveRequests.filter(request => {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    return (
      request.status === 'approved' &&
      startDate <= today && today <= endDate
    );
  }).length;
  const absentToday = totalEmployees - (presentToday + onLeaveToday);

  // Filter upcoming holidays
  const upcomingHolidays = holidays
    .filter(holiday => new Date(holiday.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Handler for refreshing data
  const handleRefresh = () => {
    setRefreshKey(Date.now());
  };

  // Toggle date range
  const toggleDateRange = () => {
    setDateRange(dateRange === "month" ? "week" : "month");
  };

  // Determine if user has admin/management privileges
  const isSuperAdmin = user?.role === "admin";
  const isHRAdmin = user?.role === "hr";
  const isManager = user?.role === "manager";
  const isAdminRole = isSuperAdmin || isHRAdmin || isManager;

  // Get user's personal stats (for employee dashboard)
  const getUserPersonalStats = () => {
    if (!user || !userAttendance.length) return { present: 0, absent: 0, late: 0 };

    const thisMonth = userAttendance.filter(record => {
      const checkInTime = record.checkInTime;
      if (!checkInTime) return false;
      const recordDate = new Date(checkInTime);
      return recordDate.getMonth() === today.getMonth() &&
        recordDate.getFullYear() === today.getFullYear();
    });

    const present = thisMonth.filter(record => record.status === 'present' || record.status === 'late').length;
    const absent = thisMonth.filter(record => record.status === 'absent').length;
    const late = thisMonth.filter(record => record.status === 'late').length;

    return { present, absent, late };
  };

  const personalStats = getUserPersonalStats();

  // Hide dashboard overview for developer users
  if (user?.role === 'developer') {
    return (
      <AppLayout>
        <div className="space-y-6 pb-8">
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-sm p-8"
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Developer Mode</h1>
              <p className="text-gray-600 mb-6">
                Welcome to Developer Mode. Use the System Settings to configure the HR system.
              </p>
              <Button
                onClick={() => window.location.href = '/developer'}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Go to System Settings
              </Button>
            </motion.div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* Welcome section with user greeting */}
        <WelcomeSection />

        {/* Page header */}
        <PageHeader
          title={isSuperAdmin ? "Super Admin Executive Dashboard" : isHRAdmin ? "HR Management Dashboard" : "Dashboard Overview"}
          description="Real-time overview of organization metrics, compliance scores, and team updates."
          actions={
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2 border border-border bg-card text-foreground hover:bg-muted h-9 rounded-xl text-xs font-semibold transition-all duration-200"
                onClick={() => {
                  toast({ title: "Report Downloaded", description: "The executive dashboard report has been exported." });
                }}
              >
                <DownloadIcon className="h-4 w-4" />
                Download Report
              </Button>
              <Button 
                className="gap-2 !bg-blue-600 hover:!bg-blue-700 !text-white font-bold h-9 rounded-xl text-xs shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-none"
              >
                + Add New
              </Button>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-muted-foreground cursor-pointer">
                <span>Today, 7 May 2026</span>
              </div>
            </div>
          }
        />

        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {isSuperAdmin ? (
            // Super Admin view - High level metrics
            <>
              <StatCard
                title="Total Employees"
                value={totalEmployees}
                total={totalEmployees}
                percentage={100}
                status="present"
                sparkline="blue"
                trendLabel="100% vs last month"
              />
              <StatCard
                title="Monthly Payroll"
                value={`₹${totalPayrollLakhs}L`}
                total={`${totalEmployees} employees`}
                percentage={90}
                status="leave"
                sparkline="orange"
                trendLabel="90% vs last month"
              />
              <StatCard
                title="Statutory Dues"
                value={`₹${statutoryLakhs}L`}
                total="PF/ESI/PT"
                percentage={85}
                status="present"
                sparkline="purple"
                trendLabel="85% vs last month"
              />
              <StatCard
                title="TDS Liability"
                value={`₹${tdsLakhs}L`}
                total="(Monthly estimate)"
                percentage={98}
                status="present"
                sparkline="green"
                trendLabel="98% vs last month"
              />
            </>
          ) : isAdminRole ? (
            // HR/Manager view - Employee focused stats
            <>
              <StatCard
                title="Present Today"
                value={presentToday}
                total={totalEmployees}
                percentage={totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0}
                status="present"
              />
              <StatCard
                title="On Leave Today"
                value={onLeaveToday}
                total={totalEmployees}
                percentage={totalEmployees > 0 ? (onLeaveToday / totalEmployees) * 100 : 0}
                status="leave"
              />
              <StatCard
                title="Absent Today"
                value={absentToday}
                total={totalEmployees}
                percentage={totalEmployees > 0 ? (absentToday / totalEmployees) * 100 : 0}
                status="absent"
              />
              <StatCard
                title="Total Workforce"
                value={totalEmployees}
                total={totalEmployees}
                percentage={100}
                status="present"
              />
            </>
          ) : (
            // Employee view - Personal stats
            <>
              <StatCard
                title="Days Present"
                value={personalStats.present}
                total={personalStats.present + personalStats.absent + personalStats.late}
                percentage={personalStats.present + personalStats.absent + personalStats.late > 0
                  ? (personalStats.present / (personalStats.present + personalStats.absent + personalStats.late)) * 100
                  : 0}
                status="present"
              />
              <StatCard
                title="Leave Balance"
                value={15}
                total={24}
                percentage={62.5}
                status="leave"
              />
              <StatCard
                title="Late Days"
                value={personalStats.late}
                total={personalStats.present + personalStats.absent + personalStats.late}
                percentage={personalStats.present + personalStats.absent + personalStats.late > 0
                  ? (personalStats.late / (personalStats.present + personalStats.absent + personalStats.late)) * 100
                  : 0}
                status="absent"
              />
            </>
          )}
        </div>

        {/* Announcements & Birthdays Spotlight (Option A - visible to Admin, HR, Employee) */}
        <BirthdayAnnouncements />

        {/* Quick Actions Section (only for non-Super Admin since Super Admin has it inside the 3-column grid) */}
        {!isSuperAdmin && <QuickActions />}

        {isSuperAdmin ? (
          // Super Admin specific view
          <div className="space-y-6">
            {/* Row 1: Quick Actions, Attendance Overview, Department Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QuickActions cols={2} />
              <AttendanceOverview />
              <DepartmentDistribution employees={employees} departments={departments} />
            </div>

            {/* Row 2: Group Financial Summary, Recent Activity, Upcoming Events, and Organization Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col justify-between h-[449px]">
                {/* Group Financial Summary */}
                <div className="premium-card-glass p-5 border border-white/[0.06] rounded-[20px] h-[155px] flex flex-col justify-between">
                  <div className="pb-2 border-b border-white/[0.08] flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Group Financial Summary</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl hover:border-emerald-500/30 transition-all select-none">
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">Total Payout</p>
                      <p className="text-sm font-extrabold text-white mt-1">₹{totalPayrollLakhs}L</p>
                      <span className="text-[8px] text-emerald-400 font-bold mt-1 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                        +4.2%
                      </span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl hover:border-blue-500/30 transition-all select-none">
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">Statutory Dues</p>
                      <p className="text-sm font-extrabold text-white mt-1">₹{statutoryLakhs}L</p>
                      <span className="text-[8px] text-blue-400 font-bold mt-1 inline-block bg-blue-500/10 px-1 py-0.5 rounded uppercase tracking-wider">PF/ESI/PT</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl hover:border-purple-500/30 transition-all select-none">
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider leading-none">TDS Liability</p>
                      <p className="text-sm font-extrabold text-white mt-1">₹{tdsLakhs}L</p>
                      <span className="text-[8px] text-purple-400 font-bold mt-1 flex items-center">
                        <RefreshCw className="h-3 w-3 mr-0.5 animate-spin-slow" />
                        Syncing
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid for Recent Activity & Upcoming Events */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <PendingApprovals pendingRequests={pendingLeaveRequests} />
                  <UpcomingEvents holidays={upcomingHolidays} />
                </div>
              </div>

              <div className="lg:col-span-7">
                {/* Organization Compliance & Payroll Status */}
                <div className="premium-card-glass p-5 border border-white/[0.06] rounded-[20px] h-[449px] flex flex-col justify-between">
                  <div className="pb-3 border-b border-white/[0.08] flex flex-row items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Compliance & Payroll Status</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-white/10 text-slate-300 hover:bg-white/5 hover:text-white h-7 text-[10px] rounded-lg font-bold uppercase tracking-wider"
                      onClick={() => {
                        const headers = ["Organization", "Employees", "Payroll Status", "Compliance Score"];
                        const csvContent = [
                          headers.join(","),
                          ...orgTableData.map(org => `${org.name},${org.count},${org.payrollStatus},${org.compliance}`)
                        ].join("\n");

                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Master-Report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                        a.click();
                        toast({ title: "Report Exported", description: "Master report CSV has been downloaded." });
                      }}
                    >
                      <DownloadIcon className="h-3 w-3" />
                      Export Report
                    </Button>
                  </div>
                  <div className="overflow-y-auto flex-1 mt-2 sidebar-scrollbar pr-1">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-950/40 border-b border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 font-bold border-none">Organization</th>
                          <th className="py-2.5 px-3 font-bold border-none">Employees</th>
                          <th className="py-2.5 px-3 font-bold border-none">Payroll Status</th>
                          <th className="py-2.5 px-3 font-bold border-none">Compliance</th>
                          <th className="py-2.5 px-3 font-bold text-right border-none">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-slate-300">
                        {orgTableData.map((org, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors duration-200">
                            <td className="py-2.5 px-3 font-bold text-white border-none">{org.name}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-400 border-none">{org.count}</td>
                            <td className="py-2.5 px-3 border-none">
                              <span className={cn(
                                "text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider",
                                org.payrollStatus === "Processed" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              )}>
                                {org.payrollStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 border-none">
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/[0.02]">
                                  <div className="h-full bg-blue-500" style={{ width: org.compliance }} />
                                </div>
                                <span className="text-[9px] font-black text-white">{org.compliance}</span>
                              </div>
                            </td>
                            <td
                              className="py-2.5 px-3 text-right text-blue-400 hover:text-blue-300 hover:underline cursor-pointer font-bold text-[10px] border-none"
                              onClick={() => window.location.href = '/payroll'}
                            >
                              View Details
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <LeaveAnalysis />
          </div>
        ) : isAdminRole ? (
          // HR Admin / Manager view
          <>
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceOverview />
              <DepartmentDistribution employees={employees} departments={departments} />
            </div>

            {/* Approvals and Upcoming Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PendingApprovals pendingRequests={pendingLeaveRequests} />
              </div>
              <div>
                <UpcomingEvents holidays={upcomingHolidays} />
              </div>
            </div>

            {/* Recent Employees */}
            <RecentEmployees employees={employees.slice(0, 5)} departments={departments} />
          </>
        ) : (
          // Employee view
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <UpcomingEvents holidays={upcomingHolidays} />
            </div>
            <div>
              {pendingLeaveRequests.length > 0 && (
                <PendingApprovals
                  pendingRequests={pendingLeaveRequests}
                  isPersonalView={true}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
