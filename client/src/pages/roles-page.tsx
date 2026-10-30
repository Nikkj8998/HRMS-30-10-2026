import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, resolveApiUrl } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Edit, Eye, Shield, ShieldCheck, Users, Search, TrendingUp, UserCheck, Lock, Settings, ChevronRight, Crown, Key, Filter, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Unit } from "@shared/schema";

type User = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  position: string;
  departmentId: number | null;
  isActive: boolean;
  customPermissions?: string[];
};

type Department = {
  id: number;
  name: string;
  description: string;
  unitId: number | null;
};

export default function RolesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Filter States
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");



  // Check if current user can edit (only admin)
  const canEdit = user?.role === "admin";

  // Fetch all users
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<User[]>({
    queryKey: ['/api/employees'],
  });

  // Fetch departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch units
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/masters/units"],
  });

  // Default unit to Cybaem Tech Pvt Ltd - MOVED AFTER UNITS DEFINITION
  useEffect(() => {
    if (units.length > 0 && selectedUnit === "all") {
      const cybaemUnit = units.find(u => u.name?.toLowerCase().includes("cybaem"));
      if (cybaemUnit) {
        setSelectedUnit(cybaemUnit.id.toString());
      }
    }
  }, [units, selectedUnit]);

  // Filter users based on search query, department, and company (unit)
  const filteredUsers = useMemo(() => {
    return employees.filter(user => {
      // Search filter
      const query = searchQuery.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = !searchQuery ||
        fullName.includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (user.role || "").toLowerCase().includes(query) ||
        (user.position || "").toLowerCase().includes(query);

      // Dept filter
      const matchesDept = selectedDept === "all" || user.departmentId === parseInt(selectedDept);

      // Unit filter
      let matchesUnit = true;
      if (selectedUnit !== "all") {
        const dept = departments.find(d => d.id === user.departmentId);
        matchesUnit = dept?.unitId === parseInt(selectedUnit);
      }

      return matchesSearch && matchesDept && matchesUnit;
    });
  }, [employees, searchQuery, selectedDept, selectedUnit, departments]);

  const pagination = usePagination(filteredUsers, 10);

  // Mutation to update user permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { userId: number; role: string; customPermissions: string[] }) => {
      const response = await fetch(resolveApiUrl("/api/update-permissions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update permissions");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "User permissions updated successfully",
      });
      setIsDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user permissions",
        variant: "destructive",
      });
    },
  });

  const getRolePermissions = (role: string, customPermissions: string[] = []) => {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
    const uniquePerms = new Set([...defaultPerms, ...customPermissions]);
    return Array.from(uniquePerms);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditingRole(user.role);
    setEditingPermissions(user.customPermissions || []);
    setIsDialogOpen(true);
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;

    updatePermissionsMutation.mutate({
      userId: selectedUser.id,
      role: editingRole,
      customPermissions: editingPermissions,
    });
  };

  const togglePermission = (permissionId: string) => {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[editingRole as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];

    if (defaultPerms.includes(permissionId)) {
      return;
    }

    setEditingPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(p => p !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case "admin": return "bg-rose-500/10 text-rose-300 border-rose-500/20";
      case "hr": return "bg-teal-500/10 text-teal-300 border-teal-500/20";
      case "manager": return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      default: return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  if (isLoadingEmployees) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span className="text-lg font-medium text-slate-600">Loading roles and permissions...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          title="Roles & Permissions"
          description={`Manage user access levels and security permissions with enterprise-grade control.${!canEdit ? " • View Only Mode" : ""}`}
          icon={<Shield className="h-6 w-6 text-blue-600" />}
          actions={
            <div className="flex items-center space-x-3">
              <div className="bg-white/[0.03] rounded-xl px-4 py-1.5 border border-white/[0.08] shadow-sm flex items-center space-x-2.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Users</div>
                  <div className="text-base font-black text-white leading-none">{employees.length}</div>
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-xl px-4 py-1.5 border border-white/[0.08] shadow-sm flex items-center space-x-2.5">
                <Lock className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Roles</div>
                  <div className="text-base font-black text-white leading-none">{new Set(employees.map(u => u.role)).size}</div>
                </div>
              </div>
            </div>
          }
        />

        {/* Search and Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border border-white/[0.08] focus:border-blue-500/50 rounded-xl bg-white/[0.02] text-white shadow-sm font-medium"
            />
          </div>

          <div className="md:col-span-1">
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="h-12 border border-white/[0.08] focus:border-blue-500/50 rounded-xl bg-white/[0.02] text-slate-200">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Company (Unit)" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-12 border border-white/[0.08] focus:border-blue-500/50 rounded-xl bg-white/[0.02] text-slate-200">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Department" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {/* De-duplicate departments by name */}
                {Array.from(new Map(departments.map(d => [d.name, d])).values()).map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1 flex justify-end">
            <Badge variant="outline" className="h-10 px-4 rounded-xl border border-white/[0.08] font-bold bg-white/[0.02] text-slate-300">
              {filteredUsers.length} Users Found
            </Badge>
          </div>
        </div>

        {/* Users Table Card */}
        <Card className="border border-white/[0.08] shadow-xl rounded-2xl overflow-hidden bg-[#0c1427]/60 backdrop-blur-md text-slate-200">
          <CardHeader className="bg-white/[0.02] border-b border-white/[0.08] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <CardTitle className="text-xl font-bold text-white">User Access Management</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/[0.08] bg-white/[0.01]">
                    <TableHead className="px-6 py-3 font-bold text-slate-400 text-sm">Team Member</TableHead>
                    <TableHead className="py-3 font-bold text-slate-400 text-sm">Access Level</TableHead>
                    <TableHead className="py-3 font-bold text-slate-400 text-sm">Position</TableHead>
                    <TableHead className="py-3 font-bold text-slate-400 text-sm">Permissions</TableHead>
                    <TableHead className="py-3 font-bold text-slate-400 text-right text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {pagination.paginatedItems.map((user: User, index) => {
                      const userPermissions = getRolePermissions(user.role, user.customPermissions);
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="group border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                        >
                          <TableCell className="px-6 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-bold text-slate-300 text-xs shadow-sm group-hover:scale-105 transition-transform">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm leading-tight">{user.firstName} {user.lastName}</div>
                                <div className="text-[10px] text-slate-500 font-medium">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {user.role === 'admin' && <Crown className="w-4 h-4 text-amber-500" />}
                               <Badge
                                variant="outline"
                                className={cn("px-3 py-1 font-bold text-[10px] uppercase tracking-widest rounded-lg border", getRoleBadgeStyles(user.role))}
                              >
                                {user.role}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-300 font-bold text-sm bg-white/[0.02] px-3 py-1 rounded-lg border border-white/[0.08]">
                              {user.position || 'Employee'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                              <span className="text-sm font-bold text-slate-300">{userPermissions.length} Active Rules</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              onClick={() => handleEditUser(user)}
                              className="bg-white/[0.04] border border-white/[0.08] text-blue-400 hover:text-blue-300 hover:bg-white/[0.08] font-bold h-10 px-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                              {canEdit ? "Configure" : "View Details"}
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/[0.08]">
              <PaginationBar
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.setCurrentPage}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                itemLabel="users"
              />
            </div>
          </CardContent>
        </Card>

        {/* Permissions Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200">
            {selectedUser && (
              <div className="flex flex-col h-full max-h-[90vh]">
                <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 p-8 text-white relative border-b border-white/[0.08]">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield className="w-32 h-32" />
                  </div>
                  <DialogTitle className="text-2xl font-black mb-2 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    {canEdit ? "Manage" : "View"} Permissions Settings
                  </DialogTitle>
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center font-bold text-xl border border-white/20">
                      {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xl font-bold">{selectedUser.firstName} {selectedUser.lastName}</div>
                      <div className="text-slate-400 text-sm">{selectedUser.email}</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Role Config */}
                  <Card className="rounded-[1.5rem] border border-white/[0.08] overflow-hidden bg-white/[0.01] text-slate-200">
                    <CardHeader className="bg-white/[0.02] border-b border-white/[0.08]">
                      <CardTitle className="text-lg font-bold flex items-center">
                        <Crown className="w-5 h-5 mr-3 text-amber-500" />
                        Base Security Role
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {canEdit ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {['employee', 'manager', 'hr', 'admin'].map((r) => (
                            <div
                              key={r}
                              onClick={() => setEditingRole(r)}
                              className={cn(
                                "cursor-pointer p-6 rounded-2xl border transition-all group relative",
                                editingRole === r
                                  ? "border-blue-500 bg-blue-500/10 shadow-md ring-2 ring-blue-500/20"
                                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
                              )}
                            >
                              {editingRole === r && (
                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow-lg">
                                  <ShieldCheck className="w-4 h-4" />
                                </div>
                              )}
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
                                editingRole === r ? "bg-blue-600 text-white" : "bg-white/[0.04] text-slate-400"
                              )}>
                                {r === 'admin' ? <Crown className="w-5 h-5" /> :
                                  r === 'manager' ? <Key className="w-5 h-5" /> :
                                    r === 'hr' ? <UserCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                              </div>
                              <div className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-1">Security Level</div>
                              <div className="font-bold text-white uppercase">{r}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                         <div className="flex items-center space-x-3">
                           <Badge variant="outline" className={cn("text-lg px-6 py-2 font-black uppercase tracking-widest border-2", getRoleBadgeStyles(editingRole))}>
                             {editingRole}
                           </Badge>
                         </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Specific Permissions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(
                      PERMISSIONS.reduce((acc, perm) => {
                        if (!acc[perm.category]) acc[perm.category] = [];
                        acc[perm.category].push(perm);
                        return acc;
                      }, {} as Record<string, typeof PERMISSIONS>)
                    ).map(([category, perms]) => (
                      <Card key={category} className="rounded-2xl border border-white/[0.08] overflow-hidden bg-white/[0.01] hover:shadow-lg transition-shadow text-slate-200">
                        <CardHeader className="bg-white/[0.02] border-b border-white/[0.08] px-6 py-4">
                          <CardTitle className="text-base font-bold flex items-center space-x-2">
                            <Settings className="w-4 h-4 text-blue-400" />
                            <span>{category} Access Control</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                          {perms.map(permission => {
                            const defaultPerms = DEFAULT_ROLE_PERMISSIONS[editingRole as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
                            const isDefault = defaultPerms.includes(permission.id);
                            const isGranted = isDefault || editingPermissions.includes(permission.id);

                            return (
                              <div
                                key={permission.id}
                                className={cn(
                                  "flex items-center space-x-3 p-3 rounded-xl transition-all border border-transparent",
                                  isGranted ? "bg-blue-500/5 border-blue-500/20" : "hover:bg-white/[0.02]"
                                )}
                              >
                                <Checkbox
                                  checked={isGranted}
                                  disabled={!canEdit || isDefault}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                  className="h-5 w-5 data-[state=checked]:bg-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className={cn(
                                      "text-sm font-bold",
                                      isGranted ? "text-white" : "text-slate-400"
                                    )}>
                                      {permission.label}
                                    </span>
                                    {isDefault && (
                                      <Badge className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-black uppercase py-0.5 px-2">
                                        Core Rule
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {canEdit && (
                  <div className="p-8 bg-[#0c1427]/80 border-t border-white/[0.08] flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="h-12 px-8 font-bold rounded-xl border border-white/[0.08] bg-transparent text-slate-300 hover:bg-white/[0.04] transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={updatePermissionsMutation.isPending}
                      className="h-12 px-8 font-black !bg-blue-600 hover:!bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                      {updatePermissionsMutation.isPending ? "Updating Security Policies..." : "Deploy Permissions"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}