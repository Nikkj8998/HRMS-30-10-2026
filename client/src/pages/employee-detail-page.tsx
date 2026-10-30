import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  CalendarX,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Banknote,
  Receipt,
  CreditCard,
  Download,
  CalendarClock,
  CalendarDays,
  Timer,
  Hourglass,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { User, Department, LeaveRequest, Attendance, PaymentRecord, LeaveBalance } from "@shared/schema";
import { Link, useParams, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveApiUrl } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateProfessionalPayslip } from "@/lib/payslip-utils";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const initialTab = window.location.search.includes('tab=')
    ? new URLSearchParams(window.location.search).get('tab') || "personal"
    : "personal";

  // Safely parse ID, if invalid number it will be NaN
  const employeeId = parseInt(id || "");
  const isValidId = !isNaN(employeeId) && employeeId > 0;

  const [activeTab, setActiveTab] = useState(initialTab);

  // State for attendance month selection
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Fetch employee data
  const { data: employee, isLoading: isLoadingEmployee, isError: isEmployeeError } = useQuery<User>({
    queryKey: [`/api/employees/${employeeId}`],
    enabled: isValidId,
    retry: 1
  });

  // Fetch departments data
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch employee's leave requests
  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: [`/api/leave-requests?userId=${employeeId}`],
    enabled: isValidId,
  });

  // Fetch employee's attendance records for selected month
  const { data: attendanceRecords = [] } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance', employeeId, selectedAttendanceMonth],
    queryFn: async () => {
      const response = await fetch(`/api/attendance?userId=${employeeId}&month=${selectedAttendanceMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      const data = await response.json();
      // Sort by date descending (most recent first)
      return data.sort((a: Attendance, b: Attendance) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    },
    enabled: isValidId,
  });

  // Fetch all available months for the dropdown
  const { data: allUserAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance', employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/attendance?userId=${employeeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      return response.json();
    },
    enabled: isValidId,
  });

  // Calculate monthly attendance statistics
  const getMonthlyAttendanceStats = (records: Attendance[]) => {
    let totalWorkingHours = 0;
    let totalWorkingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let lateDays = 0;

    records.forEach(record => {
      // Calculate working hours
      if (record.checkInTime && record.checkOutTime) {
        const hours = (new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / (1000 * 60 * 60);
        totalWorkingHours += hours;
      }

      // Count attendance status
      totalWorkingDays++;
      switch (record.status) {
        case 'present':
          presentDays++;
          break;
        case 'absent':
          absentDays++;
          break;
        case 'halfday':
          halfDays++;
          break;
        case 'late':
          lateDays++;
          break;
      }
    });

    return {
      totalWorkingHours,
      formattedWorkingHours: totalWorkingHours.toFixed(1),
      totalWorkingDays,
      presentDays,
      absentDays,
      halfDays,
      lateDays
    };
  };

  // Get available months from attendance data
  const getAvailableMonths = () => {
    const months = new Set<string>();
    allUserAttendance.forEach(record => {
      if (record.date) {
        const monthKey = format(new Date(record.date), 'yyyy-MM');
        months.add(monthKey);
      }
    });
    // Add current month if not present
    months.add(format(new Date(), 'yyyy-MM'));
    return Array.from(months).sort().reverse(); // Most recent first
  };

  const availableMonths = getAvailableMonths();
  const monthlyStats = getMonthlyAttendanceStats(attendanceRecords);

  // Fetch employee's leave balance with segmented query key for proper cache invalidation
  const { data: leaveBalance, isLoading: isLoadingLeaveBalance, error: leaveBalanceError } = useQuery<LeaveBalance>({
    queryKey: ['/api/employees/leave-balance', employeeId],
    queryFn: async () => {
      const response = await fetch(resolveApiUrl(`/api/employees/${employeeId}/leave-balance`), {
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
      if (!response.ok) {
        throw new Error('Failed to fetch leave balance');
      }
      return response.json();
    },
    enabled: isValidId && employeeId > 0,
  });

  // Leave stats for dashboard
  const leaveStats = [
    {
      label: "Remaining Leaves",
      value: `${leaveBalance?.remainingBalance || 0} days`,
      description: "Available to use",
      icon: CalendarClock,
      color: "text-emerald-400",
      bgColor: "bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
      borderColor: "border-emerald-500/20"
    },
    {
      label: "Used This Year",
      value: `${leaveBalance?.totalTaken || 0} days`,
      description: "Out of total limit",
      icon: CalendarDays,
      color: "text-orange-400",
      bgColor: "bg-orange-950/20 shadow-[0_0_15px_rgba(249,115,22,0.05)]",
      borderColor: "border-orange-500/20"
    },
    {
      label: "Pending Requests",
      value: `${leaveRequests.filter(r => r.status === 'pending').length} days`,
      description: "Awaiting approval",
      icon: Timer,
      color: "text-blue-400",
      bgColor: "bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]",
      borderColor: "border-blue-500/20"
    },
    {
      label: "Accrued This Year",
      value: `${leaveBalance?.totalAccrued || 0} days`,
      description: "Earned till date",
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-950/20 shadow-[0_0_15px_rgba(139,92,246,0.05)]",
      borderColor: "border-purple-500/20"
    }
  ];

  // Attendance stats for dashboard
  const attendanceStats = [
    {
      label: "Total Days",
      value: monthlyStats.totalWorkingDays,
      description: "Working days this month",
      icon: CalendarDays,
      color: "text-blue-400",
      bgColor: "bg-blue-950/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]",
      borderColor: "border-blue-500/20"
    },
    {
      label: "Present Days",
      value: monthlyStats.presentDays,
      description: "Days present",
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
      borderColor: "border-emerald-500/20"
    },
    {
      label: "Absent Days",
      value: monthlyStats.absentDays,
      description: "Days absent",
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]",
      borderColor: "border-red-500/20"
    },
    {
      label: "Half Days",
      value: monthlyStats.halfDays,
      description: "Half days taken",
      icon: Clock,
      color: "text-orange-400",
      bgColor: "bg-orange-950/20 shadow-[0_0_15px_rgba(249,115,22,0.05)]",
      borderColor: "border-orange-500/20"
    }
  ];

  // Fetch employee's payment records (server-side filtered for security)
  const { data: paymentRecords = [] } = useQuery<PaymentRecord[]>({
    queryKey: [`/api/payment-records`, employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/payment-records?employeeId=${employeeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment records');
      }
      const data = await response.json();
      // Sort by creation date descending (most recent first)
      return data.sort((a: PaymentRecord, b: PaymentRecord) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    },
    enabled: isValidId,
    retry: 1
  });

  // Calculate salary breakdown using the new formula
  const getSalaryBreakdown = (monthlyCTC: number, daysWorked: number = 25) => {
    // Step 1: Gross Salary
    const grossSalary = (monthlyCTC / 30) * daysWorked; // Monthly CTC ÷ 30 × days worked

    // Step 2: Earnings
    const basicSalary = grossSalary * 0.5; // 50% of Gross
    const da = basicSalary * 0.1; // 10% of Basic
    const hra = basicSalary * 0.5; // 50% of Basic
    const conveyance = Math.round((1600 / 30) * daysWorked); // Fixed ₹1,600 pro-rated
    const medical = Math.round((1250 / 30) * daysWorked); // Fixed ₹1,250 pro-rated
    const lta = basicSalary * 0.04;
    const child = basicSalary * 0.04;
    const oth = basicSalary * 0.06;
    const bonus = Math.round(Math.min(basicSalary, 7000) * 0.0833);
    const otAmount = 0; // Default

    const earningsBeforeSpecial = basicSalary + da + hra + conveyance + medical + lta + child + oth + bonus + otAmount;
    const specialAllowance = Math.max(0, grossSalary - earningsBeforeSpecial);

    // Step 3: Deductions
    const epf = Math.round(Math.min(basicSalary, 15000) * 0.12); // 12% of Basic capped at 15000
    const esic = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0; // 0.75% of Gross
    const professionalTax = 200; // Fixed
    // MLWF - Half yearly (June & December only) - Employee: 25, Employer: 75
    const currentMonthNum = new Date().getMonth() + 1;
    const isMlwfMonth = currentMonthNum === 6 || currentMonthNum === 12;
    const mlwfEmployee = isMlwfMonth ? 25 : 0;
    const mlwfEmployer = isMlwfMonth ? 75 : 0;

    // TDS: Annual slab-based income tax pro-rated monthly
    const annualIncome = grossSalary * 12;
    const taxableIncome = Math.max(0, annualIncome - 250000);
    let annualTax = 0;
    if (taxableIncome <= 250000) {
      annualTax = taxableIncome * 0.05;
    } else if (taxableIncome <= 500000) {
      annualTax = 12500 + (taxableIncome - 250000) * 0.20;
    } else {
      annualTax = 62500 + (taxableIncome - 500000) * 0.30;
    }
    const tds = Math.round(annualTax / 12);

    const totalDeductions = epf + esic + professionalTax + mlwfEmployee + tds;
    const netSalary = grossSalary - totalDeductions;

    return {
      monthlyCTC,
      grossSalary,
      basicSalary,
      da,
      hra,
      conveyance,
      medical,
      lta,
      child,
      oth,
      bonus,
      specialAllowance,
      epf,
      esic,
      professionalTax,
      mlwfEmployee,
      mlwfEmployer,
      tds,
      totalDeductions,
      netSalary,
      daysWorked
    };
  };

  // Create consolidated monthly payment history
  const getMonthlyPaymentHistory = () => {
    // Normalize month format function - converts various formats to "MMMM yyyy"
    const normalizeMonth = (monthStr: string): string => {
      if (!monthStr || monthStr === 'Unknown') return 'Unknown';
      try {
        // Try to parse the date and format it consistently
        const date = new Date(monthStr);
        if (!isNaN(date.getTime())) {
          return format(date, 'MMMM yyyy');
        }
        // If it's already in "MMMM yyyy" format, return as is
        return monthStr;
      } catch {
        return monthStr;
      }
    };

    // Group payment records by normalized month
    const monthlyGroups: { [key: string]: PaymentRecord[] } = {};

    paymentRecords.forEach(payment => {
      const normalizedMonth = normalizeMonth(payment.month || 'Unknown');
      if (!monthlyGroups[normalizedMonth]) {
        monthlyGroups[normalizedMonth] = [];
      }
      monthlyGroups[normalizedMonth].push(payment);
    });

    // Convert to consolidated monthly records
    const monthlyPayments = Object.entries(monthlyGroups)
      .filter(([month]) => month !== 'Unknown') // Filter out unknown months
      .map(([month, records]) => {
        // Check if any payment in this month is paid
        const hasPaidPayment = records.some(record => record.paymentStatus === 'paid');
        const hasAnyPayment = records.length > 0;

        // Get the latest payment record for this month (for reference data)
        const latestRecord = records[0];

        // Calculate monthly totals
        const totalGrossAmount = records.reduce((sum, record) => {
          const breakdown = getSalaryBreakdown(record.amount, record.daysWorked || 25);
          return sum + Math.round(breakdown.grossSalary);
        }, 0);

        const totalNetAmount = records.reduce((sum, record) => {
          const breakdown = getSalaryBreakdown(record.amount, record.daysWorked || 25);
          return sum + Math.round(breakdown.netSalary);
        }, 0);

        // Determine overall payment status for the month
        let paymentStatus: string;
        if (hasPaidPayment) {
          paymentStatus = 'paid';
        } else if (hasAnyPayment) {
          paymentStatus = 'pending';
        } else {
          paymentStatus = 'not_generated';
        }

        // Get payment date (use the first paid record's date if any, otherwise the latest record's date)
        const paidRecord = records.find(r => r.paymentStatus === 'paid');
        const paymentDate = paidRecord?.paymentDate || latestRecord?.paymentDate;

        return {
          month,
          paymentStatus,
          monthlyCTC: latestRecord?.amount || employee?.salary || 0,
          grossAmount: Math.round(totalGrossAmount / records.length), // Average for display
          netAmount: Math.round(totalNetAmount / records.length), // Average for display
          paymentDate,
          paymentMode: paidRecord?.paymentMode || latestRecord?.paymentMode,
          referenceNo: paidRecord?.referenceNo || latestRecord?.referenceNo,
          records, // Keep original records for detailed payslip generation
          latestRecord // For payslip generation
        };
      });

    // Generate complete timeline from earliest payment record to current month
    const currentDate = new Date();
    const allMonths = [];

    if (monthlyPayments.length === 0) {
      // If no payment records, just show current year up to current month
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      for (let i = 0; i <= currentMonth; i++) {
        const monthDate = new Date(currentYear, i, 1);
        const monthKey = format(monthDate, 'MMMM yyyy');
        allMonths.push({
          month: monthKey,
          paymentStatus: 'not_generated',
          grossAmount: Math.round(getSalaryBreakdown(employee?.salary || 0).grossSalary),
          netAmount: Math.round(getSalaryBreakdown(employee?.salary || 0).netSalary),
          paymentDate: null,
          paymentMode: null,
          referenceNo: null,
          records: [],
          latestRecord: null
        });
      }
    } else {
      // Find the earliest and latest months from payment records
      const paymentDates = monthlyPayments.map(mp => new Date(mp.month)).filter(date => !isNaN(date.getTime()));
      const earliestDate = paymentDates.length > 0 ? new Date(Math.min(...paymentDates.map(d => d.getTime()))) : new Date();
      const latestDate = new Date(Math.max(...paymentDates.map(d => d.getTime()), currentDate.getTime()));

      // Generate all months from earliest to latest/current
      let iterDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
      const endDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);

      while (iterDate <= endDate) {
        const monthKey = format(iterDate, 'MMMM yyyy');

        // Check if we already have this month in payment records
        const existingMonth = monthlyPayments.find(mp => mp.month === monthKey);
        if (existingMonth) {
          allMonths.push(existingMonth);
        } else {
          // Add missing month with "Not Generated" status
          allMonths.push({
            month: monthKey,
            paymentStatus: 'not_generated',
            grossAmount: Math.round(getSalaryBreakdown(employee?.salary || 0).grossSalary),
            netAmount: Math.round(getSalaryBreakdown(employee?.salary || 0).netSalary),
            paymentDate: null,
            paymentMode: null,
            referenceNo: null,
            records: [],
            latestRecord: null
          });
        }

        // Move to next month
        iterDate = new Date(iterDate.getFullYear(), iterDate.getMonth() + 1, 1);
      }
    }

    // Sort by month (most recent first)
    return allMonths.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const monthlyPaymentHistory = getMonthlyPaymentHistory();

  if (isLoadingEmployee && isValidId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employee details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!employee || !isValidId || isEmployeeError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Employee Not Found</h2>
            <p className="text-gray-600 mb-4">The employee you're looking for doesn't exist, has been removed, or there was an error.</p>
            <Link href="/payroll">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payroll
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const department = departments.find(dept => dept.id === employee.departmentId);

  const salaryBreakdown = getSalaryBreakdown(employee.salary || 0);

  // Generate professional payslip PDF
  const generatePayslipPDF = (historyItem?: any) => {
    // If we have a history item with records, use the actual payment record for breakdown
    // Otherwise fall back to current employee salary
    const record = historyItem?.latestRecord;

    const b = record
      ? getSalaryBreakdown(record.amount, record.daysWorked || 25)
      : (historyItem ? getSalaryBreakdown(historyItem.monthlyCTC || employee.salary || 0, 25) : salaryBreakdown);

    const payrollMonth = historyItem?.month || format(new Date(), 'MMMM yyyy');

    generateProfessionalPayslip({
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeId: employee.employeeId || employee.id.toString(),
      designation: employee.position || "N/A",
      department: department?.name || "N/A",
      dateOfJoining: employee.joinDate || new Date(),
      bankAccountNo: employee.bankAccountNumber || "N/A",
      paidDays: b.daysWorked,
      lopDays: 30 - b.daysWorked,
      pfAccountNumber: employee.employeeId ? 'PU/PUN/' + employee.employeeId : 'N/A',
      uan: employee.uanNumber || 'N/A',
      esiNumber: employee.esicNumber || 'N/A',
      pan: employee.panCard || 'N/A',
      workLocation: employee.workLocation || 'Pune',
      month: payrollMonth,
      breakdown: {
        gross: b.grossSalary,
        basic: b.basicSalary,
        hra: b.hra,
        da: b.da,
        conveyance: b.conveyance,
        medical: b.medical,
        specialAllowance: b.specialAllowance,
        epf: b.epf,
        esic: b.esic,
        pt: b.professionalTax,
        deductions: b.totalDeductions,
        net: b.netSalary
      }
    });
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#030816] text-slate-100">
        {/* Professional Indigo Gradient Header */}
        <motion.div
          className="relative bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#1E1B4B] text-white overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="px-6 py-10">
            <div className="">
              <div className="flex items-center gap-2 text-indigo-200/60 text-sm mb-4">
                <Link href="/employees" className="hover:text-white transition-colors">Employees</Link>
                <span>/</span>
                <span className="text-white font-medium">Employee Details</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                  <Link href="/employees">
                    <Button variant="outline" size="icon" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg backdrop-blur-md h-10 w-10">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">Employee Details</h1>
                    <p className="text-indigo-100/80 text-lg font-medium">Comprehensive view of employee information, payroll, and leave records</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button className="!bg-emerald-600 hover:!bg-emerald-700 !text-white border-0 shadow-lg shadow-emerald-500/10 font-bold px-6 rounded-xl">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="px-6 pb-8 -mt-8 w-full">
          {/* Employee Profile Card */}
          <Card className="shadow-xl mb-8 border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md text-slate-200">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative">
                  <Avatar className="h-28 w-28 ring-4 ring-white/10 shadow-2xl">
                    <AvatarImage src={employee.photoUrl || undefined} alt={`${employee.firstName} ${employee.lastName}`} />
                    <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2">
                    <Badge className={`${employee.isActive ? "bg-emerald-500" : "bg-slate-500"} text-white border-[#0c1427] border-2 px-3 py-1 text-[10px] uppercase font-black tracking-widest`}>
                      {employee.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-3xl font-black text-white mb-1">{employee.firstName} {employee.lastName}</h3>
                    <p className="text-xl text-blue-400 font-bold">{employee.position || 'Super Admin'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-950/10 rounded-xl border border-blue-500/20 flex items-center gap-4">
                      <div className="p-2 bg-white/[0.04] rounded-lg shadow-sm">
                        <Mail className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-wider opacity-60">Email</p>
                        <p className="text-sm font-bold text-slate-200 truncate max-w-[150px]">{employee.email}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-950/10 rounded-xl border border-emerald-500/20 flex items-center gap-4">
                      <div className="p-2 bg-white/[0.04] rounded-lg shadow-sm">
                        <Phone className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider opacity-60">Phone</p>
                        <p className="text-sm font-bold text-slate-200">{employee.phoneNumber || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-950/10 rounded-xl border border-purple-500/20 flex items-center gap-4">
                      <div className="p-2 bg-white/[0.04] rounded-lg shadow-sm">
                        <Building2 className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-purple-300 uppercase tracking-wider opacity-60">Department</p>
                        <p className="text-sm font-bold text-slate-200">{department?.name || 'Human Resources'}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-950/10 rounded-xl border border-amber-500/20 flex items-center gap-4">
                      <div className="p-2 bg-white/[0.04] rounded-lg shadow-sm">
                        <Calendar className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-amber-300 uppercase tracking-wider opacity-60">Join Date</p>
                        <p className="text-sm font-bold text-slate-200">
                          {employee.joinDate ? format(new Date(employee.joinDate), 'MMM dd, yyyy') : 'Jan 01, 2024'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balance Section */}
          <div className="bg-[#0c1427]/60 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white/[0.08] mb-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-100">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">Leave Balance</h4>
                <p className="text-emerald-600 font-bold text-sm">Current leave status and accruals</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {leaveStats.map((stat, idx) => (
                <div key={idx} className={`p-6 rounded-3xl ${stat.bgColor} border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all`}>
                  <div className="relative z-10">
                    <p className="text-sm font-bold text-slate-500 mb-3">{stat.label}</p>
                    <h4 className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.description}</p>
                  </div>
                  <div className={`absolute top-4 right-4 p-2 bg-white/80 rounded-xl ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-white/[0.02] rounded-[2rem] border border-white/[0.08]">
              <div className="flex justify-between items-center mb-6">
                <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest">Leave Usage Progress</h5>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  <Clock className="h-3 w-3" />
                  Next accrual: Feb 01, 2026
                </div>
              </div>

              <div className="relative h-4 w-full bg-[#0c1427]/60 rounded-full overflow-hidden shadow-inner border border-white/[0.08] mb-6">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000"
                  style={{ width: `${((leaveBalance?.totalTaken || 3) / (leaveBalance?.totalAccrued || 36)) * 100}%` }}
                />
                <div
                  className="absolute top-0 h-full bg-blue-500 transition-all duration-1000 opacity-60"
                  style={{
                    left: `${((leaveBalance?.totalTaken || 3) / (leaveBalance?.totalAccrued || 36)) * 100}%`,
                    width: `${((leaveRequests.filter(r => r.status === 'pending').length) / (leaveBalance?.totalAccrued || 36)) * 100}%`
                  }}
                />
                <div
                  className="absolute top-0 h-full bg-emerald-400 transition-all duration-1000 opacity-20"
                  style={{
                    left: `${(((leaveBalance?.totalTaken || 3) + leaveRequests.filter(r => r.status === 'pending').length) / (leaveBalance?.totalAccrued || 36)) * 100}%`,
                    width: '100%'
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-8 justify-center">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Used: {((leaveBalance?.totalTaken || 3) / (leaveBalance?.totalAccrued || 36) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending: 0.0%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available: {(100 - ((leaveBalance?.totalTaken || 3) / (leaveBalance?.totalAccrued || 36) * 100)).toFixed(1)}%</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  As of January 13, 2026 • Leave accrues at 1.5 days per month • Balance calculated from join date
                </p>
              </div>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 h-14 bg-muted p-1.5 rounded-2xl border border-border">
              <TabsTrigger value="payroll" className="rounded-xl data-[state=active]:!bg-blue-600 data-[state=active]:!text-white font-bold text-muted-foreground hover:text-foreground dark:hover:text-white">Payroll Details</TabsTrigger>
              <TabsTrigger value="leave" className="rounded-xl data-[state=active]:!bg-emerald-600 data-[state=active]:!text-white font-bold text-muted-foreground hover:text-foreground dark:hover:text-white">Leave Management</TabsTrigger>
              <TabsTrigger value="attendance" className="rounded-xl data-[state=active]:!bg-purple-600 data-[state=active]:!text-white font-bold text-muted-foreground hover:text-foreground dark:hover:text-white">Attendance Records</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl data-[state=active]:!bg-indigo-600 data-[state=active]:!text-white font-bold text-muted-foreground hover:text-foreground dark:hover:text-white">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="payroll" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-blue-950/10 rounded-3xl border border-blue-500/20 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-400 mb-2">Monthly CTC</p>
                    <h4 className="text-3xl font-black text-white">₹{employee.salary?.toLocaleString() || '30,000'}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Total cost to company</p>
                  </div>
                  <div className="p-2 bg-white/[0.04] rounded-xl shadow-sm">
                    <DollarSign className="h-6 w-6 text-blue-400" />
                  </div>
                </div>

                <div className="p-6 bg-emerald-950/10 rounded-3xl border border-emerald-500/20 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-400 mb-2">Gross Salary</p>
                    <h4 className="text-3xl font-black text-white">₹{Math.round(salaryBreakdown.grossSalary).toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">For 25 payable days</p>
                  </div>
                  <div className="p-2 bg-white/[0.04] rounded-xl shadow-sm">
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>

                <div className="p-6 bg-amber-950/10 rounded-3xl border border-amber-500/20 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-400 mb-2">Total Deductions</p>
                    <h4 className="text-3xl font-black text-white">₹{Math.round(salaryBreakdown.totalDeductions).toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">EPF + ESIC + Prof. Tax</p>
                  </div>
                  <div className="p-2 bg-white/[0.04] rounded-xl shadow-sm">
                    <DollarSign className="h-6 w-6 text-amber-400" />
                  </div>
                </div>

                <div className="p-6 bg-emerald-950/10 rounded-3xl border border-emerald-500/20 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-400 mb-2">Net Salary</p>
                    <h4 className="text-3xl font-black text-emerald-300">₹{Math.round(salaryBreakdown.netSalary).toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Take home amount</p>
                  </div>
                  <div className="p-2 bg-white/[0.04] rounded-xl shadow-sm">
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  </div>
                </div>
              </div>

              <Card className="shadow-lg border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-sm">
                <CardHeader className="border-b border-white/[0.08] bg-white/[0.02] pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Salary Structure & Calculation</CardTitle>
                        <CardDescription className="text-slate-400">Detailed breakdown as per company policy</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Step 1: Gross Salary */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">1</span>
                      Step 1: Gross Salary
                    </h4>
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.08] flex items-center justify-between">
                      <p className="text-sm text-slate-400">
                        Monthly CTC: ₹{employee.salary?.toLocaleString() || '0'} / 30 × 25 payable days
                      </p>
                      <Badge variant="outline" className="text-sm font-bold bg-white/[0.04] px-3 py-1">₹{Math.round(salaryBreakdown.grossSalary).toLocaleString()}</Badge>
                    </div>
                  </div>

                  {/* Step 2: Earnings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">2</span>
                      Step 2: Earnings Breakup
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-950/10 rounded-xl border border-blue-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-400">Basic Salary (50% of Gross)</span>
                          <span className="text-sm font-bold text-white">₹{Math.round(salaryBreakdown.basicSalary).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-950/10 rounded-xl border border-blue-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-400">HRA (50% of Basic)</span>
                          <span className="text-sm font-bold text-white">₹{Math.round(salaryBreakdown.hra).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-950/10 rounded-xl border border-blue-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-400">DA (10% of Basic)</span>
                          <span className="text-sm font-bold text-white">₹{Math.round(salaryBreakdown.da).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-950/10 rounded-xl border border-blue-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-400">Special Allowance (Balance)</span>
                          <span className="text-sm font-bold text-white">₹{Math.round(salaryBreakdown.specialAllowance).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-300 font-bold flex justify-between items-center">
                      <span>Total Earnings</span>
                      <span>₹{Math.round(salaryBreakdown.grossSalary).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Step 3: Deductions */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">3</span>
                      Step 3: Deductions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-red-950/10 rounded-xl border border-red-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-400">EPF (12% of Basic)</span>
                          <span className="text-sm font-bold text-white">₹{Math.round(salaryBreakdown.epf).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-red-950/10 rounded-xl border border-red-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-400">ESIC (0.75% of Gross)</span>
                          <span className="text-sm font-bold text-white">₹{Math.round(salaryBreakdown.esic).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-red-950/10 rounded-xl border border-red-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-slate-400">Professional Tax (Fixed)</span>
                          <span className="text-sm font-bold text-white">₹{Math.round(salaryBreakdown.professionalTax).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-red-300 font-bold flex justify-between items-center">
                      <span>Total Deductions</span>
                      <span>₹{Math.round(salaryBreakdown.totalDeductions).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Step 4: Net Take Home */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">4</span>
                      Step 4: Net Take Home Salary
                    </h4>
                    <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-[0_0_20px_rgba(99,102,241,0.2)] text-white flex justify-between items-center">
                      <div>
                        <p className="text-indigo-100 text-sm mb-1">Gross Salary - Total Deductions</p>
                        <p className="text-xs text-indigo-200 italic opacity-80">Final amount credited to bank account</p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-3xl font-black">₹{Math.round(salaryBreakdown.netSalary).toLocaleString()}</h4>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/[0.08] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Generate Payslip</p>
                        <p className="text-xs text-slate-400">Download a professional PDF document with complete salary breakdown</p>
                      </div>
                    </div>
                    <Button onClick={generatePayslipPDF} className="!bg-blue-600 hover:!bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/10 gap-2">
                      <Download className="h-4 w-4" />
                      Download Payslip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leave" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {leaveStats.map((stat, idx) => (
                  <Card key={idx} className={`border border-white/[0.08] border-l-4 ${stat.borderColor} bg-[#0c1427]/60 shadow-md transition-all text-slate-200`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                          <h4 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 italic">{stat.description}</p>
                        </div>
                        <div className={`p-2 ${stat.bgColor} rounded-lg ${stat.color}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-lg border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-md text-slate-200">
                  <CardHeader className="border-b border-white/[0.08] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <CalendarDays className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-white">Detailed Leave Balance</CardTitle>
                        <CardDescription className="text-slate-400">Comprehensive leave accrual and usage breakdown</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold text-white border-b border-white/[0.08] pb-2">Leave Balance Overview</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm p-3 bg-white/[0.02] rounded-lg border border-white/[0.08] text-slate-300">
                              <span className="text-slate-400">Total Accrued</span>
                              <span className="font-bold text-white">{leaveBalance?.totalAccrued || 0} days</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-3 bg-red-500/5 rounded-lg border border-red-500/20 text-slate-300">
                              <span className="text-red-400">Total Used</span>
                              <span className="font-bold text-red-400">{leaveBalance?.totalTaken || 0} days</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-slate-300">
                              <span className="text-amber-400 font-medium">Pending Requests</span>
                              <span className="font-bold text-amber-400">{leaveRequests.filter(r => r.status === 'pending').length} days</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-slate-300">
                              <span className="text-emerald-300 font-bold">Remaining Balance</span>
                              <span className="text-xl font-black text-emerald-400">{leaveBalance?.remainingBalance || 0} days</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h5 className="text-sm font-bold text-white border-b border-white/[0.08] pb-2">Current Year Analysis</h5>
                          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.08] space-y-4">
                            <div>
                              <div className="flex justify-between text-xs mb-1.5 font-medium">
                                <span>Accrual Plan Status</span>
                                <span className="text-emerald-400">75% Complete</span>
                              </div>
                              <div className="h-2 w-full bg-white/[0.08] rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-3/4 rounded-full" />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1.5 font-medium">
                                <span>Leave Usage Ratio</span>
                                <span className="text-amber-400">25% Used</span>
                              </div>
                              <div className="h-2 w-full bg-white/[0.08] rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-1/4 rounded-full" />
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 space-y-3">
                            <h6 className="text-xs font-bold text-blue-300 uppercase">Accrual Information</h6>
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-400">Monthly Accrual Rate</span>
                              <span className="font-bold">1.5 days</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-400">Next Accrual Date</span>
                              <span className="font-bold">Feb 01, 2026</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/[0.08]">
                        <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                          Leave Balance Visualization
                        </h5>
                        <div className="relative h-4 w-full bg-[#0c1427]/60 border border-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-1000"
                            style={{ width: `${((leaveBalance?.totalTaken || 0) / (leaveBalance?.totalAccrued || 25)) * 100}%` }}
                          />
                          <div
                            className="absolute top-0 h-full bg-amber-400 transition-all duration-1000"
                            style={{
                              left: `${((leaveBalance?.totalTaken || 0) / (leaveBalance?.totalAccrued || 25)) * 100}%`,
                              width: `${((leaveRequests.filter(r => r.status === 'pending').length) / (leaveBalance?.totalAccrued || 25)) * 100}%`
                            }}
                          />
                          <div
                            className="absolute top-0 h-full bg-emerald-500 transition-all duration-1000"
                            style={{
                              left: `${(((leaveBalance?.totalTaken || 0) + leaveRequests.filter(r => r.status === 'pending').length) / (leaveBalance?.totalAccrued || 25)) * 100}%`,
                              width: '100%'
                            }}
                          />
                        </div>
                        <div className="flex gap-6 mt-4 justify-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-sm" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Used Leaves</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-400 rounded-sm" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Pending</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-sm text-slate-200">
                  <CardHeader className="border-b border-white/[0.08] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <CalendarClock className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-white">Monthly Leave Summary</CardTitle>
                        <CardDescription className="text-slate-400">Leaves organized by month for better analysis</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[480px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/[0.08]">
                      {availableMonths.map((monthKey, idx) => {
                        const monthDate = new Date(monthKey + '-01');
                        const formattedMonth = format(monthDate, 'MMMM yyyy');
                        const monthlyLeaves = leaveRequests.filter(r => {
                          if (!r.startDate) return false;
                          return format(new Date(r.startDate), 'yyyy-MM') === monthKey;
                        });

                        return (
                          <div key={idx} className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
                            <div className="flex justify-between items-center mb-3">
                              <h6 className="text-sm font-bold text-white">{formattedMonth}</h6>
                              <Badge variant="outline" className="bg-white/[0.04] border-white/[0.08] text-[10px] uppercase font-bold text-slate-300">{monthlyLeaves.length} Records</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2 bg-emerald-500/10 rounded-lg text-center">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase mb-0.5">Approved</p>
                                <p className="text-sm font-black text-emerald-400">{monthlyLeaves.filter(r => r.status === 'approved').length}</p>
                              </div>
                              <div className="p-2 bg-amber-500/10 rounded-lg text-center">
                                <p className="text-[10px] font-bold text-amber-400 uppercase mb-0.5">Pending</p>
                                <p className="text-sm font-black text-amber-400">{monthlyLeaves.filter(r => r.status === 'pending').length}</p>
                              </div>
                              <div className="p-2 bg-red-500/10 rounded-lg text-center">
                                <p className="text-[10px] font-bold text-red-400 uppercase mb-0.5">Rejected</p>
                                <p className="text-sm font-black text-red-400">{monthlyLeaves.filter(r => r.status === 'rejected').length}</p>
                              </div>
                              <div className="p-2 bg-blue-500/10 rounded-lg text-center">
                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-0.5">Total Days</p>
                                <p className="text-sm font-black text-blue-400">0</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {attendanceStats.map((stat, idx) => (
                  <Card key={idx} className={`border border-white/[0.08] border-l-4 ${stat.borderColor} bg-[#0c1427]/60 shadow-md transition-all text-slate-200`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                          <h4 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 italic">{stat.description}</p>
                        </div>
                        <div className={`p-2 ${stat.bgColor} rounded-lg ${stat.color}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="shadow-lg border border-white/[0.08] bg-[#0c1427]/60 backdrop-blur-sm text-slate-200">
                <CardHeader className="border-b border-white/[0.08] bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <CalendarDays className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-white">Monthly Attendance Records</CardTitle>
                        <CardDescription className="text-slate-400">Attendance records organized by month with detailed analysis</CardDescription>
                      </div>
                    </div>
                    <select
                      className="bg-white/[0.02] border border-white/[0.08] text-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-all"
                      value={selectedAttendanceMonth}
                      onChange={(e) => setSelectedAttendanceMonth(e.target.value)}
                    >
                      {availableMonths.map(month => (
                        <option key={month} value={month}>
                          {format(new Date(month + '-01'), 'MMMM yyyy')}
                        </option>
                      ))}
                    </select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/[0.08]">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Check In</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Check Out</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Working Hours</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Device/IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.08]">
                        {attendanceRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic bg-white/[0.01]">
                              No attendance records found for the selected month.
                            </td>
                          </tr>
                        ) : (
                          attendanceRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group border-b border-white/[0.04]">
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-white">{record.date ? format(new Date(record.date), 'EEE, MMM dd, yyyy') : 'N/A'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-emerald-500" />
                                  <p className="text-sm text-slate-300 font-medium">{record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '--:--'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-red-500" />
                                  <p className="text-sm text-slate-300 font-medium">{record.checkOutTime ? format(new Date(record.checkOutTime), 'hh:mm a') : '--:--'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 font-bold">
                                  {record.checkInTime && record.checkOutTime
                                    ? ((new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(1) + ' hrs'
                                    : '0.0 hrs'
                                  }
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  className={`
                                    ${record.status === 'present' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                    ${record.status === 'absent' ? 'bg-red-500 hover:bg-red-600' : ''}
                                    ${record.status === 'halfday' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                                    ${record.status === 'late' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                    text-white border-0 font-bold px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wider
                                  `}
                                >
                                  {record.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-[10px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors">IP: 192.168.1.1</p>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/[0.04] rounded-lg">
                        <Banknote className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-white">Payment History</CardTitle>
                        <CardDescription className="text-slate-400">Monthly salary payment records and payroll management</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Monthly CTC</p>
                        <p className="text-sm font-black text-white">₹{employee.salary?.toLocaleString() || '0'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Net Salary</p>
                        <p className="text-sm font-black text-blue-400">₹{Math.round(salaryBreakdown.netSalary).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/[0.08]">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Month</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Gross Salary</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Net Amount</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mode</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reference No</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.08]">
                        {monthlyPaymentHistory.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic bg-white/[0.01]">
                              No payment records found.
                            </td>
                          </tr>
                        ) : (
                          monthlyPaymentHistory.map((payment, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group border-b border-white/[0.04]">
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-white">{payment.month}</p>
                                <p className="text-[10px] text-slate-500 font-medium">Pay Period</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="text-sm font-bold text-white">₹{payment.grossAmount.toLocaleString()}</p>
                                <p className="text-[10px] text-emerald-400 font-medium">Before Deductions</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="text-sm font-black text-blue-400">₹{payment.netAmount.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400 font-medium">Take Home Amount</p>
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  className={`
                                    ${payment.paymentStatus === 'paid' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                                    ${payment.paymentStatus === 'pending' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                    ${payment.paymentStatus === 'not_generated' ? 'bg-white/[0.08] text-slate-400 hover:bg-white/[0.12]' : 'text-white'}
                                    border-0 font-bold px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wider
                                  `}
                                >
                                  {payment.paymentStatus === 'not_generated' ? 'Not Generated' : payment.paymentStatus}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-slate-300 font-medium">
                                  {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd, yyyy') : '--'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium italic">Execution Date</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-white/[0.04] rounded">
                                    <CreditCard className="h-3 w-3 text-slate-400" />
                                  </div>
                                  <p className="text-sm text-slate-300 font-medium capitalize">{payment.paymentMode || '--'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-slate-300 font-mono tracking-tighter truncate max-w-[120px]">
                                  {payment.referenceNo || '--'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">TXN ID</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-2 border-white/[0.08] text-blue-400 hover:bg-white/[0.04] disabled:opacity-50"
                                  disabled={payment.paymentStatus === 'not_generated'}
                                  onClick={() => generatePayslipPDF(payment)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Payslip
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
