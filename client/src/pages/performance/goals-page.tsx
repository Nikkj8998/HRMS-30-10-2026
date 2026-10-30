import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, Plus, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, 
  Users, Edit2, Trash2, Award, UserCheck, ShieldCheck, MessageSquare, ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Department } from "@shared/schema";

interface Goal {
  id: number;
  title: string;
  kpi: string;
  owner: string;
  userId?: number;
  departmentId?: number | null;
  quarter: string;
  year: number;
  targetValue?: string | null;
  currentValue?: string | null;
  weightage?: number | null;
  progress: number;
  dueDate: string;
  status: string;
  description?: string;
  priority?: string;
  createdById?: number | null;
  createdByRole?: string | null;
  employeeNotes?: string | null;
  managerFeedback?: string | null;
  createdAt?: string;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isHR = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'developer';
  const isManager = user?.role === 'manager';
  const canCreateGoal = isHR || isManager;

  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Form state for creating a goal
  const [newGoal, setNewGoal] = useState({
    title: "",
    kpi: "",
    departmentId: "",
    userId: "",
    quarter: "Q1",
    year: "2026",
    targetValue: "100%",
    currentValue: "0%",
    weightage: "25",
    priority: "high",
    dueDate: "2026-03-31",
    description: "",
  });

  // State for updating progress
  const [progressUpdate, setProgressUpdate] = useState({
    progress: 0,
    currentValue: "",
    status: "On Track",
    employeeNotes: "",
    managerFeedback: ""
  });

