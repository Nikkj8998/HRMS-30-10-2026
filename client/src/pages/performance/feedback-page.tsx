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
  Award, Plus, Users, MessageSquare, Star, CheckCircle, Clock, Send, 
  Eye, UserCheck, ShieldCheck, ThumbsUp, Sparkles, Filter 
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, Department, Feedback360 } from "@shared/schema";

export default function FeedbackPage() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const isHR = authUser?.role === 'admin' || authUser?.role === 'hr' || authUser?.role === 'developer';
  const isManager = authUser?.role === 'manager';

  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isSubmitFeedbackOpen, setIsSubmitFeedbackOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback360 | null>(null);

  // Form state for giving 360 Feedback
  const [newFeedback, setNewFeedback] = useState({
    employeeId: "",
    reviewerRole: "Peer",
    quarter: "Q1",
    year: "2026",
    technicalRating: "5",
    deliveryRating: "4",
    teamworkRating: "5",
    communicationRating: "4",
    strengths: "",
    improvements: "",
  });

  // Data queries
  const { data: dbFeedbacks = [] } = useQuery<Feedback360[]>({
    queryKey: ['/api/feedback'],
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ['/api/employees'],
  });

  const { data: deptList = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Helper maps
  const employeeMap = useMemo(() => {
    const map = new Map<number, User>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  const deptMap = useMemo(() => {
    const map = new Map<number, Department>();
    deptList.forEach(d => map.set(d.id, d));
    return map;
  }, [deptList]);

  // Filter feedback items
  const filteredFeedbacks = useMemo(() => {
    return dbFeedbacks.filter(f => {
      if (selectedQuarter !== "all" && f.quarter !== selectedQuarter) return false;
      if (selectedYear !== "all" && f.year?.toString() !== selectedYear) return false;
      if (filterRole !== "all" && f.reviewerRole !== filterRole) return false;

      const emp = employeeMap.get(f.employeeId);
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : "";
      const revName = f.reviewerName || "";

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!empName.toLowerCase().includes(q) && !revName.toLowerCase().includes(q)) return false;
      }

      // If regular employee, show feedback where they are the employee or the reviewer
      if (!isHR && !isManager) {
        return f.employeeId === authUser?.id || f.reviewerId === authUser?.id;
      }

      return true;
    });
  }, [dbFeedbacks, selectedQuarter, selectedYear, filterRole, searchQuery, employeeMap, isHR, isManager, authUser]);

  // Stats
  const stats = useMemo(() => {
    const total = filteredFeedbacks.length;
    const ratings = filteredFeedbacks.map(f => parseFloat(f.overallRating || "0")).filter(r => r > 0);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "-";
    const peerReviews = filteredFeedbacks.filter(f => f.reviewerRole === "Peer").length;
    const managerReviews = filteredFeedbacks.filter(f => f.reviewerRole === "Manager").length;

    return [
      { title: `360 Reviews (${selectedQuarter} ${selectedYear})`, value: total.toString(), icon: <MessageSquare className="h-5 w-5" />, color: "bg-teal-50 text-teal-600" },
      { title: "Average Rating", value: avgRating, icon: <Star className="h-5 w-5" />, color: "bg-amber-50 text-amber-600" },
      { title: "Peer Reviews", value: peerReviews.toString(), icon: <Users className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
      { title: "Manager Evaluations", value: managerReviews.toString(), icon: <ShieldCheck className="h-5 w-5" />, color: "bg-purple-50 text-purple-600" },
    ];
  }, [filteredFeedbacks, selectedQuarter, selectedYear]);

  // Mutation
  const createFeedbackMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/feedback", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      toast({ title: "Feedback Submitted", description: "360° feedback has been successfully recorded." });
      setIsSubmitFeedbackOpen(false);
      setNewFeedback({
        employeeId: "",
        reviewerRole: "Peer",
        quarter: selectedQuarter === "all" ? "Q1" : selectedQuarter,
        year: selectedYear === "all" ? "2026" : selectedYear,
        technicalRating: "5",
        deliveryRating: "4",
        teamworkRating: "5",
        communicationRating: "4",
        strengths: "",
        improvements: "",
      });
    },
    onError: (err: any) => {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    }
  });

  const handleSubmitFeedback = () => {
    if (!newFeedback.employeeId) {
      toast({ title: "Missing Information", description: "Please select an employee to review.", variant: "destructive" });
      return;
    }

    const t = parseInt(newFeedback.technicalRating);
    const d = parseInt(newFeedback.deliveryRating);
    const w = parseInt(newFeedback.teamworkRating);
    const c = parseInt(newFeedback.communicationRating);
    const overall = ((t + d + w + c) / 4).toFixed(1);

    const reviewerName = authUser?.firstName ? `${authUser.firstName} ${authUser.lastName}` : (authUser?.username || "Reviewer");

    createFeedbackMutation.mutate({
      employeeId: parseInt(newFeedback.employeeId),
      reviewerId: authUser?.id,
      reviewerName,
      reviewerRole: newFeedback.reviewerRole,
      quarter: newFeedback.quarter,
      year: parseInt(newFeedback.year),
      technicalRating: t,
      deliveryRating: d,
      teamworkRating: w,
      communicationRating: c,
      overallRating: overall,
      strengths: newFeedback.strengths,
      improvements: newFeedback.improvements,
      status: "Completed",
      submittedAt: new Date().toISOString()
    });
  };

  const getRoleBadgeColor = (role?: string | null) => {
    switch (role) {
      case "Manager": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Peer": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Direct Report": return "bg-emerald-100 text-emerald-800 border-emerald-200";
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
                360° Feedback
              </h1>
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs font-semibold">
                Quarterly Competencies
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">
              Multi-source competency evaluations across Technical, Delivery, Teamwork, and Leadership dimensions
            </p>
          </div>

          <Button 
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            onClick={() => setIsSubmitFeedbackOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Give 360 Feedback
          </Button>
        </motion.div>

        {/* Quarter Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter} className="w-full sm:w-auto">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="all">All Quarters</TabsTrigger>
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
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
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

        {/* Reviews List */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Quarterly 360° Review Submissions ({selectedQuarter} {selectedYear})
                </CardTitle>
                <CardDescription>
                  Multi-perspective feedback submitted by Managers, Peers, and Cross-functional colleagues
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search employee or reviewer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-56 h-9 text-xs"
                />

                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                    <SelectValue placeholder="Reviewer Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Peer">Peer</SelectItem>
                    <SelectItem value="Direct Report">Direct Report</SelectItem>
                    <SelectItem value="Cross-functional">Cross-functional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedbacks.length === 0 ? (
                <div className="col-span-2 text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-base font-semibold text-slate-700">No 360 feedback records found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Be the first to submit a 360 review for {selectedQuarter} {selectedYear}.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 gap-1.5"
                    onClick={() => setIsSubmitFeedbackOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Give Feedback
                  </Button>
                </div>
              ) : (
                filteredFeedbacks.map((fb, idx) => {
                  const emp = employeeMap.get(fb.employeeId);
                  const dept = emp?.departmentId ? deptMap.get(emp.departmentId) : null;
                  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${fb.employeeId}`;

                  return (
                    <motion.div
                      key={fb.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs transition-all space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{empName}</h4>
                          <p className="text-xs text-slate-500">{dept?.name || "General Department"}</p>
                        </div>
                        <Badge className={`${getRoleBadgeColor(fb.reviewerRole)} border text-[11px] font-semibold`}>
                          {fb.reviewerRole} Review
                        </Badge>
                      </div>

                      {/* Reviewer & Rating banner */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                          <span>Reviewed by: <strong className="text-slate-900">{fb.reviewerName || "Peer Reviewer"}</strong></span>
                        </div>
                        <div className="flex items-center gap-1 font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          {fb.overallRating || "4.5"} / 5.0
                        </div>
                      </div>

                      {/* 4 Core Competencies grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Technical:</span>
                            <span className="font-semibold text-slate-900">{fb.technicalRating || 4}/5</span>
                          </div>
                          <Progress value={((fb.technicalRating || 4) / 5) * 100} className="h-1.5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Delivery:</span>
                            <span className="font-semibold text-slate-900">{fb.deliveryRating || 4}/5</span>
                          </div>
                          <Progress value={((fb.deliveryRating || 4) / 5) * 100} className="h-1.5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Teamwork:</span>
                            <span className="font-semibold text-slate-900">{fb.teamworkRating || 4}/5</span>
                          </div>
                          <Progress value={((fb.teamworkRating || 4) / 5) * 100} className="h-1.5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Communication:</span>
                            <span className="font-semibold text-slate-900">{fb.communicationRating || 4}/5</span>
                          </div>
                          <Progress value={((fb.communicationRating || 4) / 5) * 100} className="h-1.5" />
                        </div>
                      </div>

                      {/* Strengths snippet */}
                      {fb.strengths && (
                        <div className="text-xs bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                          <span className="font-semibold text-teal-900 flex items-center gap-1 mb-0.5">
                            <ThumbsUp className="h-3 w-3 text-teal-700" /> Core Strengths:
                          </span>
                          <p className="text-teal-800 line-clamp-2">{fb.strengths}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-1 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 gap-1"
                          onClick={() => {
                            setSelectedFeedback(fb);
                            setIsViewDetailsOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" /> Full Evaluation
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================== SUBMIT 360 FEEDBACK DIALOG ==================== */}
      <Dialog open={isSubmitFeedbackOpen} onOpenChange={setIsSubmitFeedbackOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-600" />
              Provide 360° Feedback ({selectedQuarter} {selectedYear})
            </DialogTitle>
            <DialogDescription>
              Evaluate a colleague across core performance and behavioral competencies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Employee & Role selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Colleague to Review *</Label>
                <Select 
                  value={newFeedback.employeeId} 
                  onValueChange={(val) => setNewFeedback({ ...newFeedback, employeeId: val })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(e => e.id !== authUser?.id)
                      .map(e => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.firstName} {e.lastName} ({e.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Your Relationship *</Label>
                <Select 
                  value={newFeedback.reviewerRole} 
                  onValueChange={(val) => setNewFeedback({ ...newFeedback, reviewerRole: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Peer">Peer / Teammate</SelectItem>
                    <SelectItem value="Manager">Manager / Lead</SelectItem>
                    <SelectItem value="Direct Report">Direct Report</SelectItem>
                    <SelectItem value="Cross-functional">Cross-functional Collaborator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4 Competencies Ratings */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Competency Assessment (1 to 5)
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">1. Technical & Functional Mastery</Label>
                    <p className="text-[11px] text-slate-500">Domain skills, code quality, and job execution</p>
                  </div>
                  <Select 
                    value={newFeedback.technicalRating} 
                    onValueChange={(v) => setNewFeedback({ ...newFeedback, technicalRating: v })}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="3">3 - Proficient</SelectItem>
                      <SelectItem value="2">2 - Needs Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">2. Delivery & Reliability</Label>
                    <p className="text-[11px] text-slate-500">Meeting timelines, ownership, and consistency</p>
                  </div>
                  <Select 
                    value={newFeedback.deliveryRating} 
                    onValueChange={(v) => setNewFeedback({ ...newFeedback, deliveryRating: v })}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="3">3 - Proficient</SelectItem>
                      <SelectItem value="2">2 - Needs Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">3. Teamwork & Culture</Label>
                    <p className="text-[11px] text-slate-500">Helping peers, positive attitude, and support</p>
                  </div>
                  <Select 
                    value={newFeedback.teamworkRating} 
                    onValueChange={(v) => setNewFeedback({ ...newFeedback, teamworkRating: v })}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="3">3 - Proficient</SelectItem>
                      <SelectItem value="2">2 - Needs Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold">4. Communication & Influence</Label>
                    <p className="text-[11px] text-slate-500">Clarity, proactive updates, and cross-team alignment</p>
                  </div>
                  <Select 
                    value={newFeedback.communicationRating} 
                    onValueChange={(v) => setNewFeedback({ ...newFeedback, communicationRating: v })}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="3">3 - Proficient</SelectItem>
                      <SelectItem value="2">2 - Needs Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="space-y-1.5">
              <Label>Core Strengths *</Label>
              <Textarea
                placeholder="What does this person excel at? What are their greatest contributions to projects and team morale?"
                value={newFeedback.strengths}
                onChange={(e) => setNewFeedback({ ...newFeedback, strengths: e.target.value })}
                rows={3}
              />
            </div>

            {/* Improvements */}
            <div className="space-y-1.5">
              <Label>Constructive Areas for Growth</Label>
              <Textarea
                placeholder="Where could this person focus to level up their impact in upcoming quarters?"
                value={newFeedback.improvements}
                onChange={(e) => setNewFeedback({ ...newFeedback, improvements: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSubmitFeedbackOpen(false)}>Cancel</Button>
            <Button 
              className="bg-teal-600 hover:bg-teal-700 text-white" 
              onClick={handleSubmitFeedback}
              disabled={createFeedbackMutation.isPending}
            >
              {createFeedbackMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW FULL FEEDBACK MODAL ==================== */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-600" />
              Full 360° Evaluation Details
            </DialogTitle>
          </DialogHeader>

          {selectedFeedback && (() => {
            const emp = employeeMap.get(selectedFeedback.employeeId);
            return (
              <div className="space-y-4 py-2 text-sm">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : "Employee"}</h3>
                    <p className="text-xs text-slate-500">
                      Reviewed by {selectedFeedback.reviewerName || "Peer"} ({selectedFeedback.reviewerRole})
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-sm font-extrabold gap-1">
                    <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                    {selectedFeedback.overallRating || "4.5"} / 5.0
                  </Badge>
                </div>

                <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Technical & Functional:</span>
                    <span className="font-bold text-slate-900">{selectedFeedback.technicalRating || 5}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Delivery & Execution:</span>
                    <span className="font-bold text-slate-900">{selectedFeedback.deliveryRating || 5}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Teamwork & Collaboration:</span>
                    <span className="font-bold text-slate-900">{selectedFeedback.teamworkRating || 5}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Communication & Leadership:</span>
                    <span className="font-bold text-slate-900">{selectedFeedback.communicationRating || 4}/5</span>
                  </div>
                </div>

                {selectedFeedback.strengths && (
                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-xs">
                    <p className="font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-teal-600" />
                      Strengths & Commendations
                    </p>
                    <p className="text-teal-800">{selectedFeedback.strengths}</p>
                  </div>
                )}

                {selectedFeedback.improvements && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
                    <p className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Growth Recommendations
                    </p>
                    <p className="text-blue-800">{selectedFeedback.improvements}</p>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
