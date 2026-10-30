import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { DepartmentForm } from "@/components/departments/department-form";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  TrendingUp,
  BarChart3,
  Target,
  Settings,
  Eye,
  ArrowUpRight,
  ChevronRight,
  Briefcase,
  Grid3X3,
  List,
  Search,
  Shield,
  Edit
} from "lucide-react";
import { Department, User, Unit } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ColumnDef } from "@tanstack/react-table";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch departments data
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch all employees data
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch units for filter
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/masters/units"],
  });

  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      setSelectedUnit(units[0].id.toString());
    }
  }, [units]);

  // Sort departments by ID ascending and filter
  const sortedDepartments = useMemo(() => {
    let list = [...departments].sort((a, b) => a.id - b.id);
    if (selectedUnit) {
      list = list.filter(dept => String(dept.unitId) === selectedUnit);
    }
    if (searchQuery) {
      list = list.filter(dept => 
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return list;
  }, [departments, selectedUnit, searchQuery]);

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Department deleted",
        description: "The department has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete department: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handler for the edit button
  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsEditOpen(true);
  };

  // Handler for viewing department employees
  const handleViewEmployees = (department: Department) => {
    setSelectedDepartment(department);
    setIsEmployeesOpen(true);
  };

  // Get employees for selected department
  const selectedDeptEmployees = selectedDepartment
    ? employees.filter(emp => emp.departmentId === selectedDepartment.id)
    : [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Executive Header Section */}
        <div className="bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/50 dark:from-[#1E293B] dark:via-[#0f172a] dark:to-[#1E1B4B] -mx-6 -mt-6 px-8 py-10 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-xl">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:bg-gradient-to-r dark:from-white dark:to-slate-200 dark:bg-clip-text dark:text-transparent mb-1">
                  Department Management
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Organize and manage your company structure and teams
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-card/50 dark:bg-white/[0.03] rounded-xl px-6 py-4 shadow-md border border-border">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Teams</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{departments.length}</div>
                  </div>
                </div>
              </div>
              
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="!bg-blue-600 hover:!bg-blue-700 shadow-lg shadow-blue-500/10 transition-all duration-200 px-6 h-12 text-white font-bold rounded-xl"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Add Department</DialogTitle>
                    <DialogDescription>Create a new organizational department</DialogDescription>
                  </DialogHeader>
                  <DepartmentForm
                    onSuccess={() => {
                      setIsAddOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border border-border focus:border-blue-500/50 rounded-xl bg-card text-foreground shadow-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="h-12 w-48 border border-border focus:border-blue-500/50 rounded-xl bg-card text-foreground">
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="bg-card text-foreground px-4 py-2 rounded-lg border border-border font-bold whitespace-nowrap">
              {sortedDepartments.length} Departments Shown
            </Badge>
          </div>
        </div>

        {/* Department Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {isLoadingDepartments ? (
              [...Array(8)].map((_, index) => (
                <Card key={index} className="h-[400px] animate-pulse bg-white/[0.03] rounded-3xl border border-white/[0.08]" />
              ))
            ) : (
              sortedDepartments.map((dept, index) => {
                const deptEmployees = employees.filter(emp => emp.departmentId === dept.id);
                const lineManager = dept.lineManagerId 
                  ? employees.find(emp => emp.id === dept.lineManagerId)
                  : deptEmployees.find(emp => emp.role === 'manager' || emp.position?.toLowerCase().includes('manager'));
                const hod = dept.hodId 
                  ? employees.find(emp => emp.id === dept.hodId)
                  : employees.find(emp => emp.role === 'admin');
                
                return (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card className="group h-full border border-border hover:border-blue-500/50 shadow-lg hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 rounded-[1.5rem] overflow-hidden bg-card backdrop-blur-md relative text-card-foreground">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(dept)}
                          className="h-10 w-10 bg-muted/50 text-blue-500 dark:text-blue-400 hover:bg-muted rounded-xl border border-border"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 bg-muted/50 text-red-500 dark:text-red-400 hover:bg-muted rounded-xl border border-border"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Department</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {dept.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteDepartmentMutation.mutate(dept.id)}
                                className="bg-red-500 hover:bg-red-600 animate-none"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <CardHeader className="pt-8 px-8 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-blue-500/10 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                          </div>
                          <Badge variant="outline" className="text-sm font-bold border border-border text-foreground bg-muted/30">
                            ID: {dept.id}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl font-bold text-foreground line-clamp-1">{dept.name}</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium line-clamp-2 min-h-[2.5rem]">
                          {dept.description || "No description provided for this department."}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="px-8 pb-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/30 rounded-2xl p-4 border border-border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                              <Users className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Members</span>
                            </div>
                            <div className="text-xl font-black text-foreground">{deptEmployees.length}</div>
                          </div>
                          <div className="bg-muted/30 rounded-2xl p-4 border border-border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                              <Shield className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                              <span className="text-xs font-bold text-foreground">Active</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {/* Approval #1: Line Manager (Department Manager) */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Line Manager (Approval #1)</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30">Dept Manager</span>
                            </div>
                            <div className="flex items-center space-x-2.5 bg-muted/10 p-2.5 rounded-xl border border-border group-hover:bg-muted/30 transition-all">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-sm text-xs shrink-0">
                                {lineManager ? lineManager.firstName.charAt(0) : "NA"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-foreground text-xs truncate">{lineManager ? `${lineManager.firstName} ${lineManager.lastName}` : "Not Assigned"}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{lineManager?.position || "Department Manager"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Approval #2: HOD (Head of Department) */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">HOD (Approval #2)</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">Head of Dept</span>
                            </div>
                            <div className="flex items-center space-x-2.5 bg-muted/10 p-2.5 rounded-xl border border-border group-hover:bg-muted/30 transition-all">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm text-xs shrink-0">
                                {hod ? hod.firstName.charAt(0) : "NA"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-foreground text-xs truncate">{hod ? `${hod.firstName} ${hod.lastName}` : "Not Assigned"}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{hod?.position || "Head of Department"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-between bg-muted/30 hover:bg-muted/60 text-blue-600 dark:text-blue-400 font-bold rounded-xl transition-all animate-none"
                            onClick={() => handleViewEmployees(dept)}
                          >
                            <span className="text-sm">View Team List</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit department dialog */}
      {selectedDepartment && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>Modify department information</DialogDescription>
            </DialogHeader>
            <DepartmentForm
              department={selectedDepartment}
              onSuccess={() => {
                setIsEditOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Team Members Dialog */}
      <Dialog open={isEmployeesOpen} onOpenChange={setIsEmployeesOpen}>
        <DialogContent className="max-w-3xl overflow-hidden flex flex-col max-h-[90vh] bg-dialog text-foreground">
          <DialogHeader className="px-6 pt-6 border-b border-border pb-4">
            <DialogTitle className="flex items-center text-2xl font-bold text-foreground">
              <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              Team Members: {selectedDepartment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto space-y-3">
            {selectedDeptEmployees.length > 0 ? (
              selectedDeptEmployees.map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border border-border rounded-2xl bg-muted/10 hover:border-blue-500/30 hover:bg-muted/20 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-bold text-lg shadow-sm border border-border">
                      {employee.firstName?.[0]}{employee.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-lg">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {employee.position || "Employee"} | {employee.role}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 border-blue-500/20">
                    Active
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No team members in this department</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}