  // Data fetching
  const { data: apiGoals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Helper map for department name lookup
  const deptMap = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach(d => map.set(d.id, d.name));
    return map;
  }, [departments]);

  // Filtered employees for the Add Goal modal based on selected department
  const assignableEmployees = useMemo(() => {
    if (!newGoal.departmentId || newGoal.departmentId === "all") return employees;
    return employees.filter(e => e.departmentId === parseInt(newGoal.departmentId));
  }, [employees, newGoal.departmentId]);

  // Filtered goals according to Quarter, Dept, Status, and Search
  const filteredGoals = useMemo(() => {
    return apiGoals.filter(goal => {
      // Quarter filter
      if (selectedQuarter !== "all" && goal.quarter !== selectedQuarter) return false;
      // Year filter
      if (selectedYear !== "all" && goal.year.toString() !== selectedYear) return false;
      // Department filter
      if (filterDepartment !== "all" && goal.departmentId?.toString() !== filterDepartment) return false;
      // Status filter
      if (filterStatus !== "all" && goal.status !== filterStatus) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = goal.title.toLowerCase().includes(q);
        const ownerMatch = (goal.owner || "").toLowerCase().includes(q);
        const kpiMatch = (goal.kpi || "").toLowerCase().includes(q);
        const deptMatch = goal.departmentId ? (deptMap.get(goal.departmentId) || "").toLowerCase().includes(q) : false;
        if (!titleMatch && !ownerMatch && !kpiMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [apiGoals, selectedQuarter, selectedYear, filterDepartment, filterStatus, searchQuery, deptMap]);

  // Statistics
  const goalStats = useMemo(() => {
    const total = filteredGoals.length;
    const completed = filteredGoals.filter(g => g.status === "Completed" || g.progress === 100).length;
    const onTrack = filteredGoals.filter(g => g.status === "On Track" || (g.progress > 0 && g.progress < 100 && g.status !== "Behind" && g.status !== "At Risk")).length;
    const behindOrRisk = filteredGoals.filter(g => g.status === "Behind" || g.status === "At Risk").length;
    const avgProgress = total > 0 ? Math.round(filteredGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / total) : 0;

    return [
      { title: `Total Goals (${selectedQuarter} ${selectedYear})`, value: total.toString(), icon: <Target className="h-5 w-5" />, color: "bg-teal-50 text-teal-600" },
      { title: "Completed", value: completed.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
      { title: "On Track", value: onTrack.toString(), icon: <TrendingUp className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
      { title: "At Risk / Behind", value: behindOrRisk.toString(), icon: <AlertCircle className="h-5 w-5" />, color: "bg-amber-50 text-amber-600" },
    ];
  }, [filteredGoals, selectedQuarter, selectedYear]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const res = await apiRequest("POST", "/api/goals", goalData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appraisals"] });
      toast({ title: "Goal Created", description: `Quarterly KPI successfully assigned.` });
      setIsAddDialogOpen(false);
      setNewGoal({
        title: "",
        kpi: "",
        departmentId: "",
        userId: "",
        quarter: selectedQuarter === "all" ? "Q1" : selectedQuarter,
        year: selectedYear === "all" ? "2026" : selectedYear,
        targetValue: "100%",
        currentValue: "0%",
        weightage: "25",
        priority: "high",
        dueDate: "2026-03-31",
        description: "",
      });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create goal", description: err.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (goal: Partial<Goal> & { id: number }) => {
      const res = await apiRequest("PUT", `/api/goals/${goal.id}`, goal);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appraisals"] });
      toast({ title: "Goal Updated", description: "Changes saved successfully." });
      setIsEditMode(false);
      setIsViewDialogOpen(false);
      setIsProgressDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal Deleted", description: "Goal has been removed." });
      setIsViewDialogOpen(false);
    }
  });

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.kpi || !newGoal.dueDate) {
      toast({ title: "Missing Information", description: "Please enter goal title, metric and due date.", variant: "destructive" });
      return;
    }

    const assignedUser = employees.find(e => e.id.toString() === newGoal.userId);
    const ownerName = assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : (user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username || "Employee");
    const deptId = newGoal.departmentId ? parseInt(newGoal.departmentId) : (assignedUser?.departmentId || null);

    createMutation.mutate({
      title: newGoal.title,
      kpi: newGoal.kpi,
      owner: ownerName,
      userId: assignedUser ? assignedUser.id : user?.id,
      departmentId: deptId,
      quarter: newGoal.quarter,
      year: parseInt(newGoal.year),
      targetValue: newGoal.targetValue,
      currentValue: newGoal.currentValue,
      weightage: parseInt(newGoal.weightage) || 20,
      priority: newGoal.priority,
      dueDate: newGoal.dueDate,
      description: newGoal.description,
      progress: 0,
      status: "On Track"
    });
  };

  const handleOpenProgressModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setProgressUpdate({
      progress: goal.progress,
      currentValue: goal.currentValue || "",
      status: goal.status,
      employeeNotes: goal.employeeNotes || "",
      managerFeedback: goal.managerFeedback || ""
    });
    setIsProgressDialogOpen(true);
  };

  const handleSaveProgress = () => {
    if (!selectedGoal) return;
    const newProgress = Number(progressUpdate.progress);
    const autoStatus = newProgress >= 100 ? "Completed" : progressUpdate.status;

    updateMutation.mutate({
      id: selectedGoal.id,
      progress: newProgress,
      currentValue: progressUpdate.currentValue,
      status: autoStatus,
      employeeNotes: progressUpdate.employeeNotes,
      managerFeedback: progressUpdate.managerFeedback
    });
  };

  const handleViewGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsEditMode(false);
    setIsViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "On Track": return "bg-blue-100 text-blue-800 border-blue-200";
      case "At Risk": return "bg-amber-100 text-amber-800 border-amber-200";
      case "Behind": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "bg-red-50 text-red-700 border-red-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Title and Create Goal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Goals & KPIs</h1>
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs font-semibold">
                Quarterly Cycle
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">
              Set, monitor, and evaluate quarterly organizational objectives and Key Performance Indicators (Set by HR & Managers)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canCreateGoal && (
              <Button 
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm" 
                data-testid="button-add-goal" 
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Quarterly Goal
              </Button>
            )}
          </div>
        </motion.div>

        {/* Quarter Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter} className="w-full sm:w-auto">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-xs">
                All Quarters
              </TabsTrigger>
              <TabsTrigger value="Q1" className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:font-semibold data-[state=active]:shadow-xs">
                Q1 (Jan - Mar) <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-teal-100 text-teal-800 rounded-full font-bold">Active</span>
              </TabsTrigger>
              <TabsTrigger value="Q2" className="data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Q2 (Apr - Jun)
              </TabsTrigger>
              <TabsTrigger value="Q3" className="data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Q3 (Jul - Sep)
              </TabsTrigger>
              <TabsTrigger value="Q4" className="data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Q4 (Oct - Dec)
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
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {goalStats.map((stat, index) => (
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

        {/* Goal Search & Filter Bar */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal-600" />
                  Quarterly Goals & KPI Matrix
                </CardTitle>
                <CardDescription>
                  Tracking individual and department objectives with assigned KPI weightages
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search goal, KPI, employee..."
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
                    {departments.map(d => (
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
                    <SelectItem value="On Track">On Track</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                    <SelectItem value="Behind">Behind</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {filteredGoals.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Target className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-base font-semibold text-slate-700">No goals found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    No active goals found for {selectedQuarter} {selectedYear} matching your filters.
                  </p>
                  {canCreateGoal && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 gap-1.5"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" /> Add Goal for {selectedQuarter}
                    </Button>
                  )}
                </div>
              ) : (
                filteredGoals.map((goal, index) => {
                  const deptName = goal.departmentId ? deptMap.get(goal.departmentId) : "General";
                  const isAssignedToCurrentUser = user?.id === goal.userId;
                  const canUpdateThisGoal = isAssignedToCurrentUser || isHR || isManager;

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-base">{goal.title}</span>
                            <Badge className={`${getStatusColor(goal.status)} border text-xs`}>
                              {goal.status}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs font-semibold">
                              {goal.quarter} {goal.year}
                            </Badge>
                            {goal.weightage && (
                              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
                                Weight: {goal.weightage}%
                              </Badge>
                            )}
                            {goal.priority && (
                              <Badge className={`${getPriorityColor(goal.priority)} border text-xs`}>
                                {goal.priority.toUpperCase()}
                              </Badge>
                            )}
                            {goal.createdByRole && (
                              <Badge variant="secondary" className="text-[11px] bg-slate-100 text-slate-600 flex items-center gap-1">
                                {goal.createdByRole === 'hr' ? <ShieldCheck className="h-3 w-3 text-teal-600" /> : <UserCheck className="h-3 w-3 text-blue-600" />}
                                Set by {goal.createdByRole.toUpperCase()}
                              </Badge>
                            )}
                          </div>

                          {/* Key details row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 mb-3 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-slate-400 block font-medium">KPI Metric:</span>
                              <span className="font-semibold text-slate-800">{goal.kpi}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Assignee & Dept:</span>
                              <span className="font-semibold text-slate-800">{goal.owner}</span>
                              <span className="text-slate-400 ml-1">({deptName})</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Target vs Current:</span>
                              <span className="font-semibold text-teal-700">
                                {goal.currentValue || `${goal.progress}%`}
                              </span>
                              <span className="text-slate-400"> / {goal.targetValue || "100%"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Due Date:</span>
                              <span className="font-semibold text-slate-800 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">Quarterly Achievement</span>
                              <span className="font-bold text-slate-900">{goal.progress}%</span>
                            </div>
                            <Progress value={goal.progress} className="h-2" />
                          </div>

                          {/* Employee note preview if present */}
                          {goal.employeeNotes && (
                            <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5 italic">
                              <MessageSquare className="h-3 w-3 text-teal-600 shrink-0" />
                              <span className="font-medium text-slate-700">Latest Note:</span> "{goal.employeeNotes}"
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex lg:flex-col items-center gap-2 shrink-0 pt-2 lg:pt-0">
                          {canUpdateThisGoal && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs shadow-xs"
                              onClick={() => handleOpenProgressModal(goal)}
                            >
                              <TrendingUp className="h-3.5 w-3.5" />
                              Update Progress
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs gap-1.5"
                            onClick={() => handleViewGoal(goal)}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            Details & Feedback
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== ADD NEW QUARTERLY GOAL DIALOG ==================== */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Target className="h-5 w-5 text-teal-600" />
              Add Quarterly Goal / KPI
            </DialogTitle>
            <DialogDescription>
              Assign a structured measurable objective for {selectedQuarter} {selectedYear} ({isHR ? "HR Assigned" : "Manager Assigned"}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Quarter and Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quarter *</Label>
                <Select 
                  value={newGoal.quarter} 
                  onValueChange={(val) => setNewGoal({ ...newGoal, quarter: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1 (Jan - Mar)</SelectItem>
                    <SelectItem value="Q2">Q2 (Apr - Jun)</SelectItem>
                    <SelectItem value="Q3">Q3 (Jul - Sep)</SelectItem>
                    <SelectItem value="Q4">Q4 (Oct - Dec)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Year *</Label>
                <Select 
                  value={newGoal.year} 
                  onValueChange={(val) => setNewGoal({ ...newGoal, year: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Department and Assignee */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select 
                  value={newGoal.departmentId} 
                  onValueChange={(val) => setNewGoal({ ...newGoal, departmentId: val, userId: "" })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Assignee / Owner *</Label>
                <Select 
                  value={newGoal.userId} 
                  onValueChange={(val) => setNewGoal({ ...newGoal, userId: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>
                    {assignableEmployees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.firstName} {emp.lastName} ({emp.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Goal Title *</Label>
              <Input
                placeholder="e.g. Implement Microservices Architecture or Complete Compliance Audit"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              />
            </div>

            {/* KPI Metric */}
            <div className="space-y-1.5">
              <Label>KPI / Success Metric *</Label>
              <Input
                placeholder="e.g. 100% on-time deployment with zero critical bugs"
                value={newGoal.kpi}
                onChange={(e) => setNewGoal({ ...newGoal, kpi: e.target.value })}
              />
            </div>

            {/* Target Value & Weightage */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Target Value</Label>
                <Input
                  placeholder="e.g. 100% or 50 PRs"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Weightage (%)</Label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  placeholder="25"
                  value={newGoal.weightage}
                  onChange={(e) => setNewGoal({ ...newGoal, weightage: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select 
                  value={newGoal.priority} 
                  onValueChange={(val) => setNewGoal({ ...newGoal, priority: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label>Target Due Date *</Label>
              <Input
                type="date"
                value={newGoal.dueDate}
                onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description / Expectations</Label>
              <Textarea
                placeholder="Detail expectations, milestones, and success criteria for this quarterly goal..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 text-white" 
              onClick={handleCreateGoal}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Assigning..." : "Assign Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== UPDATE PROGRESS MODAL ==================== */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              Update Goal Progress
            </DialogTitle>
            <DialogDescription>
              {selectedGoal?.title} ({selectedGoal?.quarter} {selectedGoal?.year})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label>Completion Percentage</Label>
                <span className="font-bold text-teal-700 text-base">{progressUpdate.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressUpdate.progress}
                onChange={(e) => setProgressUpdate({ ...progressUpdate, progress: parseInt(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Current Value</Label>
                <Input
                  placeholder="e.g. 95% or 45/50"
                  value={progressUpdate.currentValue}
                  onChange={(e) => setProgressUpdate({ ...progressUpdate, currentValue: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select 
                  value={progressUpdate.status} 
                  onValueChange={(val) => setProgressUpdate({ ...progressUpdate, status: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On Track">On Track</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                    <SelectItem value="Behind">Behind</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Employee Self Progress Notes</Label>
              <Textarea
                placeholder="What deliverables were achieved towards this goal? Any blockers or dependencies?"
                value={progressUpdate.employeeNotes}
                onChange={(e) => setProgressUpdate({ ...progressUpdate, employeeNotes: e.target.value })}
                rows={3}
              />
            </div>

            {(isHR || isManager) && (
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <Label className="text-slate-800 font-semibold">Manager Review / Guidance</Label>
                <Textarea
                  placeholder="Add guidance or feedback for this goal..."
                  value={progressUpdate.managerFeedback}
                  onChange={(e) => setProgressUpdate({ ...progressUpdate, managerFeedback: e.target.value })}
                  rows={2}
                  className="bg-white"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)}>Cancel</Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 text-white" 
              onClick={handleSaveProgress}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW / EDIT GOAL DETAILS DIALOG ==================== */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              {isEditMode ? "Edit Goal" : "Goal Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedGoal && (
            <div className="space-y-4 py-2 text-sm">
              {isEditMode ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Goal Title</Label>
                    <Input
                      value={selectedGoal.title}
                      onChange={(e) => setSelectedGoal({ ...selectedGoal, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>KPI / Metric</Label>
                    <Input
                      value={selectedGoal.kpi}
                      onChange={(e) => setSelectedGoal({ ...selectedGoal, kpi: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Owner</Label>
                      <Input
                        value={selectedGoal.owner}
                        onChange={(e) => setSelectedGoal({ ...selectedGoal, owner: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Weightage (%)</Label>
                      <Input
                        type="number"
                        value={selectedGoal.weightage || 20}
                        onChange={(e) => setSelectedGoal({ ...selectedGoal, weightage: parseInt(e.target.value) || 20 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select 
                        value={selectedGoal.status} 
                        onValueChange={(val) => setSelectedGoal({ ...selectedGoal, status: val })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="On Track">On Track</SelectItem>
                          <SelectItem value="At Risk">At Risk</SelectItem>
                          <SelectItem value="Behind">Behind</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Priority</Label>
                      <Select 
                        value={selectedGoal.priority || "high"} 
                        onValueChange={(val) => setSelectedGoal({ ...selectedGoal, priority: val })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Manager Feedback</Label>
                    <Textarea
                      placeholder="Feedback from line manager..."
                      value={selectedGoal.managerFeedback || ""}
                      onChange={(e) => setSelectedGoal({ ...selectedGoal, managerFeedback: e.target.value })}
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(selectedGoal.status)}>{selectedGoal.status}</Badge>
                    <Badge variant="outline">{selectedGoal.quarter} {selectedGoal.year}</Badge>
                    {selectedGoal.weightage && (
                      <Badge variant="outline" className="bg-teal-50 text-teal-700">
                        Weight: {selectedGoal.weightage}%
                      </Badge>
                    )}
                    {selectedGoal.priority && (
                      <Badge className={getPriorityColor(selectedGoal.priority)} variant="outline">
                        {selectedGoal.priority.toUpperCase()} PRIORITY
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedGoal.title}</h3>
                    {selectedGoal.description && (
                      <p className="text-slate-600 mt-1">{selectedGoal.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">KPI Metric</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedGoal.kpi}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Owner</p>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedGoal.owner}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Target vs Current</p>
                      <p className="font-semibold text-teal-700 mt-0.5">
                        {selectedGoal.currentValue || `${selectedGoal.progress}%`} / {selectedGoal.targetValue || "100%"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Target Due Date</p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedGoal.dueDate ? new Date(selectedGoal.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Overall Progress</span>
                      <span className="font-bold text-slate-900">{selectedGoal.progress}%</span>
                    </div>
                    <Progress value={selectedGoal.progress} className="h-2.5" />
                  </div>

                  {selectedGoal.employeeNotes && (
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs">
                      <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                        Employee Notes
                      </p>
                      <p className="text-blue-800 mt-1">{selectedGoal.employeeNotes}</p>
                    </div>
                  )}

                  {selectedGoal.managerFeedback && (
                    <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-100 text-xs">
                      <p className="font-semibold text-teal-900 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                        Manager Feedback
                      </p>
                      <p className="text-teal-800 mt-1">{selectedGoal.managerFeedback}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                <Button 
                  className="bg-teal-600 hover:bg-teal-700 text-white" 
                  onClick={() => selectedGoal && updateMutation.mutate(selectedGoal)}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                {canCreateGoal && selectedGoal && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteGoal(selectedGoal.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                )}
                {canCreateGoal && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
                <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );

  function handleDeleteGoal(id: number) {
    if (confirm("Are you sure you want to delete this goal?")) {
      deleteMutation.mutate(id);
    }
  }
}
