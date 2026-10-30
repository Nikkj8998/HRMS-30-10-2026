import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmployeeInvitationForm } from "@/components/employees/employee-invitation-form";
import { MultiStepEmployeeForm } from "@/components/employees/multi-step-employee-form";
import {
  Plus,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building2,
  User as UserIcon,
  Search,
  Users,
  TrendingUp,
  Crown,
  Star,
  Award,
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Settings,
  Send,
  Briefcase,
  MapPin,
  Hash,
  CreditCard,
  Clock,
  Shield,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { User, Department, Unit } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!hasPermission(user, "employees.view")) {
    return <Redirect to="/" />;
  }

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [addMethod, setAddMethod] = useState<'invitation' | 'manual'>('invitation');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/masters/units"],
  });

  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      setSelectedUnit(units[0].id.toString());
    }
  }, [units]);

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Employee deleted", description: "The employee has been deleted successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to delete employee: ${error.message}`, variant: "destructive" });
    },
  });

  const handleEdit = (employee: User) => {
    setSelectedEmployee(employee);
    setIsEditOpen(true);
  };

  const handleView = (employee: User) => {
    setSelectedEmployee(employee);
    setIsViewOpen(true);
  };

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchQuery.toLowerCase();
    const dept = departments.find(d => d.id === employee.departmentId);
    const matchesUnit = !selectedUnit || (dept && String(dept.unitId) === selectedUnit);
    const matchesSearch = (
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      (employee.position?.toLowerCase().includes(searchLower)) ||
      employee.role.toLowerCase().includes(searchLower)
    );
    return matchesUnit && matchesSearch;
  });

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleUnitChange = (value: string) => {
    setSelectedUnit(value);
    setCurrentPage(1);
  };

  const unitFilteredEmployees = employees.filter(emp => {
    if (!selectedUnit) return true;
    const dept = departments.find(d => d.id === emp.departmentId);
    return dept && String(dept.unitId) === selectedUnit;
  });

  // Use filteredEmployees for stats so that stats reflect search and unit filter
  const totalEmployees = filteredEmployees.length;
  const activeEmployees = filteredEmployees.filter(emp => emp.isActive).length;

  const roleStats = {
    admin: filteredEmployees.filter(emp => emp.role === 'admin').length,
    hr: filteredEmployees.filter(emp => emp.role === 'hr').length,
    manager: filteredEmployees.filter(emp => emp.role === 'manager').length,
    employee: filteredEmployees.filter(emp => emp.role === 'employee').length
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'hr': return <Users className="w-4 h-4" />;
      case 'manager': return <Star className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return "default";
      case 'hr': return "secondary";
      case 'manager': return "outline";
      default: return "outline";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return "bg-purple-100/80 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20";
      case 'hr': return "bg-teal-100/80 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/20";
      case 'manager': return "bg-blue-100/80 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20";
      default: return "bg-slate-100/80 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/20";
    }
  };

  if (isLoadingEmployees) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          title="Employee Management"
          description="Manage your workforce, positions, and team profiles."
          icon={<Users className="w-6 h-6 text-blue-600" />}
          actions={
            <div className="flex items-center space-x-3">
              <div className="bg-white/[0.03] rounded-xl px-4 py-1.5 border border-white/[0.08] flex items-center space-x-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Team Members</div>
                  <div className="text-base font-black text-white leading-none">{totalEmployees}</div>
                </div>
              </div>
              {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'developer') && (
                <Button
                  onClick={() => setIsAddFormVisible(!isAddFormVisible)}
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] px-4 h-10 flex items-center"
                >
                  {isAddFormVisible ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {isAddFormVisible ? "Cancel" : "Add Employee"}
                </Button>
              )}
            </div>
          }
        />

        {/* Dual Entry Toggle Form */}
        <AnimatePresence>
          {isAddFormVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border border-white/[0.08] shadow-xl bg-[#0c1427]/60 mb-8">
                <CardContent className="p-0">
                  <div className="flex border-b border-white/[0.08]">
                    <button
                      onClick={() => setAddMethod('invitation')}
                      className={cn(
                        "flex-1 flex items-center justify-center py-4 px-6 text-sm font-bold transition-all",
                        addMethod === 'invitation'
                          ? "bg-blue-500/10 !text-blue-400 border-b-2 border-blue-500"
                          : "text-slate-400 hover:bg-white/[0.02]"
                      )}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Email Invitation
                    </button>
                    <button
                      onClick={() => setAddMethod('manual')}
                      className={cn(
                        "flex-1 flex items-center justify-center py-4 px-6 text-sm font-bold transition-all",
                        addMethod === 'manual'
                          ? "bg-blue-500/10 !text-blue-400 border-b-2 border-blue-500"
                          : "text-slate-400 hover:bg-white/[0.02]"
                      )}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Manual Form
                    </button>
                  </div>
                  <div className="p-8">
                    {addMethod === 'invitation' ? (
                      <div className="max-w-2xl mx-auto">
                        <div className="mb-6 text-center">
                          <h3 className="text-lg font-bold text-slate-900">Send Invitation Email</h3>
                          <p className="text-sm text-slate-500">The employee will receive an email with their login credentials and onboarding steps.</p>
                        </div>
                        <EmployeeInvitationForm
                          onSuccess={() => {
                            setIsAddFormVisible(false);
                            queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
                            toast({ title: "Success", description: "Invitation sent successfully." });
                          }}
                        />
                      </div>
                    ) : (
                      <MultiStepEmployeeForm
                        departments={departments}
                        onSuccess={() => {
                          setIsAddFormVisible(false);
                          queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
                          toast({ title: "Success", description: "Employee added successfully." });
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="!border-blue-500/20 shadow-lg !bg-blue-950/10 shadow-[0_0_15px_rgba(59,130,246,0.05)]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-400">Total Employees</div>
                <div className="text-3xl font-bold text-white">{totalEmployees}</div>
              </div>
              <div className="bg-blue-600/20 p-3 rounded-xl"><Users className="w-6 h-6 text-blue-400" /></div>
            </CardContent>
          </Card>
          <Card className="!border-emerald-500/20 shadow-lg !bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-400">Active Members</div>
                <div className="text-3xl font-bold text-white">{activeEmployees}</div>
              </div>
              <div className="bg-emerald-600/20 p-3 rounded-xl"><Award className="w-6 h-6 text-emerald-400" /></div>
            </CardContent>
          </Card>
          <Card className="!border-purple-500/20 shadow-lg !bg-purple-950/10 shadow-[0_0_15px_rgba(139,92,246,0.05)]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-400">Departments</div>
                <div className="text-3xl font-bold text-white">{departments.length}</div>
              </div>
              <div className="bg-purple-600/20 p-3 rounded-xl"><Building2 className="w-6 h-6 text-purple-400" /></div>
            </CardContent>
          </Card>
          <Card className="!border-orange-500/20 shadow-lg !bg-orange-950/10 shadow-[0_0_15px_rgba(249,115,22,0.05)]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-400">Leadership</div>
                <div className="text-3xl font-bold text-white">{roleStats.admin + roleStats.manager}</div>
              </div>
              <div className="bg-orange-600/20 p-3 rounded-xl"><Crown className="w-6 h-6 text-orange-400" /></div>
            </CardContent>
          </Card>
        </div>

        {/* Search & View Controls */}
        <div className="bg-[#0c1427]/60 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1 flex-wrap gap-y-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-12 border border-white/[0.08] focus:border-blue-500/50 rounded-xl"
                  data-testid="input-search-employees"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Unit</label>
                <Select value={selectedUnit} onValueChange={handleUnitChange}>
                  <SelectTrigger className="h-10 w-52 bg-white/[0.02] border border-white/[0.08] focus:border-blue-500/50" data-testid="select-unit-filter">
                    <SelectValue placeholder={units?.[0]?.name || "Select Unit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u: Unit) => (
                      <SelectItem key={u.id} value={String(u.id)} data-testid={`option-unit-${u.id}`}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-slate-300 font-medium bg-white/[0.02] border border-white/[0.06] px-3 py-2 rounded-xl">
                {filteredEmployees.length} employees found
              </div>
            </div>
          </div>
        </div>

        {/* Employee View */}
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-20 bg-[#0c1427]/60 backdrop-blur-md rounded-2xl border border-dashed border-white/[0.08]">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No employees found</h3>
            <p className="text-slate-500">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="bg-[#0c1427]/60 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.02]">
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((employee) => {
                  const department = departments.find(d => d.id === employee.departmentId);
                  const isPending = employee.status === 'invited';
                  return (
                    <TableRow
                      key={employee.id}
                      className={cn(
                        "hover:bg-white/[0.02] transition-colors",
                        isPending && "bg-amber-500/5 hover:bg-amber-500/10"
                      )}
                    >
                      <TableCell className="py-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.photoUrl || ""} />
                          <AvatarFallback className="text-xs font-semibold bg-blue-900/60 text-blue-200">
                            {employee.firstName[0]}{employee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="py-2 font-bold !text-slate-100">
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell className="py-2 !text-slate-400">{employee.email}</TableCell>
                      <TableCell className="py-2 !text-slate-400">{employee.position || "-"}</TableCell>
                      <TableCell className="py-2 !text-slate-400">{department?.name || "-"}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant={getRoleBadgeVariant(employee.role)} className={cn("capitalize text-xs", getRoleColor(employee.role))}>
                          {employee.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant={isPending ? "secondary" : employee.isActive ? "default" : "destructive"}
                          className={cn("text-xs", isPending && "bg-amber-500/10 text-amber-300 border-amber-500/20")}
                        >
                          {isPending ? "Pending" : employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(employee)}
                             className="h-8 w-8 hover:bg-white/[0.05] hover:text-blue-400"
                             data-testid={`button-view-employee-${employee.id}`}
                           >
                             <Eye className="h-4 w-4 text-slate-400 hover:text-blue-400" />
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'developer') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(employee)}
                              className="h-8 w-8 hover:bg-slate-100"
                              data-testid={`button-edit-employee-${employee.id}`}
                            >
                              <Settings className="h-4 w-4 text-slate-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-[#0c1427]/30">
                <div className="text-sm text-slate-400">
                  Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="font-semibold text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)}</span> of <span className="font-semibold text-slate-200">{filteredEmployees.length}</span> employees
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    data-testid="button-page-first"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-page-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .reduce<(number | "...")[]>((acc, page, idx, arr) => {
                      if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
                      ) : (
                        <Button
                          key={`page-${item}`}
                          variant={currentPage === item ? "default" : "ghost"}
                          size="icon"
                          className={cn(
                            "h-8 w-8 text-sm",
                             currentPage === item && "!bg-blue-600 hover:!bg-blue-700 text-white"
                           )}
                          onClick={() => setCurrentPage(item as number)}
                          data-testid={`button-page-${item}`}
                        >
                          {item}
                        </Button>
                      )
                    )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-page-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    data-testid="button-page-last"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Modify employee information and settings</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <MultiStepEmployeeForm
              employee={selectedEmployee}
              departments={departments}
              onSuccess={() => {
                setIsEditOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* LinkedIn-style Sliding Profile Panel */}
      <AnimatePresence>
        {isViewOpen && selectedEmployee && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsViewOpen(false)}
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0c1427]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-2xl z-50 flex flex-col overflow-hidden text-slate-200"
            >
              {/* Profile Banner */}
              <div className="relative">
                <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5 transition-colors"
                  data-testid="button-close-profile-panel"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Avatar overlapping banner */}
                <div className="px-6 pb-4">
                  <div className="-mt-10 mb-3 flex items-end justify-between">
                    <Avatar className="h-20 w-20 border-4 border-[#0c1427] shadow-lg">
                      <AvatarImage src={selectedEmployee.photoUrl || ""} alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} />
                      <AvatarFallback className="text-2xl font-bold bg-blue-900/60 text-blue-200">
                        {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2 mb-1">
                      <Badge
                        className={cn("text-xs border font-semibold", getRoleColor(selectedEmployee.role))}
                      >
                        {getRoleIcon(selectedEmployee.role)}
                        <span className="ml-1 capitalize">{selectedEmployee.role}</span>
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs border font-semibold",
                          selectedEmployee.status === 'invited'
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            : selectedEmployee.isActive
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : "bg-red-500/10 text-red-300 border-red-500/20"
                        )}
                      >
                        {selectedEmployee.status === 'invited' ? "Pending" : selectedEmployee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h2>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">
                      {selectedEmployee.position || "No Position Set"}
                    </p>
                    {selectedEmployee.employeeId && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {selectedEmployee.employeeId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Contact Section */}
                <div className="px-6 py-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
                        <Mail className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-slate-400 font-medium">Email</div>
                        <div className="text-slate-200 font-medium truncate">{selectedEmployee.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-blue-500/10 p-2 rounded-lg flex-shrink-0">
                        <Phone className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Phone</div>
                        <div className="text-slate-200 font-medium">{selectedEmployee.phoneNumber || "Not provided"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Work Details */}
                <div className="px-6 py-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Work Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-indigo-500/10 p-2 rounded-lg flex-shrink-0">
                        <Building2 className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Department</div>
                        <div className="text-slate-200 font-medium">
                          {departments.find(d => d.id === selectedEmployee.departmentId)?.name || "Unassigned"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-indigo-500/10 p-2 rounded-lg flex-shrink-0">
                        <Briefcase className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Position</div>
                        <div className="text-slate-200 font-medium">{selectedEmployee.position || "Not set"}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-indigo-500/10 p-2 rounded-lg flex-shrink-0">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Date of Joining</div>
                        <div className="text-slate-200 font-medium">
                          {selectedEmployee.joinDate
                            ? format(new Date(selectedEmployee.joinDate), "PPP")
                            : "Not set"}
                        </div>
                      </div>
                    </div>

                    {(selectedEmployee as any).salary && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="bg-indigo-500/10 p-2 rounded-lg flex-shrink-0">
                          <CreditCard className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Monthly CTC</div>
                          <div className="text-slate-200 font-medium">
                            ₹{Number((selectedEmployee as any).salary).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Personal Details */}
                <div className="px-6 py-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Personal Details</h3>
                  <div className="space-y-3">
                    {(selectedEmployee as any).dateOfBirth && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Date of Birth</div>
                          <div className="text-slate-200 font-medium">
                            {format(new Date((selectedEmployee as any).dateOfBirth), "PPP")}
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedEmployee as any).gender && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Gender</div>
                          <div className="text-slate-200 font-medium capitalize">{(selectedEmployee as any).gender}</div>
                        </div>
                      </div>
                    )}

                    {(selectedEmployee as any).address && (
                      <div className="flex items-start gap-3 text-sm">
                        <div className="bg-purple-500/10 p-2 rounded-lg flex-shrink-0 mt-0.5">
                          <MapPin className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Address</div>
                          <div className="text-slate-200 font-medium leading-snug">{(selectedEmployee as any).address}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Section */}
                <Separator />
                <div className="px-6 py-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Account</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-white/[0.04] p-2 rounded-lg flex-shrink-0">
                        <Shield className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Username</div>
                        <div className="text-slate-200 font-medium font-mono">{selectedEmployee.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-white/[0.04] p-2 rounded-lg flex-shrink-0">
                        <Clock className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Account Status</div>
                        <div className={cn(
                          "font-semibold",
                          selectedEmployee.isActive ? "text-emerald-400" : "text-red-400"
                        )}>
                          {selectedEmployee.isActive ? "Active" : "Deactivated"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pb-8" />
              </div>

              {/* Footer Actions */}
              {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'developer') && (
                <div className="border-t border-white/[0.08] px-6 py-4 bg-[#0c1427]/80">
                  <Button
                    className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                    onClick={() => {
                      setIsViewOpen(false);
                      handleEdit(selectedEmployee);
                    }}
                    data-testid="button-edit-from-profile"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
