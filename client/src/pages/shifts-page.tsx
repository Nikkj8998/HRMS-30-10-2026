import { useState, useMemo, useEffect } from "react";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Plus, Users, Settings, Sun, Moon, Sunrise, Trash2, Edit, X, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  employees: number;
  icon: JSX.Element;
  color: string;
  description?: string;
}

interface ShiftSettings {
  allowOvertime: boolean;
  maxOvertimeHours: number;
  requireApproval: boolean;
  notifyManager: boolean;
  allowShiftSwap: boolean;
  minRestHours: number;
  autoAssign: boolean;
}

interface ShiftAssignment {
  id: number;
  employee: string;
  department: string;
  shift: string;
  shiftId: any;
  startDate: string;
  endDate: string;
}

export default function ShiftsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<ShiftAssignment | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ['/api/employees'],
  });

  const { data: shifts = [], refetch: refetchShifts } = useQuery<Shift[]>({
    queryKey: ['/api/shifts'],
  });

  const { data: assignments = [], refetch: refetchAssignments } = useQuery<any[]>({
    queryKey: ['/api/shifts/assignments'],
  });

  const { data: units = [] } = useQuery<any[]>({
    queryKey: ['/api/masters/units'],
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });

  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      setSelectedUnit(units[0].id.toString());
    }
  }, [units]);

  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    description: "",
    colorTheme: "amber"
  });

  const [settings, setSettings] = useState<ShiftSettings>({
    allowOvertime: true,
    maxOvertimeHours: 4,
    requireApproval: true,
    notifyManager: true,
    allowShiftSwap: true,
    minRestHours: 8,
    autoAssign: false,
  });

  const createShiftMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/shifts", data),
    onSuccess: () => {
      refetchShifts();
      setIsAddShiftOpen(false);
      toast({ title: "Shift Created", description: "The new shift has been added" });
    }
  });

  const updateShiftMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/shifts/${data.id}`, data),
    onSuccess: () => {
      refetchShifts();
      setIsAddShiftOpen(false);
      toast({ title: "Shift Updated", description: "The shift details have been updated" });
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/shifts/${id}`),
    onSuccess: () => {
      refetchShifts();
      toast({ title: "Shift Deleted", description: "The shift has been removed" });
    }
  });

  const assignShiftMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/shifts/assign", data),
    onSuccess: () => {
      refetchAssignments();
      setIsEditAssignmentOpen(false);
      toast({ title: "Assignment Saved", description: "Employee shift has been updated" });
    }
  });

  const shiftSchedule = useMemo(() => {
    // Map assignments to the format used in UI
    const assignedMap = new Map();
    assignments.forEach(a => assignedMap.set(a.userId, a));

    return employees.map((emp) => {
      const dept = departments.find(d => d.id === emp.departmentId);
      const assignment = assignedMap.get(emp.id);

      return {
        id: emp.id,
        employee: `${emp.firstName} ${emp.lastName}`,
        department: dept?.name || "General",
        shift: assignment?.shiftName || "Not Assigned",
        shiftId: assignment?.shiftId,
        startDate: assignment?.startDate || "--",
        endDate: assignment?.endDate || "--",
      };
    });
  }, [employees, assignments, departments]);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredShiftSchedule = useMemo(() => {
    let base = shiftSchedule;
    if (selectedUnit) {
      const unitId = parseInt(selectedUnit);
      base = base.filter(schedule => {
        const emp = employees.find(e => e.id === schedule.id);
        const dept = emp ? departments.find(d => d.id === emp.departmentId) : null;
        return dept?.unitId === unitId;
      });
    }
    if (searchTerm) {
      base = base.filter(s => s.employee.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return base;
  }, [shiftSchedule, selectedUnit, searchTerm, employees, departments]);

  const shiftsPagination = usePagination(filteredShiftSchedule);

  const colorThemes = [
    { value: "amber", label: "Amber", bgClass: "bg-amber-500/10 text-amber-300 border border-amber-500/20" },
    { value: "yellow", label: "Yellow", bgClass: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" },
    { value: "purple", label: "Purple", bgClass: "bg-purple-500/10 text-purple-300 border border-purple-500/20" },
    { value: "indigo", label: "Indigo", bgClass: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" },
    { value: "teal", label: "Teal", bgClass: "bg-teal-500/10 text-teal-300 border border-teal-500/20" },
    { value: "blue", label: "Blue", bgClass: "bg-blue-500/10 text-blue-300 border border-blue-500/20" },
    { value: "green", label: "Green", bgClass: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" },
    { value: "red", label: "Red", bgClass: "bg-rose-500/10 text-rose-300 border border-rose-500/20" },
  ];

  const getIconForShift = (startTime: string) => {
    const hour = parseInt(startTime.split(":")[0]);
    if (hour >= 5 && hour < 9) return <Sunrise className="h-5 w-5" />;
    if (hour >= 9 && hour < 14) return <Sun className="h-5 w-5" />;
    if (hour >= 14 && hour < 20) return <Moon className="h-5 w-5" />;
    return <Moon className="h-5 w-5" />;
  };

  const getColorClass = (theme: string) => {
    return colorThemes.find(t => t.value === theme)?.bgClass || "bg-amber-500/10 text-amber-300 border border-amber-500/20";
  };

  const formatTime = (time24: string) => {
    if (!time24) return "--:--";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const shiftsWithCounts = useMemo(() => {
    return shifts.map(s => ({
      ...s,
      employees: assignments.filter(a => a.shiftId === s.id).length,
      icon: getIconForShift(s.startTime),
      color: getColorClass(s.color)
    }));
  }, [shifts, assignments]);

  const handleAddShift = () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const payload = {
      name: newShift.name,
      startTime: newShift.startTime,
      endTime: newShift.endTime,
      description: newShift.description,
      color: newShift.colorTheme
    };

    if (isEditMode && editingShiftId) {
      updateShiftMutation.mutate({ ...payload, id: editingShiftId });
    } else {
      createShiftMutation.mutate(payload);
    }
  };

  const handleEditShift = (shift: any) => {
    setNewShift({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      description: shift.description || "",
      colorTheme: shift.color || "amber"
    });
    setIsEditMode(true);
    setEditingShiftId(shift.id);
    setIsAddShiftOpen(true);
  };

  const handleDeleteShift = (shiftId: number) => {
    deleteShiftMutation.mutate(shiftId);
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Shift management settings have been updated"
    });
    setIsSettingsOpen(false);
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    // For now, we don't have a direct delete for assignments, maybe just assign to none
    toast({
      title: "Feature coming soon",
      description: "Shift assignment removal will be available in the next update"
    });
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment({ ...assignment });
    setIsEditAssignmentOpen(true);
  };

  const handleSaveAssignment = () => {
    if (!editingAssignment) return;

    assignShiftMutation.mutate({
      userId: editingAssignment.id,
      shiftId: parseInt(editingAssignment.shiftId),
      startDate: editingAssignment.startDate,
      endDate: editingAssignment.endDate
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Shift Management"
          description="Configure, schedule, and manage employee shifts and rosters."
          icon={<Clock className="h-6 w-6 text-blue-600" />}
          actions={
            user?.role !== 'employee' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl"
                  data-testid="button-shift-settings"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                  data-testid="button-add-shift"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditingShiftId(null);
                    setNewShift({ name: "", startTime: "", endTime: "", description: "", colorTheme: "amber" });
                    setIsAddShiftOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Shift
                </Button>
              </div>
            )
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shiftsWithCounts.map((shift, index) => (
            <motion.div
              key={shift.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border border-white/[0.08] shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 overflow-hidden bg-[#0c1427]/60 backdrop-blur-md rounded-2xl relative text-slate-200 cursor-pointer group" data-testid={`card-shift-${shift.name.toLowerCase().replace(' ', '-')}`}>
                <CardContent className="p-6">
                  {user?.role !== 'employee' && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/[0.04]"
                        onClick={(e) => { e.stopPropagation(); handleEditShift(shift); }}
                        data-testid={`button-edit-shift-${shift.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-400 hover:text-rose-350 hover:bg-white/[0.04]"
                        onClick={(e) => { e.stopPropagation(); handleDeleteShift(shift.id); }}
                        data-testid={`button-delete-shift-${shift.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className={cn("p-3 rounded-lg border", shift.color)}>
                      {shift.icon}
                    </div>
                    {user?.role !== 'employee' && (
                      <Badge variant="outline" className="gap-1 bg-white/[0.04] text-slate-350 border-white/[0.08]">
                        <Users className="h-3 w-3" />
                        {shift.employees}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-4 font-bold text-lg text-white">{shift.name}</h3>
                  <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </p>
                  {shift.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{shift.description}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="border border-white/[0.08] shadow-xl bg-[#0c1427]/60 backdrop-blur-md text-slate-200 rounded-[2rem] overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  Shift Assignments
                </CardTitle>
                <CardDescription className="text-slate-400">Current employee shift schedules</CardDescription>
              </div>
              {user?.role !== 'employee' && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search employee..."
                      className="pl-9 w-full sm:w-64 h-9 text-sm border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger className="w-full sm:w-44 h-9 text-sm border-white/[0.08] bg-white/[0.02] text-slate-200 rounded-xl" data-testid="select-unit-filter-shifts">
                      <SelectValue placeholder={units?.[0]?.name || "Select Unit"} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Shift</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">Start Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-400">End Date</th>
                    {user?.role !== 'employee' && (
                      <th className="text-left py-3 px-4 font-medium text-slate-400">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {shiftsPagination.paginatedItems.map((schedule, index) => (
                    <tr key={schedule.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]" data-testid={`row-schedule-${index}`}>
                      <td className="py-3 px-4 font-medium text-white">{schedule.employee}</td>
                      <td className="py-3 px-4 text-slate-400">{schedule.department}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-white/[0.06] text-slate-200 border-white/[0.08]">{schedule.shift}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-455">{schedule.startDate}</td>
                      <td className="py-3 px-4 text-slate-455">{schedule.endDate}</td>
                      {user?.role !== 'employee' && (
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAssignment(schedule)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-white/[0.04]"
                              data-testid={`button-edit-schedule-${index}`}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-400 hover:text-rose-350 hover:bg-white/[0.04]"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              data-testid={`button-delete-schedule-${index}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar
              currentPage={shiftsPagination.currentPage}
              totalPages={shiftsPagination.totalPages}
              totalItems={shiftsPagination.totalItems}
              startIndex={shiftsPagination.startIndex}
              endIndex={shiftsPagination.endIndex}
              onPageChange={shiftsPagination.setCurrentPage}
              itemLabel="assignments"
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              {isEditMode ? "Edit Shift" : "Add New Shift"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {isEditMode ? "Update the shift details below" : "Create a new shift schedule for your organization"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-slate-200">
            <div className="space-y-2">
              <Label htmlFor="shiftName" className="text-slate-300">Shift Name *</Label>
              <Input
                id="shiftName"
                placeholder="e.g., Morning Shift, Night Shift"
                value={newShift.name}
                onChange={(e) => setNewShift(prev => ({ ...prev, name: e.target.value }))}
                className="border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                data-testid="input-shift-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-slate-300">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                  className="border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-slate-300">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                  className="border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                  data-testid="input-end-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorTheme" className="text-slate-300">Color Theme</Label>
              <Select
                value={newShift.colorTheme}
                onValueChange={(value) => setNewShift(prev => ({ ...prev, colorTheme: value }))}
              >
                <SelectTrigger className="border-white/[0.08] bg-white/[0.02] text-slate-200 rounded-xl" data-testid="select-color-theme">
                  <SelectValue placeholder="Select a color theme" />
                </SelectTrigger>
                <SelectContent className="bg-[#0c1427]/95 border-white/[0.08] text-white">
                  {colorThemes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value} className="focus:bg-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${theme.bgClass}`} />
                        {theme.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this shift..."
                value={newShift.description}
                onChange={(e) => setNewShift(prev => ({ ...prev, description: e.target.value }))}
                className="border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl resize-none"
                rows={3}
                data-testid="input-shift-description"
              />
            </div>

            {newShift.startTime && newShift.endTime && (
              <div className="p-3 bg-white/[0.01] border border-white/[0.06] rounded-lg">
                <p className="text-sm text-slate-300">
                  <span className="font-medium">Duration:</span>{" "}
                  {(() => {
                    const start = parseInt(newShift.startTime.split(":")[0]) * 60 + parseInt(newShift.startTime.split(":")[1]);
                    const end = parseInt(newShift.endTime.split(":")[0]) * 60 + parseInt(newShift.endTime.split(":")[1]);
                    const diff = end > start ? end - start : (24 * 60 - start) + end;
                    const hours = Math.floor(diff / 60);
                    const mins = diff % 60;
                    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
                  })()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddShiftOpen(false)} className="border-white/[0.08] bg-transparent text-slate-300 hover:bg-white/[0.04]" data-testid="button-cancel-shift">
              Cancel
            </Button>
            <Button onClick={handleAddShift} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-save-shift">
              {isEditMode ? "Update Shift" : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <Settings className="h-5 w-5 text-slate-350" />
              </div>
              Shift Settings
            </DialogTitle>
            <DialogDescription className="text-slate-405">
              Configure global shift management settings for your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="font-bold text-white border-b border-white/[0.08] pb-2">Overtime Settings</h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Allow Overtime</Label>
                  <p className="text-sm text-slate-400">Enable employees to work beyond scheduled hours</p>
                </div>
                <Switch
                  checked={settings.allowOvertime}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowOvertime: checked }))}
                  data-testid="switch-allow-overtime"
                />
              </div>

              {settings.allowOvertime && (
                <div className="space-y-2 pl-4 border-l-2 border-white/[0.08]">
                  <Label htmlFor="maxOvertime" className="text-slate-300">Maximum Overtime Hours (per day)</Label>
                  <Input
                    id="maxOvertime"
                    type="number"
                    min="1"
                    max="8"
                    value={settings.maxOvertimeHours}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxOvertimeHours: parseInt(e.target.value) || 0 }))}
                    className="w-32 border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                    data-testid="input-max-overtime"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white border-b border-white/[0.08] pb-2">Approval & Notifications</h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Require Manager Approval</Label>
                  <p className="text-sm text-slate-400">Shift changes need manager approval</p>
                </div>
                <Switch
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireApproval: checked }))}
                  data-testid="switch-require-approval"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Notify Manager on Changes</Label>
                  <p className="text-sm text-slate-400">Send notifications when shifts are modified</p>
                </div>
                <Switch
                  checked={settings.notifyManager}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifyManager: checked }))}
                  data-testid="switch-notify-manager"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white border-b border-white/[0.08] pb-2">Shift Rules</h4>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Allow Shift Swapping</Label>
                  <p className="text-sm text-slate-400">Enable employees to swap shifts with colleagues</p>
                </div>
                <Switch
                  checked={settings.allowShiftSwap}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowShiftSwap: checked }))}
                  data-testid="switch-allow-swap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRest" className="text-slate-300">Minimum Rest Hours Between Shifts</Label>
                <Input
                  id="minRest"
                  type="number"
                  min="4"
                  max="16"
                  value={settings.minRestHours}
                  onChange={(e) => setSettings(prev => ({ ...prev, minRestHours: parseInt(e.target.value) || 8 }))}
                  className="w-32 border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                  data-testid="input-min-rest"
                />
                <p className="text-xs text-slate-500">Recommended: 8-11 hours for employee wellness</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-200">Auto-Assign Shifts</Label>
                  <p className="text-sm text-slate-400">Automatically assign shifts based on availability</p>
                </div>
                <Switch
                  checked={settings.autoAssign}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAssign: checked }))}
                  data-testid="switch-auto-assign"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="border-white/[0.08] bg-transparent text-slate-300 hover:bg-white/[0.04]" data-testid="button-cancel-settings">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-save-settings">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditAssignmentOpen} onOpenChange={setIsEditAssignmentOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              Edit Shift Assignment
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the employee's shift assignment details
            </DialogDescription>
          </DialogHeader>

          {editingAssignment && (
            <div className="space-y-4 py-4 text-slate-200">
              <div className="space-y-2">
                <Label htmlFor="assignmentEmployee" className="text-slate-300">Employee Name *</Label>
                <Input
                  id="assignmentEmployee"
                  value={editingAssignment.employee}
                  onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, employee: e.target.value } : null)}
                  className="border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                  data-testid="input-assignment-employee"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignmentDepartment" className="text-slate-300">Department *</Label>
                <Select
                  value={editingAssignment.department}
                  onValueChange={(value) => setEditingAssignment(prev => prev ? { ...prev, department: value } : null)}
                >
                  <SelectTrigger className="border-white/[0.08] bg-white/[0.02] text-slate-200 rounded-xl" data-testid="select-assignment-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c1427]/95 border-white/[0.08] text-white">
                    <SelectItem value="Engineering" className="focus:bg-white/[0.04]">Engineering</SelectItem>
                    <SelectItem value="Marketing" className="focus:bg-white/[0.04]">Marketing</SelectItem>
                    <SelectItem value="Sales" className="focus:bg-white/[0.04]">Sales</SelectItem>
                    <SelectItem value="HR" className="focus:bg-white/[0.04]">HR</SelectItem>
                    <SelectItem value="Finance" className="focus:bg-white/[0.04]">Finance</SelectItem>
                    <SelectItem value="Operations" className="focus:bg-white/[0.04]">Operations</SelectItem>
                    <SelectItem value="IT" className="focus:bg-white/[0.04]">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignmentShift" className="text-slate-300">Shift *</Label>
                <Select
                  value={editingAssignment.shiftId?.toString() || ""}
                  onValueChange={(value) => setEditingAssignment(prev => prev ? { ...prev, shiftId: value } : null)}
                >
                  <SelectTrigger className="border-white/[0.08] bg-white/[0.02] text-slate-200 rounded-xl" data-testid="select-assignment-shift">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c1427]/95 border-white/[0.08] text-white">
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id.toString()} className="focus:bg-white/[0.04]">
                        {shift.name} ({formatTime(shift.startTime)} - {formatTime(shift.endTime)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignmentStartDate" className="text-slate-300">Start Date *</Label>
                  <Input
                    id="assignmentStartDate"
                    type="date"
                    value={editingAssignment.startDate}
                    onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                    className="border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                    data-testid="input-assignment-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignmentEndDate" className="text-slate-300">End Date *</Label>
                  <Input
                    id="assignmentEndDate"
                    type="date"
                    value={editingAssignment.endDate}
                    onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                    className="border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                    data-testid="input-assignment-end-date"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditAssignmentOpen(false);
                setEditingAssignment(null);
              }}
              className="border-white/[0.08] bg-transparent text-slate-300 hover:bg-white/[0.04]"
              data-testid="button-cancel-assignment"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-save-assignment">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
