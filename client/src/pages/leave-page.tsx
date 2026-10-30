import { useState, useMemo, useCallback, useEffect } from "react";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LeaveForm } from "@/components/leave/leave-form";
import { LeaveJourneyTracker } from "@/components/leave/leave-journey-tracker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus,
  Calendar,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Check,
  X,
  CalendarDays,
  UserCheck,
  Timer,
  Target,
  Activity,
  BarChart3,
  Award,
  Briefcase,
  Search,
  Filter,
  Eye,
  Settings,
  ChevronRight,
  Star,
  Crown,
  User as UserIcon,
  Mail,
  Building2,
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle,
  PieChart
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeaveRequest, User, LeaveBalance, Department } from "@shared/schema";
import { apiRequest, queryClient, resolveApiUrl } from "@/lib/queryClient";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { format, eachDayOfInterval, isWeekend, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, startOfYear, endOfYear, isSameMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";

export default function LeavePage() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [location] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [activeTab, setActiveTab] = useState("my-requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [pendingStageFilter, setPendingStageFilter] = useState<'all' | 'line_manager' | 'hod'>('all');
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);

  // Fetch leave & comp off settings
  const { data: leaveSettingsData } = useQuery<{
    compOffEnabled: boolean;
    compOffValidityDays: number;
    requireDepartmentHeadApproval: boolean;
  }>({
    queryKey: ['/api/settings/leave'],
    enabled: !!authUser && (authUser.role === 'admin' || authUser.role === 'hr'),
  });

  const [policyForm, setPolicyForm] = useState({
    compOffEnabled: true,
    compOffValidityDays: 30,
    requireDepartmentHeadApproval: true,
  });

  useEffect(() => {
    if (leaveSettingsData) {
      setPolicyForm({
        compOffEnabled: leaveSettingsData.compOffEnabled ?? true,
        compOffValidityDays: leaveSettingsData.compOffValidityDays ?? 30,
        requireDepartmentHeadApproval: leaveSettingsData.requireDepartmentHeadApproval ?? true,
      });
    }
  }, [leaveSettingsData]);

  const updatePolicyMutation = useMutation({
    mutationFn: async (payload: { compOffEnabled: boolean; compOffValidityDays: number; requireDepartmentHeadApproval: boolean }) => {
      await apiRequest("PUT", "/api/settings/leave", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/leave'] });
      setIsPolicyOpen(false);
      toast({
        title: "Leave Policy Updated",
        description: "Comp Off settings and approval mechanism updated successfully.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update policy",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Parse userId from URL if present
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), [window.location.search]);
  const targetUserId = queryParams.get("id") ? parseInt(queryParams.get("id")!) : authUser?.id;

  // Fetch all employees to display names (Needed for effectiveUser derivation)
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: !!authUser,
  });

  const { data: units = [] } = useQuery<{ id: number; name: string; code: string }[]>({
    queryKey: ['/api/masters/units'],
    enabled: !!authUser && (authUser.role === 'admin' || authUser.role === 'hr' || authUser.role === 'manager'),
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    enabled: !!authUser && (authUser.role === 'admin' || authUser.role === 'hr' || authUser.role === 'manager'),
  });

  const authorizedUnitId = useMemo(() => {
    if (!authUser) return null;
    if (['admin', 'developer'].includes(authUser.role)) return null;
    const dept = departments.find(d => d.id === authUser.departmentId);
    return dept?.unitId || null;
  }, [authUser, departments]);

  const displayUnits = useMemo(() => {
    if (authorizedUnitId === null) return units;
    return units.filter(u => u.id === authorizedUnitId);
  }, [units, authorizedUnitId]);

  const effectiveUser = useMemo(() => {
    if (targetUserId === authUser?.id) return authUser;
    return employees.find(emp => emp.id === targetUserId);
  }, [targetUserId, authUser, employees]);

  // Fetch leave requests for current user (My Requests tab)
  const { data: myLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", { userId: authUser?.id }],
    enabled: !!authUser,
  });

  // Fetch leave requests for the effective user (Main profile display)
  const { data: targetLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", { userId: effectiveUser?.id }],
    enabled: !!effectiveUser && targetUserId !== authUser?.id,
  });

  const displayLeaveRequests = targetUserId === authUser?.id ? myLeaveRequests : targetLeaveRequests;

  // Fetch pending leave requests (for admins/HR/managers)
  const { data: pendingRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", { status: "pending" }],
    enabled: !!authUser && (authUser.role === 'admin' || authUser.role === 'hr' || authUser.role === 'manager'),
  });

  // Fetch all leave requests for analytics (admin view)
  const { data: allLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
    enabled: !!authUser && (authUser.role === 'admin' || authUser.role === 'hr' || authUser.role === 'manager'),
  });

  // Fetch effective user's leave balance
  const { data: leaveBalance, isLoading: isLoadingLeaveBalance } = useQuery<LeaveBalance>({
    queryKey: ['/api/employees/leave-balance', effectiveUser?.id],
    queryFn: async () => {
      const response = await fetch(resolveApiUrl(`/api/employees/${effectiveUser?.id}/leave-balance`), {
        credentials: 'include',
      });
      if (response.status === 404) {
        return {
          totalAccrued: 0,
          totalTaken: 0,
          pendingRequests: 0,
          remainingBalance: 0,
          accruedThisYear: 0,
          takenThisYear: 0,
        } satisfies LeaveBalance;
      }
      if (!response.ok) throw new Error('Failed to fetch leave balance');
      return response.json();
    },
    enabled: !!effectiveUser && !!effectiveUser.id,
  });

  // Multi-step Approve leave request (Stage 1: Line Manager, Stage 2: HOD)
  const approveMutation = useMutation({
    mutationFn: async ({ requestId, action, comments }: { requestId: number; action?: 'approve_line_manager' | 'approve_hod'; comments?: string }) => {
      await apiRequest("PUT", `/api/leave-requests/${requestId}`, {
        action: action || "approved",
        status: "approved",
        comments,
        approvedById: authUser?.id
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      const isHOD = variables.action === 'approve_hod';
      toast({
        title: isHOD ? "HOD Approval Granted (Stage 2)" : "Line Manager Approval Granted (Stage 1)",
        description: isHOD
          ? "Final approval complete! Intimation notification sent to HR team."
          : "Approved by Line Manager & forwarded to HOD for final approval.",
      });
    },
  });

  // Reject leave request at any stage
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, comments }: { requestId: number; comments?: string }) => {
      await apiRequest("PUT", `/api/leave-requests/${requestId}`, {
        status: "rejected",
        action: "reject",
        comments,
        approvedById: authUser?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      toast({ 
        title: "Request rejected",
        description: "Rejection recorded and journey ended."
      });
    },
  });

  // Cancel leave request
  const cancelMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("DELETE", `/api/leave-requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      toast({ title: "Request canceled" });
    },
  });

  // Get user info by ID
  const getUserById = (userId: number) => {
    return employees.find(emp => emp.id === userId);
  };

  // Format date range
  const formatDateRange = (start: string | Date, end: string | Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  // Calculate duration in business days
  const calculateDuration = (start: string | Date, end: string | Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!startDate || !endDate || endDate < startDate) return '0 days';
    const businessDays = eachDayOfInterval({ start: startDate, end: endDate }).filter(day => !isWeekend(day));
    return `${businessDays.length} working day${businessDays.length !== 1 ? 's' : ''}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Approved</Badge>;
      case "rejected": return <Badge className="bg-rose-500/10 text-rose-300 border border-rose-500/20">Rejected</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/20">Pending</Badge>;
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'annual': return <Calendar className="w-4 h-4" />;
      case 'sick': return <Target className="w-4 h-4" />;
      case 'personal': return <Star className="w-4 h-4" />;
      case 'halfday': return <Clock className="w-4 h-4" />;
      case 'comboff': return <Clock className="w-4 h-4 text-teal-400" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const calculateMonthlyPaidLeaveUsage = (userId: number, targetMonth?: Date) => {
    const month = targetMonth || new Date();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const paidLeaveTypes = ['annual', 'sick', 'personal', 'halfday', 'other'];

    const leaveRequestsData = userId === authUser?.id ? myLeaveRequests :
      userId === effectiveUser?.id ? targetLeaveRequests :
        allLeaveRequests;

    const monthlyPaidLeaveUsed = leaveRequestsData
      .filter(request => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        return requestStart <= monthEnd && requestEnd >= monthStart &&
          request.status === "approved" && paidLeaveTypes.includes(request.type) &&
          request.userId === userId;
      })
      .reduce((total: number, request: LeaveRequest) => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        if (request.type === "halfday") {
          return (requestStart >= monthStart && requestStart <= monthEnd && !isWeekend(requestStart)) ? total + 0.5 : total;
        } else {
          const clippedStart = new Date(Math.max(requestStart.getTime(), monthStart.getTime()));
          const clippedEnd = new Date(Math.min(requestEnd.getTime(), monthEnd.getTime()));
          return clippedStart <= clippedEnd ? total + eachDayOfInterval({ start: clippedStart, end: clippedEnd }).filter(day => !isWeekend(day)).length : total;
        }
      }, 0);

    return { used: monthlyPaidLeaveUsed, limit: 1.5, remaining: Math.max(0, 1.5 - monthlyPaidLeaveUsed) };
  };

  const wouldExceedPaidLeaveLimit = (userId: number, startDate: Date, endDate: Date, leaveType: string) => {
    if (leaveType === 'unpaid' || leaveType === 'workfromhome' || leaveType === 'comboff') return { wouldExceed: false };
    const monthsSpanned: Date[] = [];
    let checkMonth = startOfMonth(startDate);
    while (checkMonth <= endOfMonth(endDate)) {
      monthsSpanned.push(new Date(checkMonth));
      checkMonth = startOfMonth(new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 1));
    }
    const perMonthAnalysis = monthsSpanned.map(month => {
      const currentUsage = calculateMonthlyPaidLeaveUsage(userId, month);
      let requestDaysInMonth = 0;
      if (leaveType === "halfday") {
        if (startDate >= startOfMonth(month) && startDate <= endOfMonth(month) && !isWeekend(startDate)) requestDaysInMonth = 0.5;
      } else {
        const clippedStart = new Date(Math.max(startDate.getTime(), startOfMonth(month).getTime()));
        const clippedEnd = new Date(Math.min(endDate.getTime(), endOfMonth(month).getTime()));
        if (clippedStart <= clippedEnd) requestDaysInMonth = eachDayOfInterval({ start: clippedStart, end: clippedEnd }).filter(day => !isWeekend(day)).length;
      }
      return { wouldExceed: (currentUsage.used + requestDaysInMonth) > currentUsage.limit };
    });
    return { wouldExceed: perMonthAnalysis.some(a => a.wouldExceed) };
  };

  const getPaidUnpaidBadge = (request: LeaveRequest) => {
    if (request.type === 'unpaid') return <Badge className="bg-white/[0.04] text-slate-400 border border-white/[0.08]">Unpaid</Badge>;
    if (request.type === 'workfromhome') return <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">WFH</Badge>;
    if (request.type === 'comboff') return <Badge className="bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">Comp Off</Badge>;
    const analysis = wouldExceedPaidLeaveLimit(request.userId, new Date(request.startDate), new Date(request.endDate), request.type);
    return analysis.wouldExceed ? <Badge className="bg-rose-500/10 text-rose-300 border border-rose-500/20">Unpaid</Badge> : <Badge className="bg-blue-500/10 text-blue-300 border border-blue-500/20">Paid</Badge>;
  };

  const getLeaveAnalytics = () => {
    const thisMonth = new Date();
    const requestsData = displayLeaveRequests;
    const thisMonthRequests = requestsData.filter(req => {
      const d = new Date(req.createdAt || req.startDate);
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
    });
    return {
      totalRequests: requestsData.length,
      pendingCount: requestsData.filter(r => r.status === 'pending').length,
      approvedCount: requestsData.filter(r => r.status === 'approved').length,
      rejectedCount: requestsData.filter(r => r.status === 'rejected').length,
      thisMonthRequests: thisMonthRequests.length,
      workFromHomeCount: requestsData.filter(r => r.type === 'workfromhome').length,
    };
  };

  const analytics = getLeaveAnalytics();
  const filteredMyRequests = displayLeaveRequests.filter(r => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = r.type.toLowerCase().includes(s) || (r.reason && r.reason.toLowerCase().includes(s)) || (r.status && r.status.toLowerCase().includes(s));
    if (!matchesSearch) return false;
    if (filterDate) {
      const selected = new Date(filterDate);
      selected.setHours(0,0,0,0);
      const start = new Date(r.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(r.endDate);
      end.setHours(0,0,0,0);
      return selected >= start && selected <= end;
    }
    return true;
  });

  const filteredPendingRequests = pendingRequests.filter(request => {
    const employee = getUserById(request.userId);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      request.type.toLowerCase().includes(searchLower) ||
      (request.reason && request.reason.toLowerCase().includes(searchLower)) ||
      (employee && `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchLower))
    );
    if (!matchesSearch) return false;
    
    // Default to displaying only authorized unit for HR/Managers
    if (selectedUnit === "all" && authorizedUnitId !== null && employee) {
      const dept = departments.find(d => d.id === employee.departmentId);
      if (!dept || dept.unitId !== authorizedUnitId) return false;
    } else if (selectedUnit !== "all" && employee) {
      const dept = departments.find(d => d.id === employee.departmentId);
      if (!dept || dept.unitId !== parseInt(selectedUnit)) return false;
    }

    if (filterDate) {
      const selected = new Date(filterDate);
      selected.setHours(0,0,0,0);
      const start = new Date(request.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(request.endDate);
      end.setHours(0,0,0,0);
      if (!(selected >= start && selected <= end)) return false;
    }

    if (pendingStageFilter === 'line_manager') {
      return request.approvalStage === 'line_manager' || !request.approvalStage;
    }
    if (pendingStageFilter === 'hod') {
      return request.approvalStage === 'hod';
    }
    
    return true;
  });

  const myRequestsPagination = usePagination(filteredMyRequests);
  const pendingRequestsPagination = usePagination(filteredPendingRequests);

  const handleView = (r: LeaveRequest) => { setSelectedLeave(r); setIsViewOpen(true); };
  const handleEdit = (r: LeaveRequest) => { setSelectedLeave(r); setIsEditOpen(true); };

  const LeaveRequestCard = ({ request, index, showEmployee = false }: { request: LeaveRequest; index: number; showEmployee?: boolean }) => {
    const employee = getUserById(request.userId);
    const employeeDept = employee?.departmentId ? departments.find(d => d.id === employee.departmentId) : null;
    const deptLineManager = employeeDept?.lineManagerId ? getUserById(employeeDept.lineManagerId) : null;
    const deptHod = employeeDept?.hodId ? getUserById(employeeDept.hodId) : null;
    const lineManagerApprover = request.lineManagerApprovedById ? getUserById(request.lineManagerApprovedById) : null;
    const hodApprover = request.hodApprovedById ? getUserById(request.hodApprovedById) : (request.approvedById ? getUserById(request.approvedById) : null);
    const rejectedByUser = request.rejectedById ? getUserById(request.rejectedById) : null;

    const isPending = request.status === 'pending';
    const isLineManagerStage = request.approvalStage === 'line_manager' || !request.approvalStage;
    const isHODStage = request.approvalStage === 'hod';
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
        <Card className="group border border-white/[0.08] shadow-lg hover:shadow-2xl hover:border-blue-500/40 transition-all duration-300 bg-[#0c1427]/60 backdrop-blur-md overflow-hidden relative text-slate-200">
          <CardContent className="p-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {showEmployee && employee ? (
                    <>
                      <Avatar className="h-12 w-12 border border-white/[0.08] shadow-lg">
                        <AvatarFallback className="bg-white/[0.06] text-slate-350 font-bold">{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{employee.firstName} {employee.lastName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-sm text-slate-400 font-medium">{employee.position || "Employee"}</p>
                          {employeeDept && (
                            <Badge variant="outline" className="border-blue-500/30 text-blue-300 text-[10px] bg-blue-500/10 py-0 px-1.5 h-4">
                              {employeeDept.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500/10 p-3 rounded-xl shadow-lg text-blue-400">{getLeaveTypeIcon(request.type)}</div>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 capitalize transition-colors">{request.type} Leave</h3>
                        <p className="text-sm text-slate-400 font-medium">{calculateDuration(request.startDate, request.endDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Dialog open={isViewOpen && selectedLeave?.id === request.id} onOpenChange={(open) => {
                    if (!open) setIsViewOpen(false);
                    else handleView(request);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-white/[0.04]">
                        <Eye className="h-4 w-4 text-blue-400" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200">
                      <DialogHeader>
                        <DialogTitle className="text-white">Leave Details</DialogTitle>
                      </DialogHeader>
                      {selectedLeave && (
                        <div className="space-y-4 py-4 text-slate-200">
                          {/* Visual Journey Tracker */}
                          <LeaveJourneyTracker
                            variant="full"
                            request={selectedLeave}
                            employee={getUserById(selectedLeave.userId)}
                            department={departments.find(d => d.id === getUserById(selectedLeave.userId)?.departmentId)}
                            lineManager={getUserById(departments.find(d => d.id === getUserById(selectedLeave.userId)?.departmentId)?.lineManagerId || 0)}
                            hod={getUserById(departments.find(d => d.id === getUserById(selectedLeave.userId)?.departmentId)?.hodId || 0)}
                            lineManagerApprover={selectedLeave.lineManagerApprovedById ? getUserById(selectedLeave.lineManagerApprovedById) : null}
                            hodApprover={selectedLeave.hodApprovedById ? getUserById(selectedLeave.hodApprovedById) : (selectedLeave.approvedById ? getUserById(selectedLeave.approvedById) : null)}
                            rejectedByUser={selectedLeave.rejectedById ? getUserById(selectedLeave.rejectedById) : null}
                          />
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                            <span className="text-sm font-medium text-slate-400">Employee</span>
                            <span className="font-bold text-white">{employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                            <span className="text-sm font-medium text-slate-400">Type</span>
                            <Badge variant="outline" className="capitalize border-white/[0.08] text-slate-300">{selectedLeave.type}</Badge>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                            <span className="text-sm font-medium text-slate-400">Period</span>
                            <span className="text-sm font-medium">{formatDateRange(selectedLeave.startDate, selectedLeave.endDate)}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                            <span className="text-sm font-medium text-slate-400">Duration</span>
                            <span className="text-sm font-medium">{calculateDuration(selectedLeave.startDate, selectedLeave.endDate)}</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                            <span className="text-sm font-medium text-slate-400">Status</span>
                            {getStatusBadge(selectedLeave.status || 'pending')}
                          </div>
                          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                            <span className="text-sm font-medium text-slate-400">Applied Date & Time</span>
                            <span className="text-sm font-medium">
                              {selectedLeave.createdAt ? format(new Date(selectedLeave.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                            </span>
                          </div>
                          {selectedLeave.status !== 'pending' && (
                            <>
                              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                                <span className="text-sm font-medium text-slate-400">
                                  {selectedLeave.status === 'approved' ? 'Approved By' : 'Rejected By'}
                                </span>
                                <div className="text-right">
                                  <span className="font-bold text-white">
                                    {getUserById(selectedLeave.approvedById || 0)
                                      ? `${getUserById(selectedLeave.approvedById || 0)?.firstName} ${getUserById(selectedLeave.approvedById || 0)?.lastName}`
                                      : (selectedLeave.approvedById ? `User #${selectedLeave.approvedById}` : 'Department Head')}
                                  </span>
                                  {(() => {
                                    const approverUser = getUserById(selectedLeave.approvedById || 0);
                                    const dept = approverUser ? departments.find(d => d.id === approverUser.departmentId) : null;
                                    return dept ? (
                                      <div className="text-xs text-slate-400">
                                        {approverUser?.role === 'manager' ? `Head of ${dept.name}` : approverUser?.role?.toUpperCase()}
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                              {selectedLeave.approvedAt && (
                                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                                  <span className="text-sm font-medium text-slate-400">Decision Date & Time</span>
                                  <span className="text-sm font-medium text-emerald-400">
                                    {format(new Date(selectedLeave.approvedAt), 'MMM dd, yyyy hh:mm a')}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-slate-400">Reason</span>
                            <p className="text-sm bg-white/[0.02] p-3 rounded-lg border border-white/[0.08] italic">
                              {selectedLeave.reason || 'No reason provided'}
                            </p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  {isPending && !showEmployee && (
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(request)} className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-white/[0.04]"><Settings className="h-4 w-4 text-slate-400" /></Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-350"><CalendarDays className="w-4 h-4 text-blue-400" /><span>{formatDateRange(request.startDate, request.endDate)}</span></div>
                {request.reason && <p className="text-sm text-slate-400 line-clamp-2">{request.reason}</p>}
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(request.status || 'pending')}
                  {getPaidUnpaidBadge(request)}
                </div>

                {/* Multi-Step Journey Tracker */}
                <LeaveJourneyTracker
                  variant="compact"
                  request={request}
                  employee={employee}
                  department={employeeDept}
                  lineManager={deptLineManager}
                  hod={deptHod}
                  lineManagerApprover={lineManagerApprover}
                  hodApprover={hodApprover}
                  rejectedByUser={rejectedByUser}
                />
                <div className="text-[10px] text-slate-500 font-semibold pt-1">
                  Applied: {request.createdAt ? format(new Date(request.createdAt), 'MMM dd, yyyy hh:mm a') : 'N/A'}
                </div>
                {request.status !== 'pending' && (
                  <div className="pt-2 border-t border-white/[0.06] mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {request.status === 'approved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span className={request.status === 'approved' ? "text-emerald-400" : "text-rose-400"}>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                        <span className="font-bold text-white">
                          {approver ? `${approver.firstName} ${approver.lastName}` : (request.approvedById ? `User #${request.approvedById}` : 'Department Head')}
                        </span>
                        {approver?.role === 'manager' && approverDept ? (
                          <span className="text-slate-300 font-normal"> (Head of ${approverDept.name})</span>
                        ) : approver?.role === 'admin' ? (
                          <span className="text-slate-300 font-normal"> (Admin)</span>
                        ) : approver?.role === 'hr' ? (
                          <span className="text-slate-300 font-normal"> (HR)</span>
                        ) : null}
                      </span>
                    </div>
                    {request.approvedAt && (
                      <div className="text-[10px] text-slate-400 pl-5">
                        on {format(new Date(request.approvedAt), 'MMM dd, yyyy hh:mm a')}
                      </div>
                    )}
                  </div>
                )}
                {(isPending && (showEmployee || (['admin', 'hr', 'manager'].includes(authUser?.role || '') && request.userId !== authUser?.id))) && (
                  <div className="pt-3 border-t border-white/[0.08] mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      {isLineManagerStage ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border-amber-500/30 text-xs font-bold h-9"
                          onClick={() => approveMutation.mutate({ requestId: request.id, action: 'approve_line_manager' })}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          data-testid={`btn-approve-lm-${request.id}`}
                        >
                          <Check className="w-3.5 h-3.5 mr-1 text-amber-400" /> 
                          Approve Line Manager (#1)
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/30 text-xs font-bold h-9"
                          onClick={() => approveMutation.mutate({ requestId: request.id, action: 'approve_hod' })}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          data-testid={`btn-approve-hod-${request.id}`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> 
                          Final HOD Approval (#2)
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30 text-xs h-9 px-3"
                        onClick={() => rejectMutation.mutate({ requestId: request.id })}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        data-testid={`btn-reject-${request.id}`}
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                    <div className="text-[10px] text-slate-400 text-center font-medium">
                      {isLineManagerStage ? "→ Approval #1 forwards to HOD" : "→ Approval #2 sends Intimation to HR & completes journey"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const calculateLeaveBalance = (type: string) => {
    const annual = 20;
    const sick = 10;
    const personal = 5;
    const halfday = 12;

    const used = displayLeaveRequests
      .filter(request => request.status === "approved" && request.type === type)
      .reduce((total, request) => {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        if (type === "halfday") {
          return total + 1;
        } else {
          const businessDays = eachDayOfInterval({ start, end }).filter(day => !isWeekend(day));
          return total + businessDays.length;
        }
      }, 0);

    switch (type) {
      case "annual": return { total: annual, used, remaining: annual - used };
      case "sick": return { total: sick, used, remaining: sick - used };
      case "personal": return { total: personal, used, remaining: personal - used };
      case "halfday": return { total: halfday, used, remaining: halfday - used };
      default: return { total: 0, used: 0, remaining: 0 };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          title={`${effectiveUser ? `${effectiveUser.firstName} ${effectiveUser.lastName}'s ` : ""}Leave Management`}
          description="Manage leave requests, view approvals history, and track time off."
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          actions={
            <div className="flex items-center space-x-3">
              <div className="bg-white/[0.03] rounded-xl px-4 py-1.5 border border-white/[0.08] shadow-sm flex items-center space-x-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{targetUserId === authUser?.id ? "My Requests" : "Total Requests"}</div>
                  <div className="text-base font-black text-white leading-none">{displayLeaveRequests.length}</div>
                </div>
              </div>
              {targetUserId === authUser?.id && (
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold rounded-xl shadow-sm px-4 h-10 flex items-center border-none"><Plus className="h-4 w-4 mr-2" />Apply for Leave</Button>
              {targetUserId === authUser?.id && (authUser?.role === 'admin' || authUser?.role === 'hr') && (
                <Dialog open={isPolicyOpen} onOpenChange={setIsPolicyOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-semibold rounded-xl h-10 px-3.5 flex items-center gap-2"
                      data-testid="btn-comp-off-policy"
                    >
                      <Settings className="w-4 h-4 text-teal-400" />
                      <span>Comp Off Policy</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.1] text-slate-200 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-teal-400" />
                        Comp Off & Leave Policy Configuration
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold text-white">Enable Comp Off Leaves</Label>
                          <p className="text-xs text-slate-400">Allow employees to select and apply for compensatory off</p>
                        </div>
                        <Switch
                          checked={policyForm.compOffEnabled}
                          onCheckedChange={(checked) => setPolicyForm(prev => ({ ...prev, compOffEnabled: checked }))}
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold text-white">Comp Off Validity Period (Days)</Label>
                          <p className="text-xs text-slate-400">Number of days within which Comp Off leave must be availed</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={policyForm.compOffValidityDays}
                            onChange={(e) => setPolicyForm(prev => ({ ...prev, compOffValidityDays: parseInt(e.target.value) || 30 }))}
                            className="bg-white/[0.04] border-white/[0.1] text-white font-bold h-10 w-28"
                          />
                          <span className="text-sm font-medium text-slate-400">Days (Default: 30 days)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="space-y-0.5 pr-4">
                          <Label className="text-sm font-semibold text-white">Department Head Approval</Label>
                          <p className="text-xs text-slate-400">Directly route Comp Off leave requests to respective Department Head (Manager) for first approval</p>
                        </div>
                        <Switch
                          checked={policyForm.requireDepartmentHeadApproval}
                          onCheckedChange={(checked) => setPolicyForm(prev => ({ ...prev, requireDepartmentHeadApproval: checked }))}
                        />
                      </div>

                      <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
                        Department Heads (Managers) will see these requests under their Pending Approvals tab and their name and department will be attached to the approval history.
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setIsPolicyOpen(false)} className="border-white/[0.1] hover:bg-white/[0.05]">
                          Cancel
                        </Button>
                        <Button
                          onClick={() => updatePolicyMutation.mutate(policyForm)}
                          disabled={updatePolicyMutation.isPending}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                        >
                          {updatePolicyMutation.isPending ? "Saving..." : "Save Policy"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200">
                    <DialogHeader><DialogTitle className="text-white">Apply for Leave</DialogTitle></DialogHeader>
                    <LeaveForm onSuccess={() => { setIsAddOpen(false); queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] }); }} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          }
        />
              {/* Edit Leave Modal */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200">
                  <DialogHeader>
                    <DialogTitle className="text-white">Update Leave Request</DialogTitle>
                  </DialogHeader>
                  {selectedLeave && (
                    <LeaveForm 
                      leaveRequest={selectedLeave} 
                      onSuccess={() => { 
                        setIsEditOpen(false); 
                        queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] }); 
                      }} 
                    />
                  )}
                </DialogContent>
              </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Requests</div><div className="text-3xl font-bold text-white">{analytics.totalRequests}</div></div>
              <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400"><BarChart3 className="w-6 h-6" /></div>
            </div>
          </CardContent></Card>
          <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Approval</div><div className="text-3xl font-bold text-white">{analytics.pendingCount}</div></div>
              <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400"><Timer className="w-6 h-6" /></div>
            </div>
          </CardContent></Card>
          <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Approved</div><div className="text-3xl font-bold text-white">{analytics.approvedCount}</div></div>
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400"><CheckCircle2 className="w-6 h-6" /></div>
            </div>
          </CardContent></Card>
          <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">This Month</div><div className="text-3xl font-bold text-white">{analytics.thisMonthRequests}</div></div>
              <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400"><Activity className="w-6 h-6" /></div>
            </div>
          </CardContent></Card>
          <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Work From Home</div><div className="text-3xl font-bold text-white">{analytics.workFromHomeCount}</div></div>
              <div className="bg-teal-500/10 p-3 rounded-xl text-teal-400"><Briefcase className="w-6 h-6" /></div>
            </div>
          </CardContent></Card>
        </div>

        <Card className="border border-white/[0.08] shadow-xl overflow-hidden bg-[#0c1427]/60 backdrop-blur-md text-slate-200">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white"><UserCheck className="w-5 h-5" /></div>
                <div><h2 className="text-2xl font-bold text-white">{targetUserId === authUser?.id ? "Your Leave Balance" : "Employee Leave Balance"}</h2><p className="text-slate-400 text-sm font-medium">Current status and upcoming accruals</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/[0.02] border border-white/[0.08] shadow-lg group hover:border-blue-500/30 transition-all text-slate-200"><CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Calendar className="w-6 h-6" /></div>
                  <Badge className="bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold px-2 py-0.5 rounded-full">Annual</Badge>
                </div>
                <div className="text-3xl font-black text-white mb-1">{calculateLeaveBalance('annual').total || 0} <span className="text-sm font-medium text-slate-500">Days</span></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Total Balance</p>
                <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span className="text-blue-400">Used: {calculateLeaveBalance('annual').used}</span><span className="text-slate-550">Rem: {calculateLeaveBalance('annual').remaining}</span></div><Progress value={(calculateLeaveBalance('annual').used / 20) * 100} className="h-2 bg-white/[0.04]" /></div>
              </CardContent></Card>
              <Card className="bg-white/[0.02] border border-white/[0.08] shadow-lg group hover:border-blue-500/30 transition-all text-slate-200"><CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Award className="w-6 h-6" /></div>
                  <Badge className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold px-2 py-0.5 rounded-full">Sick</Badge>
                </div>
                <div className="text-3xl font-black text-white mb-1">{calculateLeaveBalance('sick').total || 0} <span className="text-sm font-medium text-slate-500">Days</span></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Available Days</p>
                <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span className="text-indigo-400">Used: {calculateLeaveBalance('sick').used}</span><span className="text-slate-550">Rem: {calculateLeaveBalance('sick').remaining}</span></div><Progress value={(calculateLeaveBalance('sick').used / 10) * 100} className="h-2 bg-white/[0.04]" /></div>
              </CardContent></Card>
              <Card className="bg-white/[0.02] border border-white/[0.08] shadow-lg group hover:border-blue-500/30 transition-all text-slate-200"><CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Star className="w-6 h-6" /></div>
                  <Badge className="bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold px-2 py-0.5 rounded-full">Personal</Badge>
                </div>
                <div className="text-3xl font-black text-white mb-1">{calculateLeaveBalance('personal').total || 0} <span className="text-sm font-medium text-slate-500">Days</span></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Accrued Leaves</p>
                <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span className="text-purple-400">Used: {calculateLeaveBalance('personal').used}</span><span className="text-slate-550">Rem: {calculateLeaveBalance('personal').remaining}</span></div><Progress value={(calculateLeaveBalance('personal').used / 5) * 100} className="h-2 bg-white/[0.04]" /></div>
              </CardContent></Card>
              <Card className="bg-white/[0.02] border border-white/[0.08] shadow-lg group hover:border-blue-500/30 transition-all text-slate-200"><CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Clock className="w-6 h-6" /></div>
                  <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">Monthly Quota</Badge>
                </div>
                <div className="text-3xl font-black text-white mb-1">{calculateMonthlyPaidLeaveUsage(effectiveUser?.id || 0).remaining} <span className="text-sm font-medium text-slate-500">Remaining</span></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Of 1.5 Paid Leaves / Mo</p>
                <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span className="text-emerald-400">Used: {calculateMonthlyPaidLeaveUsage(effectiveUser?.id || 0).used}</span><span className="text-slate-550">Limit: 1.5</span></div><Progress value={(calculateMonthlyPaidLeaveUsage(effectiveUser?.id || 0).used / 1.5) * 100} className="h-2 bg-white/[0.04]" /></div>
              </CardContent></Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-white/[0.02] border border-white/[0.08] p-1 rounded-xl w-fit">
                <TabsTrigger value="my-requests" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                  {targetUserId === authUser?.id ? "My Requests" : "Requests"}
                  <Badge className="ml-2 bg-white/[0.08] text-slate-300 border border-white/[0.08]">{filteredMyRequests.length}</Badge>
                </TabsTrigger>
                {(authUser?.role === 'admin' || authUser?.role === 'hr' || authUser?.role === 'manager') && targetUserId === authUser?.id && (
                  <TabsTrigger value="approvals" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                    Pending Approvals
                    <Badge className="ml-2 bg-amber-555 bg-amber-500/10 text-amber-300 border border-amber-500/20">{filteredPendingRequests.length}</Badge>
                  </TabsTrigger>
                )}
                {authUser?.role === 'admin' && targetUserId === authUser?.id && (
                  <TabsTrigger value="analytics" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                    <PieChart className="w-4 h-4 mr-1" />
                    Organization Analytics
                  </TabsTrigger>
                )}
              </TabsList>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {(authUser?.role === 'admin' || authUser?.role === 'hr' || authUser?.role === 'manager') && (
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger className="w-full sm:w-44 h-11 border border-white/[0.08] bg-white/[0.02] text-slate-200 rounded-xl font-medium focus:border-blue-500/50" data-testid="select-unit-filter-leave">
                      <SelectValue placeholder={displayUnits?.length === 1 ? displayUnits[0].name : "All Units"} />
                    </SelectTrigger>
                    <SelectContent>
                      {displayUnits?.length !== 1 && <SelectItem value="all">All Units</SelectItem>}
                      {displayUnits.map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                 <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Search leaves..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-white/[0.02] border border-white/[0.08] focus:border-blue-500/50 rounded-xl transition-all text-white" />
                </div>
                <div className="relative w-full sm:w-48 flex gap-2">
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="pl-10 h-11 bg-white/[0.02] border border-white/[0.08] focus:border-blue-500/50 rounded-xl transition-all text-white text-xs font-semibold" />
                  </div>
                  {filterDate && (
                    <Button variant="outline" size="icon" onClick={() => setFilterDate("")} className="h-11 w-11 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]">
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <TabsContent value="my-requests" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myRequestsPagination.paginatedItems.map((request, index) => (
                  <LeaveRequestCard key={request.id} request={request} index={index} />
                ))}
              </div>
              {myRequestsPagination.totalPages > 1 && (
                <div className="mt-6 bg-white/[0.02] border border-white/[0.08] rounded-xl shadow-sm">
                  <PaginationBar
                    currentPage={myRequestsPagination.currentPage}
                    totalPages={myRequestsPagination.totalPages}
                    totalItems={myRequestsPagination.totalItems}
                    startIndex={myRequestsPagination.startIndex}
                    endIndex={myRequestsPagination.endIndex}
                    onPageChange={myRequestsPagination.setCurrentPage}
                    itemLabel="requests"
                  />
                </div>
              )}
            </TabsContent>
            <TabsContent value="approvals" className="mt-0">
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Multi-Step Approval Queue</h4>
                    <p className="text-xs text-slate-400">Employee → Line Manager (#1) → HOD (#2) → HR Intimation → Complete</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-lg border border-white/[0.06]">
                  <Button
                    size="sm"
                    variant={pendingStageFilter === 'all' ? 'default' : 'ghost'}
                    onClick={() => setPendingStageFilter('all')}
                    className={cn(
                      "h-7 text-xs font-bold rounded-md px-2.5",
                      pendingStageFilter === 'all' ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
                    )}
                  >
                    All ({pendingRequests.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={pendingStageFilter === 'line_manager' ? 'default' : 'ghost'}
                    onClick={() => setPendingStageFilter('line_manager')}
                    className={cn(
                      "h-7 text-xs font-bold rounded-md px-2.5",
                      pendingStageFilter === 'line_manager' ? "bg-amber-600 text-white" : "text-amber-300 hover:text-white"
                    )}
                  >
                    Stage 1: Line Manager ({pendingRequests.filter(r => r.approvalStage === 'line_manager' || !r.approvalStage).length})
                  </Button>
                  <Button
                    size="sm"
                    variant={pendingStageFilter === 'hod' ? 'default' : 'ghost'}
                    onClick={() => setPendingStageFilter('hod')}
                    className={cn(
                      "h-7 text-xs font-bold rounded-md px-2.5",
                      pendingStageFilter === 'hod' ? "bg-indigo-600 text-white" : "text-indigo-300 hover:text-white"
                    )}
                  >
                    Stage 2: HOD ({pendingRequests.filter(r => r.approvalStage === 'hod').length})
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendingRequestsPagination.paginatedItems.map((request, index) => (
                  <LeaveRequestCard key={request.id} request={request} index={index} showEmployee />
                ))}
              </div>
              {pendingRequestsPagination.totalPages > 1 && (
                <div className="mt-6 bg-white/[0.02] border border-white/[0.08] rounded-xl shadow-sm">
                  <PaginationBar
                    currentPage={pendingRequestsPagination.currentPage}
                    totalPages={pendingRequestsPagination.totalPages}
                    totalItems={pendingRequestsPagination.totalItems}
                    startIndex={pendingRequestsPagination.startIndex}
                    endIndex={pendingRequestsPagination.endIndex}
                    onPageChange={pendingRequestsPagination.setCurrentPage}
                    itemLabel="requests"
                  />
                </div>
              )}
            </TabsContent>

            {/* Super Admin: Organization-wide Leave Analytics */}
            {authUser?.role === 'admin' && (
              <TabsContent value="analytics" className="mt-0">
                <OrgLeaveAnalytics allLeaveRequests={allLeaveRequests} employees={employees} departments={departments} units={units} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

/* ─── Organization-wide Leave Analytics for Super Admin ───────────── */
function OrgLeaveAnalytics({
  allLeaveRequests,
  employees,
  departments,
  units,
}: {
  allLeaveRequests: LeaveRequest[];
  employees: User[];
  departments: Department[];
  units: { id: number; name: string; code: string }[];
}) {
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  // Monthly trend chart data
  const monthlyTrend = months.map((month) => {
    const reqs = allLeaveRequests.filter((r) => isSameMonth(new Date(r.startDate), month));
    return {
      name: format(month, 'MMM'),
      total: reqs.length,
      approved: reqs.filter((r) => r.status === 'approved').length,
      pending: reqs.filter((r) => r.status === 'pending').length,
      rejected: reqs.filter((r) => r.status === 'rejected').length,
    };
  });

  // Leave type breakdown
  const typeBreakdown = useMemo(() => {
    const types: Record<string, number> = {};
    allLeaveRequests.forEach((r) => {
      const label = r.type.charAt(0).toUpperCase() + r.type.slice(1);
      types[label] = (types[label] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  }, [allLeaveRequests]);

  const typeColors: Record<string, string> = {
    Annual: '#6366f1',
    Sick: '#f59e0b',
    Personal: '#8b5cf6',
    Unpaid: '#64748b',
    Workfromhome: '#10b981',
    Comboff: '#14b8a6',
    Maternity: '#ec4899',
    Paternity: '#3b82f6',
    Bereavement: '#78716c',
  };

  // Per-unit breakdown
  const unitBreakdown = useMemo(() => {
    return units.map((unit) => {
      const unitDeptIds = departments.filter((d) => d.unitId === unit.id).map((d) => d.id);
      const unitEmpIds = employees.filter((e) => unitDeptIds.includes(e.departmentId || 0)).map((e) => e.id);
      const unitReqs = allLeaveRequests.filter((r) => unitEmpIds.includes(r.userId));
      return {
        unit: unit.name,
        total: unitReqs.length,
        approved: unitReqs.filter((r) => r.status === 'approved').length,
        pending: unitReqs.filter((r) => r.status === 'pending').length,
        rejected: unitReqs.filter((r) => r.status === 'rejected').length,
      };
    });
  }, [units, departments, employees, allLeaveRequests]);

  // Per-department breakdown
  const deptBreakdown = useMemo(() => {
    return departments.map((dept) => {
      const deptEmpIds = employees.filter((e) => e.departmentId === dept.id).map((e) => e.id);
      const deptReqs = allLeaveRequests.filter((r) => deptEmpIds.includes(r.userId));
      return {
        department: dept.name,
        total: deptReqs.length,
        approved: deptReqs.filter((r) => r.status === 'approved').length,
        pending: deptReqs.filter((r) => r.status === 'pending').length,
        rejected: deptReqs.filter((r) => r.status === 'rejected').length,
      };
    }).filter((d) => d.total > 0);
  }, [departments, employees, allLeaveRequests]);

  // Top-level stats
  const totalApproved = allLeaveRequests.filter((r) => r.status === 'approved').length;
  const totalPending = allLeaveRequests.filter((r) => r.status === 'pending').length;
  const totalRejected = allLeaveRequests.filter((r) => r.status === 'rejected').length;
  const approvalRate = allLeaveRequests.length > 0 ? Math.round((totalApproved / allLeaveRequests.length) * 100) : 0;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Requests</div>
                <div className="text-3xl font-black text-white">{allLeaveRequests.length}</div>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400"><BarChart3 className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Approved</div>
                <div className="text-3xl font-black text-white">{totalApproved}</div>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pending</div>
                <div className="text-3xl font-black text-white">{totalPending}</div>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400"><Timer className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Approval Rate</div>
                <div className="text-3xl font-black text-white">{approvalRate}%</div>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400"><TrendingUp className="w-5 h-5" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card className="border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-2xl overflow-hidden text-slate-200">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-blue-400" />
            </div>
            Monthly Leave Trends — {today.getFullYear()}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lcTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lcApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lcPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#lcTotal)" />
                <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#lcApproved)" />
                <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#lcPending)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Leave Type Breakdown + Unit Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-slate-200">
        {/* Type Breakdown */}
        <Card className="border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" /> Leave Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeBreakdown} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <YAxis dataKey="type" type="category" axisLine={false} tickLine={false} tick={{ fill: '#e2e8f0', fontSize: 13, fontWeight: 600 }} width={110} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#0f172a', color: '#fff', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }} />
                  <Bar dataKey="count" name="Requests" radius={[0, 8, 8, 0]} barSize={22}>
                    {typeBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={typeColors[entry.type] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Unit / Organization Breakdown */}
        <Card className="border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> Unit-wise Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {unitBreakdown.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No unit data available</p>
            ) : (
              <div className="space-y-4">
                {unitBreakdown.map((u) => (
                  <div key={u.unit} className="rounded-xl border border-white/[0.08] bg-white/[0.01] p-4 hover:shadow-md transition-shadow text-slate-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">{u.unit}</span>
                      <Badge variant="secondary" className="bg-white/[0.04] text-slate-300 border border-white/[0.08] font-bold">{u.total} total</Badge>
                    </div>
                    <div className="flex gap-3 text-xs font-bold">
                      <span className="text-emerald-450">✓ {u.approved} Approved</span>
                      <span className="text-amber-400">⏳ {u.pending} Pending</span>
                      <span className="text-rose-400">✕ {u.rejected} Rejected</span>
                    </div>
                    <Progress value={u.total > 0 ? (u.approved / u.total) * 100 : 0} className="h-1.5 mt-2 bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Status Breakdown Table */}
      <Card className="border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md rounded-2xl overflow-hidden text-slate-200">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Department-wise Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {deptBreakdown.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No department data available</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/[0.02] border-b border-white/[0.08]">
                    <TableHead className="font-bold text-slate-400">Department</TableHead>
                    <TableHead className="font-bold text-center text-slate-400">Total</TableHead>
                    <TableHead className="font-bold text-center text-emerald-400">Approved</TableHead>
                    <TableHead className="font-bold text-center text-amber-450">Pending</TableHead>
                    <TableHead className="font-bold text-center text-rose-400">Rejected</TableHead>
                    <TableHead className="font-bold text-center text-slate-400">Approval %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptBreakdown.map((d) => (
                    <TableRow key={d.department} className="hover:bg-white/[0.02] border-b border-white/[0.04]">
                      <TableCell className="font-semibold text-white">{d.department}</TableCell>
                      <TableCell className="text-center font-bold text-slate-200">{d.total}</TableCell>
                      <TableCell className="text-center"><Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{d.approved}</Badge></TableCell>
                      <TableCell className="text-center"><Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/20">{d.pending}</Badge></TableCell>
                      <TableCell className="text-center"><Badge className="bg-rose-500/10 text-rose-300 border border-rose-500/20">{d.rejected}</Badge></TableCell>
                      <TableCell className="text-center font-bold text-slate-300">
                        {d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
