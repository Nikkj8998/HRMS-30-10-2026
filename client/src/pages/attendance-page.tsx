import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { CheckButton } from "@/components/attendance/check-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Clock, CheckCircle2, XCircle, Users, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Activity, Clock4, UserCheck,
  FileDown, FileSpreadsheet, FileText, LayoutDashboard, History,
  TrendingUp, Timer, AlertCircle, BarChart3, Target, ArrowRight,
  Search, Filter, Pencil, LogOut
} from "lucide-react";
import { Attendance, User, LeaveRequest, Department } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

const formatWorkHours = (ms: number): string => {
  if (ms <= 0) return "0h 0m";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

export default function AttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'MMMM'));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  const [editDialog, setEditDialog] = useState(false);
  const [editRecord, setEditRecord] = useState<{ id: number; userId: number; employeeName: string; checkInTime: string; checkOutTime: string } | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [viewDialog, setViewDialog] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);

  const editAttendanceMutation = useMutation({
    mutationFn: async (data: { id: number; userId: number; checkInTime: string; checkOutTime: string }) => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const checkIn = data.checkInTime ? new Date(`${dateStr}T${data.checkInTime}:00`) : null;
      const checkOut = data.checkOutTime ? new Date(`${dateStr}T${data.checkOutTime}:00`) : null;
      if (data.id) {
        return apiRequest("PUT", `/api/attendance/${data.id}`, {
          checkInTime: checkIn ? checkIn.toISOString() : null,
          checkOutTime: checkOut ? checkOut.toISOString() : null,
        });
      } else {
        return apiRequest("POST", `/api/attendance`, {
          userId: data.userId,
          date: dateStr,
          checkInTime: checkIn ? checkIn.toISOString() : null,
          checkOutTime: checkOut ? checkOut.toISOString() : null,
          status: checkIn ? 'present' : 'absent',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setEditDialog(false);
      toast({ title: "Attendance Updated", description: "Check-in/out time updated successfully." });
    },
    onError: () => {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  });

  const { data: myAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", { userId: user?.id }],
    enabled: !!user,
  });

  const { data: dateAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", { date: format(selectedDate, 'yyyy-MM-dd') }],
    enabled: !!user && ['admin', 'hr', 'manager'].includes(user.role),
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: !!user && ['admin', 'hr', 'manager'].includes(user.role),
  });

  const { data: units = [] } = useQuery<{ id: number; name: string; code: string }[]>({
    queryKey: ['/api/masters/units'],
    enabled: !!user && ['admin', 'hr', 'manager'].includes(user.role),
  });

  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      const cybaemUnit = units.find(u => u.name?.toLowerCase().includes("cybaem"));
      if (cybaemUnit) {
        setSelectedUnit(cybaemUnit.id.toString());
      } else {
        setSelectedUnit(units[0].id.toString());
      }
    }
  }, [units, selectedUnit]);

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    enabled: !!user && ['admin', 'hr', 'manager'].includes(user.role),
  });

  const { data: allLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
    enabled: !!user && ['admin', 'hr', 'manager'].includes(user.role),
  });

  const isEmployeeOnLeave = (employeeId: number, date: Date): boolean => {
    return allLeaveRequests.some(request => {
      if (request.userId !== employeeId || request.status !== 'approved') return false;
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const getDayStatus = (date: Date, attendance: Attendance[]) => {
    const record = attendance.find(r => r.date && isSameDay(new Date(r.date), date));
    if (record) return record.status;
    if (isEmployeeOnLeave(user?.id || 0, date)) return 'on leave';
    if (date > new Date()) return 'upcoming';
    return 'absent';
  };

  const isFutureDate = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected > today;
  })();

  const allEmployeeAttendanceData = isFutureDate ? [] : employees.map(employee => {
    const attendanceRecord = dateAttendance.find(record => record.userId === employee.id);
    const onLeave = isEmployeeOnLeave(employee.id, selectedDate);
    let status: string;
    if (onLeave) status = 'on leave';
    else if (attendanceRecord?.checkInTime) status = attendanceRecord.status || 'present';
    else status = 'absent';

    return {
      id: attendanceRecord?.id || 0,
      userId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      checkInTime: attendanceRecord?.checkInTime || null,
      checkOutTime: attendanceRecord?.checkOutTime || null,
      status,
    };
  });

  const filteredAttendanceData = allEmployeeAttendanceData.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedUnit) {
      const emp = employees.find(e => e.id === record.userId);
      const dept = departments.find(d => d.id === emp?.departmentId);
      if (!dept || dept.unitId !== parseInt(selectedUnit)) return false;
    }
    return true;
  });

  const todayRecord = myAttendance.find(r => r.date && isToday(new Date(r.date)));

  const stats = [
    { label: "Today's Status", value: todayRecord?.status ? (todayRecord.status.charAt(0).toUpperCase() + todayRecord.status.slice(1)) : "Absent", icon: CheckCircle2, color: "text-emerald-450", bg: "bg-emerald-500/10", border: "border-white/[0.08]" },
    { label: "Check In Time", value: todayRecord?.checkInTime ? format(new Date(todayRecord.checkInTime), 'hh:mm a') : "--:--", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-white/[0.08]" },
    { label: "Check Out Time", value: todayRecord?.checkOutTime ? format(new Date(todayRecord.checkOutTime), 'hh:mm a') : "--:--", icon: Clock4, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-white/[0.08]" },
    {
      label: "Work Hours", value: (() => {
        if (todayRecord?.checkInTime) {
          const end = todayRecord.checkOutTime ? new Date(todayRecord.checkOutTime) : new Date();
          const diffMs = end.getTime() - new Date(todayRecord.checkInTime).getTime();
          return formatWorkHours(diffMs);
        }
        return "--";
      })(), icon: Timer, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-white/[0.08]"
    },
  ];

  const teamStats = [
    { label: "Present Today", value: allEmployeeAttendanceData.filter(d => d.status === 'present').length, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-white/[0.08]" },
    { label: "Absent Today", value: allEmployeeAttendanceData.filter(d => d.status === 'absent').length, icon: XCircle, color: "text-rose-450", bg: "bg-rose-500/10", border: "border-white/[0.08]" },
    { label: "Half Day", value: allEmployeeAttendanceData.filter(d => d.status === 'halfday').length, icon: Clock4, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-white/[0.08]" },
    { label: "On Leave", value: allEmployeeAttendanceData.filter(d => d.status === 'on leave').length, icon: CalendarIcon, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-white/[0.08]" },
    { label: "Total Team", value: employees.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-white/[0.08]" },
  ];

  const adminColumns: ColumnDef<any>[] = [
    {
      accessorKey: "employeeName",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 font-bold text-xs uppercase">
            {row.original.employeeName.charAt(0)}
          </div>
          <span className="font-medium text-slate-200">{row.original.employeeName}</span>
        </div>
      )
    },
    {
      accessorKey: "checkInTime",
      header: "Check In",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          {row.original.checkInTime ? format(new Date(row.original.checkInTime), 'hh:mm a') : 'N/A'}
        </div>
      )
    },
    {
      accessorKey: "checkOutTime",
      header: "Check Out",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-300">
          <LogOut className="h-3.5 w-3.5 text-slate-500" />
          {row.original.checkOutTime ? format(new Date(row.original.checkOutTime), 'hh:mm a') : 'N/A'}
        </div>
      )
    },
    {
      id: "workHours",
      header: "Work Hours",
      cell: ({ row }) => {
        const cin = row.original.checkInTime;
        const cout = row.original.checkOutTime;
        if (cin && cout) {
          const ms = new Date(cout).getTime() - new Date(cin).getTime();
          return (
            <div className="flex items-center gap-1 text-purple-400 font-medium text-sm">
              <Timer className="h-3.5 w-3.5" />
              {formatWorkHours(ms)}
            </div>
          );
        }
        return <span className="text-slate-500 text-sm">--</span>;
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variants: Record<string, string> = {
          present: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
          absent: "bg-rose-500/10 text-rose-300 border-rose-500/20",
          halfday: "bg-orange-500/10 text-orange-350 border-orange-500/20",
          'on leave': "bg-amber-500/10 text-amber-300 border-amber-500/20"
        };
        return (
          <Badge variant="outline" className={cn("px-2 py-0.5 rounded-full font-medium first-letter:uppercase border", variants[status] || "bg-white/[0.02]")}>
            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5",
              status === 'present' ? "bg-emerald-500" :
                status === 'absent' ? "bg-rose-500" :
                  status === 'halfday' ? "bg-orange-500" : "bg-amber-500"
            )} />
            {status}
          </Badge>
        );
      }
    },
    ...(['admin', 'hr', 'manager'].includes(user?.role || '') ? [{
      id: "actions",
      header: "Edit",
      cell: ({ row }: any) => {
        const rec = row.original;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-white/[0.04]"
            title="Edit check-in/out time"
            data-testid={`button-edit-attendance-${rec.userId}`}
            onClick={() => {
              const cin = rec.checkInTime ? format(new Date(rec.checkInTime), 'HH:mm') : '';
              const cout = rec.checkOutTime ? format(new Date(rec.checkOutTime), 'HH:mm') : '';
              setEditRecord({ id: rec.id, userId: rec.userId, employeeName: rec.employeeName, checkInTime: rec.checkInTime || '', checkOutTime: rec.checkOutTime || '' });
              setEditCheckIn(cin);
              setEditCheckOut(cout);
              setEditDialog(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        );
      }
    }] as ColumnDef<any>[] : [])
  ];

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen">
        {/* Adjusted Header to match other pages */}
        <PageHeader
          title="Attendance Management"
          description="Enterprise workforce monitoring, real-time check-ins, and productivity analytics."
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          actions={
            <div className="flex items-center gap-4 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.08] shadow-sm">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Live Status</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", todayRecord ? "bg-emerald-500" : "bg-rose-500")} />
                  <p className="text-sm font-bold tracking-tight text-white">{todayRecord ? "Checked In" : "Awaiting Check-in"}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-white/[0.08]" />
              <CheckButton currentAttendance={todayRecord} />
            </div>
          }
        />

        <main className="flex-1 w-full pt-8 relative z-20">
          <Tabs defaultValue="my-attendance" className="w-full space-y-8">
            <div className="flex justify-start">
              <div className="bg-white/[0.02] backdrop-blur-md p-1.5 rounded-2xl border border-white/[0.08] shadow-lg flex gap-1">
                <TabsList className="bg-transparent h-12 gap-1">
                  <TabsTrigger
                    value="my-attendance"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl px-8 font-bold transition-all duration-300 text-slate-300"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Personal Portal
                  </TabsTrigger>
                  {['admin', 'hr', 'manager'].includes(user?.role || '') && (
                    <TabsTrigger
                      value="team-overview"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl px-8 font-bold transition-all duration-300 text-slate-300"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Executive Overview
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="my-attendance" className="space-y-8 mt-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  {stats.map((stat, i) => (
                    <Card key={i} className="border transition-all duration-300 overflow-visible bg-[#0c1427]/60 border-white/[0.08] hover:border-blue-500/30 group">
                      <CardContent className="p-6 flex items-center gap-5">
                        <div className={cn("p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110", stat.bg)}>
                          <stat.icon className={cn("h-7 w-7", stat.color)} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                          <p className="text-xl font-black text-white mt-0.5">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Comprehensive Logs moved to TOP as requested */}
                  <Card className="lg:col-span-3 border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-[2rem] overflow-hidden text-slate-200">
                    <CardHeader className="p-8 pb-0">
                      <CardTitle className="text-xl font-black text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <History className="h-5 w-5 text-blue-400" />
                        </div>
                        Comprehensive Logs
                      </CardTitle>
                      <p className="text-slate-400 font-medium mt-1 text-sm">Detailed history of every clocking event</p>
                    </CardHeader>
                    <CardContent className="p-8">
                      <DataTable
                        columns={[
                          { accessorKey: "date", header: "Log Date", cell: ({ row }) => row.original.date ? format(new Date(row.original.date), 'EEEE, MMM dd, yyyy') : 'N/A' },
                          {
                            accessorKey: "checkInTime",
                            header: "In Time",
                            cell: ({ row }) => (
                              <div className="flex items-center gap-2 font-bold text-emerald-455">
                                <Clock className="h-4 w-4 text-emerald-400" />
                                {row.original.checkInTime ? format(new Date(row.original.checkInTime), 'hh:mm a') : 'N/A'}
                              </div>
                            )
                          },
                          {
                            accessorKey: "checkOutTime",
                            header: "Out Time",
                            cell: ({ row }) => (
                              <div className="flex items-center gap-2 font-bold text-slate-400">
                                <LogOut className="h-4 w-4 text-slate-500" />
                                {row.original.checkOutTime ? format(new Date(row.original.checkOutTime), 'hh:mm a') : 'N/A'}
                              </div>
                            )
                          },
                          {
                            id: "workHours",
                            header: "Work Hours",
                            cell: ({ row }) => {
                              const cin = row.original.checkInTime;
                              const cout = row.original.checkOutTime;
                              if (cin && cout) {
                                const ms = new Date(cout).getTime() - new Date(cin).getTime();
                                return (
                                  <div className="flex items-center gap-1 text-purple-400 font-bold text-sm">
                                    <Timer className="h-4 w-4" />
                                    {formatWorkHours(ms)}
                                  </div>
                                );
                              }
                              return <span className="text-slate-500">--</span>;
                            }
                          },
                          {
                            accessorKey: "status",
                            header: "Final Status",
                            cell: ({ row }) => {
                              const status = row.original.status;
                              return (
                                <Badge className={cn("px-3 py-1 rounded-lg border font-bold first-letter:uppercase",
                                  status === 'present' ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" :
                                    status === 'absent' ? "bg-rose-500/10 text-rose-300 border-rose-500/20" :
                                      status === 'halfday' ? "bg-orange-500/10 text-orange-300 border-orange-500/20" : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                )}>
                                  {status}
                                </Badge>
                              );
                            }
                          }
                        ]}
                        data={myAttendance}
                      />
                    </CardContent>
                  </Card>

                  {/* Attendance Calendar and Recent Activity shifted below */}
                  <Card className="lg:col-span-2 border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-[2rem] overflow-hidden text-slate-200">
                    <CardHeader className="p-8 pb-0 border-b-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-black text-white flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <CalendarIcon className="h-5 w-5 text-blue-400" />
                            </div>
                            Attendance Calendar
                          </CardTitle>
                          <p className="text-slate-400 font-medium mt-1 text-sm">Visualize your presence patterns and history</p>
                        </div>
                        <div className="flex gap-2 bg-white/[0.02] p-1 rounded-xl border border-white/[0.08]">
                          <Button variant="ghost" size="icon" className="rounded-lg h-7 w-7 text-slate-300" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="px-3 flex items-center text-sm font-bold text-slate-200 min-w-[100px] justify-center">
                            {format(currentMonth, 'MMM yyyy')}
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-lg h-7 w-7 text-slate-300" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="flex flex-wrap items-center gap-4 mb-6 px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-xl max-w-fit">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Half Day</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On Leave</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className="grid grid-cols-7 gap-3 p-6 bg-white/[0.01] rounded-2xl border border-white/[0.06] w-full max-w-md">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-slate-500 uppercase tracking-tighter pb-2">{d}</div>
                          ))}
                          {eachDayOfInterval({
                            start: startOfWeek(startOfMonth(currentMonth)),
                            end: endOfWeek(endOfMonth(currentMonth))
                          }).map((date, i) => {
                            const isCurrentMonth = isSameDay(startOfMonth(date), startOfMonth(currentMonth));
                            const status = getDayStatus(date, myAttendance);
                            const isTodayDate = isToday(date);
                            const isSelected = isSameDay(date, selectedDate);

                            return (
                              <motion.div
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                className={cn(
                                  "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer border group",
                                  !isCurrentMonth ? "bg-white/[0.01] border-transparent opacity-20 pointer-events-none" : "bg-white/[0.02] border-white/[0.08] shadow-sm hover:border-blue-500/30 hover:bg-white/[0.04]",
                                  isTodayDate && "border-blue-500 bg-blue-500/10",
                                  isSelected && "ring-2 ring-offset-2 ring-blue-600 scale-105 shadow-xl z-10"
                                )}
                                onClick={() => setSelectedDate(date)}
                              >
                                <span className={cn(
                                  "text-[11px] font-black",
                                  isTodayDate ? "text-blue-400" : "text-slate-200",
                                  !isCurrentMonth && "text-slate-500"
                                )}>
                                  {format(date, 'd')}
                                </span>
                                {isCurrentMonth && status !== 'upcoming' && (
                                  <div className={cn(
                                    "mt-0.5 font-black text-[14px] leading-none",
                                    status === 'present' ? "text-emerald-450 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" :
                                      status === 'halfday' ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]" :
                                        status === 'on leave' ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "text-rose-450 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]"
                                  )}>
                                    {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'halfday' ? 'H' : 'L'}
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-8">
                    <Card className="border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-[2rem] overflow-hidden text-slate-200">
                      <CardHeader className="p-6 border-b-0">
                        <CardTitle className="text-base font-black text-white flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-emerald-400" />
                          </div>
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-3">
                        {myAttendance.slice(0, 4).map((record, i) => (
                          <div key={i} onClick={() => { setViewRecord(record); setViewDialog(true); }} className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] hover:shadow-md transition-all duration-300 group cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                record.status === 'present' ? "bg-emerald-500/10" : "bg-rose-500/10"
                              )}>
                                {record.status === 'present' ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-rose-450" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-white">{record.date ? format(new Date(record.date), 'MMM dd, yyyy') : 'N/A'}</p>
                                <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-500" />
                                  {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : 'No record'}
                                </p>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.1] transition-colors">
                              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border border-white/[0.08] shadow-xl bg-gradient-to-br from-blue-900 to-indigo-950 rounded-[2rem] text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Target className="h-32 w-32" />
                      </div>
                      <CardContent className="p-8 relative z-10">
                        <p className="text-blue-200 font-bold uppercase tracking-widest text-xs mb-2">Monthly Target</p>
                        <h3 className="text-2xl font-black mb-6">Attendance Goal</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Progress</span>
                            <span>{Math.round((myAttendance.filter(r => r.status === 'present').length / 22) * 100)}%</span>
                          </div>
                          <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(myAttendance.filter(r => r.status === 'present').length / 22) * 100}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            />
                          </div>
                          <p className="text-blue-200 text-xs font-medium">Keep up the good work! You are on track for this month's target.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="team-overview" className="space-y-8 mt-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
                >
                  {teamStats.map((stat, i) => (
                    <Card key={i} className={cn("border border-white/[0.08] shadow-lg bg-[#0c1427]/60 backdrop-blur-md rounded-3xl group transition-all duration-300 hover:shadow-2xl overflow-visible", stat.border)}>
                      <CardContent className="p-6 text-center space-y-3">
                        <div className={cn("w-14 h-14 rounded-2xl mx-auto flex items-center justify-center transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110", stat.bg)}>
                          <stat.icon className={cn("h-7 w-7", stat.color)} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                          <p className="text-xl font-black text-white mt-1 tracking-tight">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="space-y-8">
                    <Card className="border border-border shadow-xl bg-card text-foreground rounded-[2rem] overflow-hidden">
                      <CardHeader className="p-8">
                        <CardTitle className="text-lg font-bold">Control Panel</CardTitle>
                        <p className="text-muted-foreground text-sm font-medium">Filter team records by date and year</p>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Month Selector</label>
                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                              <SelectTrigger className="bg-card border-border h-12 rounded-xl text-foreground font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-dialog border-border text-foreground">
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                  <SelectItem key={m} value={m} className="focus:bg-muted focus:text-foreground">{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Year</label>
                            <Select value={filterYear} onValueChange={setFilterYear}>
                              <SelectTrigger className="bg-card border-border h-11 rounded-xl text-foreground font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-dialog border-border text-foreground">
                                {['2024', '2025', '2026', '2027'].map(y => (
                                  <SelectItem key={y} value={y} className="focus:bg-muted focus:text-foreground">{y}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-black tracking-tight shadow-xl shadow-blue-900/20 text-white animate-none"
                          onClick={() => {
                            const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(filterMonth);
                            const newDate = new Date(parseInt(filterYear), monthIndex, 1);
                            setSelectedDate(newDate);
                            setCurrentMonth(newDate);
                          }}
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          Apply Filters
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-[2rem] overflow-hidden text-slate-200">
                      <CardHeader className="p-8 flex flex-row items-center justify-between border-b-0">
                        <div>
                          <CardTitle className="text-lg font-bold text-white">{format(selectedDate, 'MMM dd, yyyy')}</CardTitle>
                          <p className="text-sm text-slate-400 font-medium">Daily productivity metric</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-emerald-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-8">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-3xl font-black text-white leading-none">
                              {Math.round((allEmployeeAttendanceData.filter(d => d.status === 'present').length / employees.length) * 100) || 0}%
                            </p>
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Attendance Rate</p>
                          </div>
                          <BarChart3 className="h-12 w-12 text-white/[0.03]" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.06] text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Checked In</p>
                            <p className="text-2xl font-black text-blue-400">{allEmployeeAttendanceData.filter(d => d.status === 'present').length}</p>
                          </div>
                          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.06] text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Absent</p>
                            <p className="text-2xl font-black text-rose-455">{allEmployeeAttendanceData.filter(d => d.status === 'absent').length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="lg:col-span-2 border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-[2rem] overflow-hidden text-slate-200">
                    <CardHeader className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <CardTitle className="text-xl font-black text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-400" />
                          </div>
                          Team Roster
                        </CardTitle>
                        <p className="text-slate-400 font-medium mt-1 text-sm">Real-time presence tracking of all members</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                          <SelectTrigger className="w-full sm:w-44 h-11 bg-white/[0.02] border-white/[0.08] text-slate-300 rounded-xl font-medium" data-testid="select-unit-filter-attendance">
                            <SelectValue placeholder={units?.[0]?.name || "Select Unit"} />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map(u => (
                              <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Search talent..."
                            className="pl-11 h-11 bg-white/[0.02] border-white/[0.08] focus:border-blue-500/50 text-white rounded-xl font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <div className="flex flex-wrap items-center gap-4 mb-4 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Half Day</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On Leave</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
                        </div>
                      </div>
                      {isFutureDate ? (
                        <div className="flex flex-col items-center justify-center p-12 bg-white/[0.01] rounded-xl border border-dashed border-white/[0.08]">
                          <CalendarIcon className="w-10 h-10 text-slate-500 mb-3" />
                          <p className="text-lg font-bold text-slate-400">No attendance records found</p>
                          <p className="text-sm text-slate-500 mt-1">The selected date ({format(selectedDate, 'MMM dd, yyyy')}) is in the future. Attendance records are not available.</p>
                        </div>
                      ) : (
                        <DataTable columns={adminColumns} data={filteredAttendanceData} />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
      {editDialog && editRecord && (
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-md bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Pencil className="h-5 w-5 text-blue-400" />
                Edit Attendance — {editRecord.employeeName}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="checkIn" className="text-right text-slate-300">Check In</Label>
                <Input id="checkIn" type="time" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} className="col-span-3 border-white/[0.08] bg-white/[0.02]" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="checkOut" className="text-right text-slate-300">Check Out</Label>
                <Input id="checkOut" type="time" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} className="col-span-3 border-white/[0.08] bg-white/[0.02]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-white/[0.08] bg-transparent text-slate-300 hover:bg-white/[0.04]">Cancel</Button>
              <Button onClick={() => editAttendanceMutation.mutate({ id: editRecord.id, userId: editRecord.userId, checkInTime: editCheckIn, checkOutTime: editCheckOut })} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {viewDialog && viewRecord && (
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-md bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200 rounded-3xl overflow-hidden p-0">
            <div className="bg-[#0c1427]/10 p-6 text-white border-b border-white/[0.08]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-lg font-black tracking-tight text-white">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <Activity className="h-5 w-5 text-emerald-450" />
                  </div>
                  Attendance Details
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Date</span>
                  <span className="text-sm font-black text-white">
                    {viewRecord.date ? format(new Date(viewRecord.date), 'MMMM dd, yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Status</span>
                  <Badge className={cn(
                    "text-xs font-bold uppercase block text-center",
                    viewRecord.status === 'present' ? "bg-emerald-500/10 text-emerald-350 hover:bg-emerald-500/20 border border-emerald-500/20" :
                    viewRecord.status === 'halfday' ? "bg-orange-500/10 text-orange-350 hover:bg-orange-500/20 border border-orange-500/20" :
                    "bg-rose-500/10 text-rose-350 hover:bg-rose-500/20 border border-rose-500/20"
                  )}>
                    {viewRecord.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                    <Clock className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Check In Time</span>
                    <span className="text-sm font-black text-white">
                      {viewRecord.checkInTime ? format(new Date(viewRecord.checkInTime), 'hh:mm a') : '--:--'}
                    </span>
                    {viewRecord.checkInNotes && (
                      <p className="text-xs text-slate-400 bg-white/[0.02] p-2 rounded-xl border border-white/[0.06] italic mt-1">
                        "{viewRecord.checkInNotes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 mt-1">
                    <Clock4 className="h-4 w-4 text-orange-450" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Check Out Time</span>
                    <span className="text-sm font-black text-white">
                      {viewRecord.checkOutTime ? format(new Date(viewRecord.checkOutTime), 'hh:mm a') : '--:--'}
                    </span>
                    {viewRecord.checkOutNotes && (
                      <p className="text-xs text-slate-400 bg-white/[0.02] p-2 rounded-xl border border-white/[0.06] italic mt-1">
                        "{viewRecord.checkOutNotes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 items-start border-t pt-4 border-white/[0.06]">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-1">
                    <Timer className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Work Hours</span>
                    <span className="text-sm font-black text-white">
                      {(() => {
                        if (viewRecord.checkInTime) {
                          const end = viewRecord.checkOutTime ? new Date(viewRecord.checkOutTime) : new Date();
                          const diffMs = end.getTime() - new Date(viewRecord.checkInTime).getTime();
                          return formatWorkHours(diffMs);
                        }
                        return '--';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="bg-white/[0.02] px-6 py-4 border-t border-white/[0.08]">
              <Button onClick={() => setViewDialog(false)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
