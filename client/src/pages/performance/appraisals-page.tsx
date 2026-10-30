import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, Calendar, Star, Users, FileText, CheckCircle, Clock, Plus, 
  Edit2, Target, Award, UserCheck, ShieldCheck, ArrowUpRight, MessageSquare 
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Department, Appraisal as DBAppraisal, Goal } from "@shared/schema";

interface AppraisalRow {
  id: number;
  dbId?: number;
  userId: number;
  employeeName: string;
  departmentName: string;
  departmentId: number | null;
  managerName: string;
  managerId: number | null;
  quarter: string;
  year: number;
  kpiScore: number;
  selfRating: number | null;
  selfComments: string | null;
  managerRating: number | null;
  managerFeedback: string | null;
  overallRating: number | null;
  status: string;
  goalsCount: number;
  goals: Goal[];
}

export default function AppraisalsPage() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const isHR = authUser?.role === 'admin' || authUser?.role === 'hr' || authUser?.role === 'developer';
  const isManager = authUser?.role === 'manager';

  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isSelfReviewOpen, setIsSelfReviewOpen] = useState(false);
  const [isManagerReviewOpen, setIsManagerReviewOpen] = useState(false);
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalRow | null>(null);

  // Self review form
  const [selfReviewData, setSelfReviewData] = useState({
    rating: "4.0",
    comments: "",
  });

  // Manager review form
  const [managerReviewData, setManagerReviewData] = useState({
    rating: "4.5",
    feedback: "",
    overrideKpiScore: "",
  });

  // New cycle form
  const [newCycle, setNewCycle] = useState({
    quarter: "Q2",
    year: "2026",
    title: "Q2 2026 Performance Appraisal Cycle",
    deadline: "2026-06-30"
  });

  // Data fetching
  const { data: dbAppraisals = [] } = useQuery<DBAppraisal[]>({
    queryKey: ['/api/appraisals'],
  });

  const { data: allGoals = [] } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ['/api/employees'],
  });

  const { data: deptList = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Helper maps
  const deptMap = useMemo(() => {
    const map = new Map<number, Department>();
    deptList.forEach(d => map.set(d.id, d));
    return map;
  }, [deptList]);

  const employeeMap = useMemo(() => {
    const map = new Map<number, User>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  // Combine DB Appraisals, Real Goals & Employees into comprehensive appraisal rows
  const appraisalRows = useMemo<AppraisalRow[]>(() => {
    // Filter goals for selected quarter & year
    const quarterGoals = allGoals.filter(g => g.quarter === selectedQuarter && g.year === parseInt(selectedYear));

    // Map goals by userId
    const goalsByUser = new Map<number, Goal[]>();
    quarterGoals.forEach(g => {
      if (g.userId) {
        const list = goalsByUser.get(g.userId) || [];
        list.push(g);
        goalsByUser.set(g.userId, list);
      }
    });

    // Map DB appraisals for selected quarter & year
    const appraisalByUser = new Map<number, DBAppraisal>();
    dbAppraisals
      .filter(a => a.quarter === selectedQuarter && a.year === parseInt(selectedYear))
      .forEach(a => appraisalByUser.set(a.userId, a));

    // Get list of employees to display
    // If regular employee, only show themselves
    const visibleEmployees = (!isHR && !isManager)
      ? employees.filter(e => e.id === authUser?.id)
      : employees.filter(e => e.role === 'employee' || e.id === authUser?.id || goalsByUser.has(e.id) || appraisalByUser.has(e.id));

    return visibleEmployees.map(emp => {
      const empGoals = goalsByUser.get(emp.id) || [];
      const dbApp = appraisalByUser.get(emp.id);

      // Compute dynamic KPI score from actual goals
      let computedKpiScore = 0;
      if (empGoals.length > 0) {
        let totalWeight = 0;
        let weightedSum = 0;
        empGoals.forEach(g => {
          const w = g.weightage || 20;
          totalWeight += w;
          weightedSum += (g.progress || 0) * w;
        });
        computedKpiScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
      } else if (dbApp?.kpiScore !== undefined && dbApp?.kpiScore !== null) {
        computedKpiScore = dbApp.kpiScore;
      }

      // Find department
      const dept = emp.departmentId ? deptMap.get(emp.departmentId) : null;
      const deptName = dept?.name || "General";

      // Find line manager
      let managerName = "Department Manager";
      let managerId: number | null = dbApp?.managerId || null;

      if (!managerId && dept) {
        // Find manager in department
        const mgrUser = employees.find(e => e.departmentId === dept.id && (e.role === 'manager' || e.id === (dept as any).managerId));
        if (mgrUser) {
          managerId = mgrUser.id;
          managerName = `${mgrUser.firstName} ${mgrUser.lastName}`;
        }
      } else if (managerId) {
        const mgrUser = employeeMap.get(managerId);
        if (mgrUser) managerName = `${mgrUser.firstName} ${mgrUser.lastName}`;
      }

      const selfRatingNum = dbApp?.selfRating ? parseFloat(dbApp.selfRating) : null;
      const managerRatingNum = dbApp?.managerRating ? parseFloat(dbApp.managerRating) : null;
      const overallRatingNum = dbApp?.overallRating ? parseFloat(dbApp.overallRating) : (
        managerRatingNum ? managerRatingNum : (selfRatingNum ? selfRatingNum : null)
      );

      return {
        id: emp.id,
        dbId: dbApp?.id,
        userId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        departmentName: deptName,
        departmentId: emp.departmentId || null,
        managerName,
        managerId,
        quarter: selectedQuarter,
        year: parseInt(selectedYear),
        kpiScore: computedKpiScore,
        selfRating: selfRatingNum,
        selfComments: dbApp?.selfComments || null,
        managerRating: managerRatingNum,
        managerFeedback: dbApp?.managerFeedback || null,
        overallRating: overallRatingNum,
        status: dbApp?.status || (empGoals.length > 0 ? "Self Review" : "Pending"),
        goalsCount: empGoals.length,
        goals: empGoals,
      };
    });
  }, [allGoals, dbAppraisals, employees, deptMap, employeeMap, selectedQuarter, selectedYear, isHR, isManager, authUser]);

  // Filtered appraisals
  const filteredAppraisals = useMemo(() => {
    return appraisalRows.filter(row => {
      if (filterDepartment !== "all" && row.departmentId?.toString() !== filterDepartment) return false;
      if (filterStatus !== "all" && row.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empMatch = row.employeeName.toLowerCase().includes(q);
        const mgrMatch = row.managerName.toLowerCase().includes(q);
        const deptMatch = row.departmentName.toLowerCase().includes(q);
        if (!empMatch && !mgrMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [appraisalRows, filterDepartment, filterStatus, searchQuery]);

  // Statistics
  const appraisalStats = useMemo(() => {
    const total = filteredAppraisals.length;
    const completed = filteredAppraisals.filter(a => a.status === "Completed").length;
    const pending = filteredAppraisals.filter(a => a.status !== "Completed").length;
    const rated = filteredAppraisals.filter(a => a.overallRating !== null);
    const avgRating = rated.length > 0 
      ? (rated.reduce((sum, a) => sum + (a.overallRating || 0), 0) / rated.length).toFixed(1) 
      : "-";

    return [
      { title: `Employees Reviewed (${selectedQuarter} ${selectedYear})`, value: total.toString(), icon: <Users className="h-5 w-5" />, color: "bg-teal-50 text-teal-600" },
      { title: "Completed Appraisals", value: completed.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
      { title: "Pending Reviews", value: pending.toString(), icon: <Clock className="h-5 w-5" />, color: "bg-amber-50 text-amber-600" },
      { title: "Average Overall Rating", value: avgRating, icon: <Star className="h-5 w-5" />, color: "bg-purple-50 text-purple-600" },
    ];
  }, [filteredAppraisals, selectedQuarter, selectedYear]);

  // Mutations
  const saveAppraisalMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const res = await apiRequest("PUT", `/api/appraisals/${payload.id}`, payload);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/appraisals", payload);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals'] });
      toast({ title: "Appraisal Saved", description: "Review record updated successfully." });
      setIsSelfReviewOpen(false);
      setIsManagerReviewOpen(false);
      setIsViewDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  // Action handlers
  const handleOpenSelfReview = (row: AppraisalRow) => {
    setSelectedAppraisal(row);
    setSelfReviewData({
      rating: row.selfRating ? row.selfRating.toString() : "4.0",
      comments: row.selfComments || "",
    });
    setIsSelfReviewOpen(true);
  };

  const handleSubmitSelfReview = () => {
    if (!selectedAppraisal) return;
    const payload: any = {
      id: selectedAppraisal.dbId,
      userId: selectedAppraisal.userId,
      departmentId: selectedAppraisal.departmentId,
      managerId: selectedAppraisal.managerId,
      quarter: selectedQuarter,
      year: parseInt(selectedYear),
      kpiScore: selectedAppraisal.kpiScore,
      selfRating: selfReviewData.rating,
      selfComments: selfReviewData.comments,
      status: "Manager Review",
      submittedAt: new Date().toISOString()
    };
    saveAppraisalMutation.mutate(payload);
  };

  const handleOpenManagerReview = (row: AppraisalRow) => {
    setSelectedAppraisal(row);
    setManagerReviewData({
      rating: row.managerRating ? row.managerRating.toString() : "4.5",
      feedback: row.managerFeedback || "",
      overrideKpiScore: row.kpiScore.toString()
    });
    setIsManagerReviewOpen(true);
  };

  const handleSubmitManagerReview = () => {
    if (!selectedAppraisal) return;
    const mgrRating = parseFloat(managerReviewData.rating);
    const selfRating = selectedAppraisal.selfRating || mgrRating;
    const kpiVal = parseInt(managerReviewData.overrideKpiScore) || selectedAppraisal.kpiScore;

    // Calculate balanced overall rating: 40% KPI Score (converted to 5 pt scale) + 60% Manager evaluation
    const kpiOutOf5 = (kpiVal / 100) * 5;
    const overall = ((kpiOutOf5 * 0.4) + (mgrRating * 0.6)).toFixed(1);

    const payload: any = {
      id: selectedAppraisal.dbId,
      userId: selectedAppraisal.userId,
      departmentId: selectedAppraisal.departmentId,
      managerId: selectedAppraisal.managerId || authUser?.id,
      quarter: selectedQuarter,
      year: parseInt(selectedYear),
      kpiScore: kpiVal,
      managerRating: managerReviewData.rating,
      managerFeedback: managerReviewData.feedback,
      overallRating: overall,
      status: "Completed",
      completedAt: new Date().toISOString()
    };
    saveAppraisalMutation.mutate(payload);
  };

  const handleViewDetails = (row: AppraisalRow) => {
    setSelectedAppraisal(row);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Manager Review": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Self Review": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">
                Performance Appraisals
              </h1>
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs font-semibold">
                Original KPI Driven
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">
              Quarterly appraisal engine calculating real scores from employee KPIs with dual Self & Manager reviews
            </p>
          </div>

          {isHR && (
            <Button 
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              onClick={() => setIsNewCycleOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Start Appraisal Cycle
            </Button>
          )}
        </motion.div>

        {/* Quarter Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter} className="w-full sm:w-auto">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="Q1" className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:font-semibold data-[state=active]:shadow-xs">
                Q1 Review <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-teal-100 text-teal-800 rounded-full font-bold">Active</span>
              </TabsTrigger>
              <TabsTrigger value="Q2" className="data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Q2 Review
              </TabsTrigger>
              <TabsTrigger value="Q3" className="data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Q3 Review
              </TabsTrigger>
              <TabsTrigger value="Q4" className="data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Q4 Review
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {appraisalStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="border-slate-200 shadow-xs hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500 font-medium">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Appraisals Table Card */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Employee Quarterly Appraisals ({selectedQuarter} {selectedYear})
                </CardTitle>
                <CardDescription>
                  Real KPI achievement linked to line manager evaluation and self assessment
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search employee, manager, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-56 h-9 text-xs"
                />

                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {deptList.map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-36 h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Self Review">Self Review</SelectItem>
                    <SelectItem value="Manager Review">Manager Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Line Manager</th>
                    <th className="px-4 py-3 text-center">KPI Score</th>
                    <th className="px-4 py-3 text-center">Self Rating</th>
                    <th className="px-4 py-3 text-center">Mgr Rating</th>
                    <th className="px-4 py-3 text-center">Overall</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAppraisals.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400">
                        No appraisal records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAppraisals.map((row) => {
                      const isCurrentUser = authUser?.id === row.userId;
                      const isCurrentUserManager = authUser?.id === row.managerId || isHR || isManager;

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-slate-900">
                            <div>
                              <p className="font-semibold text-slate-900">{row.employeeName}</p>
                              <span className="text-xs text-slate-400 font-normal">
                                {row.goalsCount} quarterly goals assigned
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{row.departmentName}</td>
                          <td className="px-4 py-3.5 text-slate-600">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                              {row.managerName}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-bold text-teal-700">{row.kpiScore}%</span>
                              <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-teal-600 h-full rounded-full" 
                                  style={{ width: `${Math.min(row.kpiScore, 100)}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center font-medium">
                            {row.selfRating ? (
                              <span className="inline-flex items-center gap-1 text-slate-800 text-xs">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                {row.selfRating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-medium">
                            {row.managerRating ? (
                              <span className="inline-flex items-center gap-1 text-slate-800 text-xs">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                {row.managerRating.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Pending</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {row.overallRating ? (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-bold gap-1">
                                <Award className="h-3 w-3 text-amber-600" />
                                {row.overallRating.toFixed(1)} / 5.0
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Badge className={`${getStatusColor(row.status)} border text-[11px]`}>
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Self Review Button for the employee */}
                              {isCurrentUser && row.status !== "Completed" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 gap-1"
                                  onClick={() => handleOpenSelfReview(row)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                  Self Review
                                </Button>
                              )}

                              {/* Manager Review Button */}
                              {isCurrentUserManager && row.status !== "Pending" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-xs border-blue-300 text-blue-800 hover:bg-blue-50 gap-1"
                                  onClick={() => handleOpenManagerReview(row)}
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                                  {row.status === "Completed" ? "Re-evaluate" : "Evaluate"}
                                </Button>
                              )}

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs text-slate-600"
                                onClick={() => handleViewDetails(row)}
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== SUBMIT SELF REVIEW DIALOG ==================== */}
      <Dialog open={isSelfReviewOpen} onOpenChange={setIsSelfReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              Employee Self Appraisal ({selectedQuarter} {selectedYear})
            </DialogTitle>
            <DialogDescription>
              Submit your self evaluation and highlights for Line Manager review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* KPI Achievement Summary Banner */}
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-700 font-medium">Quarterly KPI Achievement Score</p>
                  <p className="text-2xl font-bold text-teal-900">{selectedAppraisal?.kpiScore}%</p>
                </div>
                <Badge variant="outline" className="bg-white text-teal-800 border-teal-300">
                  {selectedAppraisal?.goalsCount} Goals Completed
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Self Rating (1.0 to 5.0) *</Label>
              <Select 
                value={selfReviewData.rating} 
                onValueChange={(val) => setSelfReviewData({ ...selfReviewData, rating: val })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5.0">5.0 - Exceptional (Far Exceeds Expectations)</SelectItem>
                  <SelectItem value="4.5">4.5 - Outstanding (Consistently Exceeds)</SelectItem>
                  <SelectItem value="4.0">4.0 - Very Good (Meets & Exceeds KPIs)</SelectItem>
                  <SelectItem value="3.5">3.5 - Satisfactory (Meets Job Expectations)</SelectItem>
                  <SelectItem value="3.0">3.0 - Needs Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Self Assessment & Key Highlights *</Label>
              <Textarea
                placeholder="Highlight your key deliverables, major accomplishments, challenges overcome, and contribution to team objectives..."
                value={selfReviewData.comments}
                onChange={(e) => setSelfReviewData({ ...selfReviewData, comments: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSelfReviewOpen(false)}>Cancel</Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 text-white" 
              onClick={handleSubmitSelfReview}
              disabled={saveAppraisalMutation.isPending}
            >
              {saveAppraisalMutation.isPending ? "Submitting..." : "Submit to Line Manager"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MANAGER REVIEW / EVALUATION DIALOG ==================== */}
      <Dialog open={isManagerReviewOpen} onOpenChange={setIsManagerReviewOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Manager Performance Evaluation ({selectedQuarter} {selectedYear})
            </DialogTitle>
            <DialogDescription>
              Evaluating: <strong className="text-slate-800">{selectedAppraisal?.employeeName}</strong> ({selectedAppraisal?.departmentName})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Goal breakdown summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-semibold text-xs text-slate-700 mb-2">Quarterly Goals Breakdown</p>
              <div className="space-y-1.5">
                {selectedAppraisal?.goals.map(g => (
                  <div key={g.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                    <span className="font-medium text-slate-800 truncate mr-2">{g.title}</span>
                    <span className="font-bold text-teal-700 shrink-0">{g.progress}% (wt: {g.weightage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Employee's self evaluation view */}
            {selectedAppraisal?.selfComments && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-900">Employee Self Rating</span>
                  <span className="font-extrabold text-amber-800">{selectedAppraisal.selfRating} / 5.0</span>
                </div>
                <p className="text-amber-800 italic">"{selectedAppraisal.selfComments}"</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Manager Rating (1.0 to 5.0) *</Label>
                <Select 
                  value={managerReviewData.rating} 
                  onValueChange={(val) => setManagerReviewData({ ...managerReviewData, rating: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5.0">5.0 - Exceptional</SelectItem>
                    <SelectItem value="4.7">4.7 - Outstanding</SelectItem>
                    <SelectItem value="4.5">4.5 - Superior</SelectItem>
                    <SelectItem value="4.2">4.2 - Exceeds Expectations</SelectItem>
                    <SelectItem value="4.0">4.0 - Consistently Good</SelectItem>
                    <SelectItem value="3.5">3.5 - Meets Expectations</SelectItem>
                    <SelectItem value="3.0">3.0 - Needs Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>KPI Score Confirmation (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={managerReviewData.overrideKpiScore}
                  onChange={(e) => setManagerReviewData({ ...managerReviewData, overrideKpiScore: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Manager Feedback & Development Plan *</Label>
              <Textarea
                placeholder="Detail the employee's strengths, deliverable quality, core competencies, and areas of growth for next quarter..."
                value={managerReviewData.feedback}
                onChange={(e) => setManagerReviewData({ ...managerReviewData, feedback: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsManagerReviewOpen(false)}>Cancel</Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={handleSubmitManagerReview}
              disabled={saveAppraisalMutation.isPending}
            >
              {saveAppraisalMutation.isPending ? "Finalizing..." : "Complete Appraisal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW APPRAISAL DETAILS DIALOG ==================== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-600" />
              Appraisal Summary — {selectedAppraisal?.employeeName}
            </DialogTitle>
            <DialogDescription>
              {selectedAppraisal?.departmentName} | {selectedQuarter} {selectedYear}
            </DialogDescription>
          </DialogHeader>

          {selectedAppraisal && (
            <div className="space-y-4 py-2 text-sm">
              {/* Score header */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <p className="text-xs text-slate-500 font-medium">KPI Score</p>
                  <p className="text-xl font-bold text-teal-700 mt-1">{selectedAppraisal.kpiScore}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Self Rating</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {selectedAppraisal.selfRating ? `${selectedAppraisal.selfRating.toFixed(1)}/5` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Final Rating</p>
                  <p className="text-xl font-extrabold text-amber-600 mt-1">
                    {selectedAppraisal.overallRating ? `${selectedAppraisal.overallRating.toFixed(1)}/5` : "-"}
                  </p>
                </div>
              </div>

              {/* Goals list */}
              <div>
                <h4 className="font-semibold text-xs text-slate-700 uppercase tracking-wider mb-2">
                  Assigned Goals ({selectedAppraisal.goals.length})
                </h4>
                <div className="space-y-2">
                  {selectedAppraisal.goals.map((g) => (
                    <div key={g.id} className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-slate-900">{g.title}</span>
                        <span className="font-bold text-teal-700">{g.progress}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-1">KPI: {g.kpi}</p>
                      <Progress value={g.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Self Comments */}
              {selectedAppraisal.selfComments && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-600 fill-amber-600" />
                    Self Assessment ({selectedAppraisal.selfRating}/5.0)
                  </p>
                  <p className="text-amber-800">{selectedAppraisal.selfComments}</p>
                </div>
              )}

              {/* Manager Feedback */}
              {selectedAppraisal.managerFeedback && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
                  <p className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    Line Manager Feedback ({selectedAppraisal.managerRating}/5.0) — {selectedAppraisal.managerName}
                  </p>
                  <p className="text-blue-800">{selectedAppraisal.managerFeedback}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== START NEW CYCLE DIALOG ==================== */}
      <Dialog open={isNewCycleOpen} onOpenChange={setIsNewCycleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Launch New Appraisal Cycle
            </DialogTitle>
            <DialogDescription>
              Initiate quarterly review workflow for all departments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="space-y-1.5">
              <Label>Quarter</Label>
              <Select 
                value={newCycle.quarter} 
                onValueChange={(val) => setNewCycle({ ...newCycle, quarter: val, title: `${val} 2026 Performance Appraisal Cycle` })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q2">Q2 (Apr - Jun)</SelectItem>
                  <SelectItem value="Q3">Q3 (Jul - Sep)</SelectItem>
                  <SelectItem value="Q4">Q4 (Oct - Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Cycle Title</Label>
              <Input
                value={newCycle.title}
                onChange={(e) => setNewCycle({ ...newCycle, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Review Submission Deadline</Label>
              <Input
                type="date"
                value={newCycle.deadline}
                onChange={(e) => setNewCycle({ ...newCycle, deadline: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsNewCycleOpen(false)}>Cancel</Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                setSelectedQuarter(newCycle.quarter);
                setIsNewCycleOpen(false);
                toast({ title: "Appraisal Cycle Launched", description: `${newCycle.title} is now active.` });
              }}
            >
              Launch Cycle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
