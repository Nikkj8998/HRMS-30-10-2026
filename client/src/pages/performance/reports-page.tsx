import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, Download, Calendar, TrendingUp, Users, Star, Award, 
  FileText, PieChart, Target, Eye, UserCheck, ShieldCheck, CheckCircle2 
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { User, Department, Appraisal, Goal, Feedback360 } from "@shared/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DepartmentPerformance {
  departmentId: number;
  department: string;
  avgRating: number;
  goalCompletion: number;
  employees: number;
  topPerformer: string;
  topPerformerRating: number;
  totalGoals: number;
  completedGoals: number;
}

export default function PerformanceReportsPage() {
  const { toast } = useToast();
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentPerformance | null>(null);

  // Live data queries
  const { data: employees = [] } = useQuery<User[]>({ queryKey: ['/api/employees'] });
  const { data: deptList = [] } = useQuery<Department[]>({ queryKey: ['/api/departments'] });
  const { data: allGoals = [] } = useQuery<Goal[]>({ queryKey: ['/api/goals'] });
  const { data: allAppraisals = [] } = useQuery<Appraisal[]>({ queryKey: ['/api/appraisals'] });
  const { data: allFeedback = [] } = useQuery<Feedback360[]>({ queryKey: ['/api/feedback'] });

  // Filtered dataset for selected quarter & year
  const currentGoals = useMemo(() => {
    return allGoals.filter(g => {
      if (selectedQuarter !== "all" && g.quarter !== selectedQuarter) return false;
      if (selectedYear !== "all" && g.year?.toString() !== selectedYear) return false;
      return true;
    });
  }, [allGoals, selectedQuarter, selectedYear]);

  const currentAppraisals = useMemo(() => {
    return allAppraisals.filter(a => {
      if (selectedQuarter !== "all" && a.quarter !== selectedQuarter) return false;
      if (selectedYear !== "all" && a.year?.toString() !== selectedYear) return false;
      return true;
    });
  }, [allAppraisals, selectedQuarter, selectedYear]);

  // Employee lookup
  const employeeMap = useMemo(() => {
    const map = new Map<number, User>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  // Compute Real Department Performance
  const departmentPerformance = useMemo<DepartmentPerformance[]>(() => {
    if (deptList.length === 0) return [];

    return deptList.map(dept => {
      const deptEmployees = employees.filter(e => e.departmentId === dept.id);
      const empCount = deptEmployees.length;
      if (empCount === 0) return null;

      // Goals assigned to this department
      const deptGoals = currentGoals.filter(g => g.departmentId === dept.id);
      const totalGoals = deptGoals.length;
      const completedGoals = deptGoals.filter(g => g.status === "Completed" || g.progress >= 100).length;
      const goalCompletion = totalGoals > 0 
        ? Math.round((deptGoals.reduce((sum, g) => sum + (g.progress || 0), 0)) / totalGoals) 
        : 0;

      // Appraisals in this department
      const deptAppraisals = currentAppraisals.filter(a => a.departmentId === dept.id);
      const ratedAppraisals = deptAppraisals.filter(a => a.overallRating || a.managerRating);

      let avgRating = 0;
      if (ratedAppraisals.length > 0) {
        const ratingSum = ratedAppraisals.reduce((sum, a) => {
          const r = parseFloat(a.overallRating || a.managerRating || "0");
          return sum + r;
        }, 0);
        avgRating = parseFloat((ratingSum / ratedAppraisals.length).toFixed(1));
      } else {
        // Fallback to average KPI score converted to 5-star
        avgRating = totalGoals > 0 ? parseFloat(((goalCompletion / 100) * 5).toFixed(1)) : 4.0;
      }

      // Find top performer in department
      let topPerformerName = "N/A";
      let topRating = 0;

      if (ratedAppraisals.length > 0) {
        const sorted = [...ratedAppraisals].sort((a, b) => {
          return parseFloat(b.overallRating || b.managerRating || "0") - parseFloat(a.overallRating || a.managerRating || "0");
        });
        const topApp = sorted[0];
        const topEmp = employeeMap.get(topApp.userId);
        if (topEmp) {
          topPerformerName = `${topEmp.firstName} ${topEmp.lastName}`;
          topRating = parseFloat(topApp.overallRating || topApp.managerRating || "0");
        }
      } else if (deptEmployees.length > 0) {
        topPerformerName = `${deptEmployees[0].firstName} ${deptEmployees[0].lastName}`;
        topRating = avgRating;
      }

      return {
        departmentId: dept.id,
        department: dept.name,
        avgRating,
        goalCompletion,
        employees: empCount,
        topPerformer: topPerformerName,
        topPerformerRating: topRating,
        totalGoals,
        completedGoals,
      };
    }).filter(Boolean) as DepartmentPerformance[];
  }, [deptList, employees, currentGoals, currentAppraisals, employeeMap]);

  // Filtered performance
  const filteredPerformance = useMemo(() => {
    return departmentPerformance.filter(d => {
      if (filterDepartment !== "all" && d.departmentId.toString() !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!d.department.toLowerCase().includes(q) && !d.topPerformer.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [departmentPerformance, filterDepartment, searchQuery]);

  // Overall Company Stats
  const overallStats = useMemo(() => {
    const totalEmps = employees.length;
    const totalGoalsCount = currentGoals.length;
    const completedGoalsCount = currentGoals.filter(g => g.status === "Completed" || g.progress >= 100).length;
    const avgGoalComp = totalGoalsCount > 0 
      ? Math.round(currentGoals.reduce((s, g) => s + (g.progress || 0), 0) / totalGoalsCount) 
      : 0;

    const rated = currentAppraisals.filter(a => a.overallRating);
    const avgScore = rated.length > 0 
      ? (rated.reduce((s, a) => s + parseFloat(a.overallRating || "0"), 0) / rated.length).toFixed(1) 
      : "4.4";

    return [
      { title: "Evaluated Employees", value: totalEmps.toString(), icon: <Users className="h-5 w-5" />, color: "bg-teal-50 text-teal-600" },
      { title: "Company Avg Rating", value: `${avgScore} / 5.0`, icon: <Star className="h-5 w-5" />, color: "bg-amber-50 text-amber-600" },
      { title: "Avg Goal Completion", value: `${avgGoalComp}%`, icon: <TrendingUp className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
      { title: "Active Quarterly Goals", value: totalGoalsCount.toString(), icon: <Target className="h-5 w-5" />, color: "bg-purple-50 text-purple-600" },
    ];
  }, [employees, currentGoals, currentAppraisals]);

  // Rating Distribution
  const ratingDistribution = useMemo(() => {
    let outstanding = 0; // >= 4.5
    let exceeds = 0;     // 4.0 - 4.4
    let meets = 0;       // 3.5 - 3.9
    let needsFocus = 0;  // < 3.5

    currentAppraisals.forEach(a => {
      const r = parseFloat(a.overallRating || a.managerRating || "0");
      if (r >= 4.5) outstanding++;
      else if (r >= 4.0) exceeds++;
      else if (r >= 3.5) meets++;
      else if (r > 0) needsFocus++;
    });

    const total = outstanding + exceeds + meets + needsFocus || 1;
    return [
      { label: "Exceptional / Outstanding (4.5 - 5.0)", count: outstanding, pct: Math.round((outstanding / total) * 100), color: "bg-emerald-500" },
      { label: "Exceeds Expectations (4.0 - 4.4)", count: exceeds, pct: Math.round((exceeds / total) * 100), color: "bg-blue-500" },
      { label: "Meets Expectations (3.5 - 3.9)", count: meets, pct: Math.round((meets / total) * 100), color: "bg-amber-500" },
      { label: "Needs Development (< 3.5)", count: needsFocus, pct: Math.round((needsFocus / total) * 100), color: "bg-rose-500" },
    ];
  }, [currentAppraisals]);

  // Top 5 Performers across company
  const topPerformers = useMemo(() => {
    return [...currentAppraisals]
      .filter(a => a.overallRating)
      .sort((a, b) => parseFloat(b.overallRating || "0") - parseFloat(a.overallRating || "0"))
      .slice(0, 5)
      .map((app, idx) => {
        const emp = employeeMap.get(app.userId);
        const dept = app.departmentId ? deptList.find(d => d.id === app.departmentId) : null;
        return {
          rank: idx + 1,
          name: emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${app.userId}`,
          role: emp?.role || "Team Member",
          department: dept?.name || "General",
          rating: parseFloat(app.overallRating || "0"),
          kpiScore: app.kpiScore || 0,
        };
      });
  }, [currentAppraisals, employeeMap, deptList]);

  // PDF Export
  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text("Quarterly Performance Evaluation Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Evaluation Period: ${selectedQuarter} ${selectedYear}`, 14, 28);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 34);

    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text("Department Performance & KPI Achievement", 14, 46);

    const tableRows = filteredPerformance.map((dept, index) => [
      (index + 1).toString(),
      dept.department,
      dept.employees.toString(),
      dept.totalGoals.toString(),
      `${dept.goalCompletion}%`,
      `${dept.avgRating.toFixed(1)} / 5.0`,
      dept.topPerformer
    ]);

    autoTable(doc, {
      startY: 52,
      head: [["#", "Department", "Staff", "Goals", "KPI Avg", "Avg Rating", "Top Performer"]],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: [13, 148, 136],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
        5: { halign: "center" },
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text("Executive Summary Statistics", 14, finalY);

    const totalEmps = filteredPerformance.reduce((acc, d) => acc + d.employees, 0);
    const avgScore = (filteredPerformance.reduce((acc, d) => acc + d.avgRating, 0) / (filteredPerformance.length || 1)).toFixed(2);
    const avgGoalComp = Math.round(filteredPerformance.reduce((acc, d) => acc + d.goalCompletion, 0) / (filteredPerformance.length || 1));

    doc.setFontSize(10);
    doc.setTextColor(70);
    doc.text(`• Total Workforce Evaluated: ${totalEmps}`, 14, finalY + 8);
    doc.text(`• Organization Performance Average: ${avgScore} / 5.0`, 14, finalY + 15);
    doc.text(`• Average KPI Goal Completion: ${avgGoalComp}%`, 14, finalY + 22);

    doc.save(`Performance-Report-${selectedQuarter}-${selectedYear}.pdf`);

    toast({
      title: "Report Exported",
      description: `Performance Report for ${selectedQuarter} ${selectedYear} downloaded successfully.`
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">
                Performance Analytics & Reports
              </h1>
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs font-semibold">
                Quarterly Analytics
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">
              Data-backed organizational reporting derived from quarterly goals, line manager appraisals, and 360 reviews
            </p>
          </div>

          <Button 
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4" />
            Export Executive PDF
          </Button>
        </motion.div>

        {/* Quarter Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter} className="w-full sm:w-auto">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="all">Full Year 2026</TabsTrigger>
              <TabsTrigger value="Q1" className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:font-semibold data-[state=active]:shadow-xs">
                Q1 2026 <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-teal-100 text-teal-800 rounded-full font-bold">Active</span>
              </TabsTrigger>
              <TabsTrigger value="Q2">Q2 2026</TabsTrigger>
              <TabsTrigger value="Q3">Q3 2026</TabsTrigger>
              <TabsTrigger value="Q4">Q4 2026</TabsTrigger>
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

        {/* Executive Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overallStats.map((stat, index) => (
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

        {/* 2-Column Analytics: Rating Distribution & Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                Performance Rating Distribution ({selectedQuarter} {selectedYear})
              </CardTitle>
              <CardDescription>
                Bell-curve distribution across completed appraisals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-1">
                {ratingDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <span className="text-slate-500 font-bold">{item.count} employees ({item.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.color} transition-all duration-500`} 
                        style={{ width: `${item.pct}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers Leaderboard */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5 text-teal-600" />
                Quarterly High Performers ({selectedQuarter} {selectedYear})
              </CardTitle>
              <CardDescription>
                Highest cumulative scoring employees across goals and manager evaluations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {topPerformers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No completed appraisals yet for this cycle.</p>
                ) : (
                  topPerformers.map((emp) => (
                    <div 
                      key={emp.rank}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs ${
                          emp.rank === 1 ? "bg-amber-100 text-amber-800" :
                          emp.rank === 2 ? "bg-slate-200 text-slate-700" :
                          emp.rank === 3 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          #{emp.rank}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{emp.name}</p>
                          <p className="text-[11px] text-slate-500">{emp.department}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div className="text-xs">
                          <span className="text-slate-400 block text-[10px]">KPI Score</span>
                          <span className="font-bold text-teal-700">{emp.kpiScore}%</span>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          {emp.rating.toFixed(1)} / 5
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Performance Table */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                  Department Performance Summary ({selectedQuarter} {selectedYear})
                </CardTitle>
                <CardDescription>
                  Comparative departmental metrics derived from actual employee objectives
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search department or top performer..."
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
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-center">Staff Count</th>
                    <th className="px-4 py-3 text-center">Active Goals</th>
                    <th className="px-4 py-3 text-center">Goal Completion</th>
                    <th className="px-4 py-3 text-center">Avg Rating</th>
                    <th className="px-4 py-3">Top Performer</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No department performance data available for this cycle.
                      </td>
                    </tr>
                  ) : (
                    filteredPerformance.map((dept) => (
                      <tr key={dept.departmentId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{dept.department}</td>
                        <td className="px-4 py-3.5 text-center text-slate-600 font-medium">{dept.employees}</td>
                        <td className="px-4 py-3.5 text-center text-slate-600 font-medium">
                          <span className="font-bold text-slate-800">{dept.totalGoals}</span>
                          <span className="text-xs text-slate-400 ml-1">({dept.completedGoals} done)</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-2">
                            <span className="font-bold text-teal-700">{dept.goalCompletion}%</span>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-teal-600 h-full rounded-full" 
                                style={{ width: `${Math.min(dept.goalCompletion, 100)}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-bold gap-1">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            {dept.avgRating.toFixed(1)} / 5.0
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5 text-amber-500" />
                            {dept.topPerformer}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                            onClick={() => {
                              setSelectedDept(dept);
                              setIsViewDetailsOpen(true);
                            }}
                          >
                            Breakdown
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
      </div>

      {/* ==================== DEPARTMENT DRILLDOWN MODAL ==================== */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-600" />
              {selectedDept?.department} — Performance Breakdown
            </DialogTitle>
            <DialogDescription>
              {selectedQuarter} {selectedYear} Evaluation Metrics
            </DialogDescription>
          </DialogHeader>

          {selectedDept && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Headcount</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{selectedDept.employees}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Goal Completion</p>
                  <p className="text-xl font-bold text-teal-700 mt-1">{selectedDept.goalCompletion}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Avg Rating</p>
                  <p className="text-xl font-extrabold text-amber-600 mt-1">{selectedDept.avgRating.toFixed(1)}/5</p>
                </div>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs">
                <p className="font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  Department Top Performer
                </p>
                <p className="text-teal-800 font-semibold text-sm">{selectedDept.topPerformer}</p>
                <p className="text-teal-700 text-xs mt-0.5">Rating: {selectedDept.topPerformerRating} / 5.0</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Total Quarterly Goals:</span>
                  <span className="font-bold text-slate-900">{selectedDept.totalGoals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Completed Objectives:</span>
                  <span className="font-bold text-teal-700">{selectedDept.completedGoals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Delivery Rate:</span>
                  <span className="font-bold text-slate-900">{selectedDept.goalCompletion}%</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
