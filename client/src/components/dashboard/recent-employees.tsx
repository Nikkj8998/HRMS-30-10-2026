import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Department } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { useLocation } from "wouter";

interface RecentEmployeesProps {
  employees: User[];
  departments: Department[];
}

export function RecentEmployees({ employees, departments }: RecentEmployeesProps) {
  const [, setLocation] = useLocation();
  
  // Helper to get department name by ID
  const getDepartmentName = (departmentId: number | null | undefined) => {
    if (!departmentId) return "Unassigned";
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : "Unassigned";
  };
  
  // Helper to get status badge
  const getStatusBadge = (isActive: boolean | null) => {
    return isActive === true ? (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wide">Active</span>
    ) : (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-wide">Inactive</span>
    );
  };
  
  const handleViewAllEmployees = () => {
    setLocation("/employees");
  };
  
  const handleEditEmployee = (id: number) => {
    setLocation(`/employees?edit=${id}`);
  };

  return (
    <div className="premium-card-glass overflow-hidden">
      <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Recent Employees</h2>
        <Button 
          variant="link" 
          className="text-blue-400 hover:text-blue-300 p-0 font-bold text-xs"
          onClick={handleViewAllEmployees}
        >
          View All Employees
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.06] text-sm text-left">
          <thead className="bg-slate-950/40 text-slate-400 border-b border-white/[0.08]">
            <tr>
              <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-none">
                Employee
              </th>
              <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-none">
                Department
              </th>
              <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-none">
                Position
              </th>
              <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-none">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 border-none">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-white/[0.02] transition-colors duration-300">
                  <td className="px-6 py-4 whitespace-nowrap border-none">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 border border-white/10 shadow-md">
                        <AvatarImage src="#" alt={`${employee.firstName} ${employee.lastName}`} />
                        <AvatarFallback className="bg-blue-900/50 text-blue-300 text-xs font-bold">
                          {getInitials(employee.firstName, employee.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-white leading-snug">{`${employee.firstName} ${employee.lastName}`}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-none text-slate-300">
                    <div className="text-sm font-semibold">{getDepartmentName(employee.departmentId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-none text-slate-300">
                    <div className="text-sm font-semibold">{employee.position || "Not specified"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-none">
                    {getStatusBadge(employee.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium border-none">
                    <Button 
                      variant="link" 
                      className="text-blue-400 hover:text-blue-300 p-0 font-bold text-xs"
                      onClick={() => handleEditEmployee(employee.id)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
