import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeaveRequest } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { getInitials, cn } from "@/lib/utils";
import { User } from "@shared/schema";

interface PendingApprovalsProps {
  pendingRequests?: LeaveRequest[];
  isPersonalView?: boolean;
}

export function PendingApprovals({ pendingRequests = [], isPersonalView = false }: PendingApprovalsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch all employees to display names
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });
  
  // Approve leave request
  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("PUT", `/api/leave-requests/${requestId}`, {
        status: "approved",
        approvedById: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      // Invalidate leave balance since approvals affect balances
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      toast({
        title: "Request approved",
        description: "The leave request has been approved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to approve request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Reject leave request
  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("PUT", `/api/leave-requests/${requestId}`, {
        status: "rejected",
        approvedById: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      // Invalidate leave balance since rejections affect balances
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      toast({
        title: "Request rejected",
        description: "The leave request has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to reject request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Get user info by ID
  const getUserById = (userId: number) => {
    return employees.find(emp => emp.id === userId);
  };
  
  // Format date range
  const formatDateRange = (start: string, end: string) => {
    try {
      if (!start) return 'N/A';
      const startDate = new Date(start);
      if (isNaN(startDate.getTime())) return start;
      if (!end || start === end) {
        return format(startDate, 'MMM d, yyyy');
      }
      const endDate = new Date(end);
      if (isNaN(endDate.getTime())) return start;
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    } catch {
      return `${start} - ${end}`;
    }
  };
  
  // Get leave type display
  const getLeaveTypeDisplay = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const mockActivities = [
    {
      id: 101,
      name: "Priya Sharma",
      action: "Applied for Casual Leave",
      time: "10:30 AM",
      status: "Pending",
      initials: "PS",
      badgeClass: "bg-amber-500/10 border-amber-500/30 text-amber-400 border"
    },
    {
      id: 102,
      name: "Aman Verma",
      action: "Check-in at 09:15 AM",
      time: "09:15 AM",
      status: "Present",
      initials: "AV",
      badgeClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 border"
    },
    {
      id: 103,
      name: "Rohit Singh",
      action: "Submitted Expense Report",
      time: "Yesterday",
      status: "Submitted",
      initials: "RS",
      badgeClass: "bg-purple-500/10 border-purple-500/30 text-purple-400 border"
    }
  ];

  const itemsToRender = pendingRequests.length > 0 
    ? pendingRequests.slice(0, 3).map(r => {
        const u = getUserById(r.userId);
        return {
          id: r.id,
          name: u ? `${u.firstName} ${u.lastName}` : `User ${r.userId}`,
          action: `Requested ${r.type} leave (${formatDateRange(r.startDate, r.endDate)})`,
          time: format(new Date(r.startDate), 'MMM d'),
          status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending',
          initials: u ? getInitials(u.firstName, u.lastName) : 'U',
          badgeClass: r.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 border' :
                      r.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 border' :
                      'bg-amber-500/10 border-amber-500/30 text-amber-400 border',
          isReal: true,
          rawRequest: r
        };
      })
    : mockActivities;

  return (
    <div className="premium-card-glass flex flex-col justify-between border border-white/[0.06] rounded-[20px] p-5 h-[270px]">
      <div className="pb-3 border-b border-white/[0.08] flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {isPersonalView ? "My Leave Requests" : "Recent Activity"}
        </h2>
        <Button 
          variant="link" 
          className="text-blue-400 hover:text-blue-300 p-0 font-extrabold text-[10px] tracking-wide"
          onClick={() => {
            window.location.href = isPersonalView ? "/leave" : "/leave?filter=pending";
          }}
        >
          View All
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col justify-between py-2 divide-y divide-white/[0.04]">
        {itemsToRender.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <div className="flex items-center min-w-0">
              <Avatar className="h-8.5 w-8.5 border border-white/10 shadow-sm shrink-0">
                <AvatarFallback className="bg-blue-950 text-blue-300 text-[10px] font-black">
                  {item.initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-2.5 min-w-0">
                <p className="text-[11px] font-extrabold text-white truncate leading-tight">
                  {item.name}
                </p>
                <p className="text-[9px] text-slate-400 truncate mt-0.5 font-medium leading-none">
                  {item.action}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 ml-3">
              <span className="text-[8px] font-bold text-slate-500 mb-1">{item.time}</span>
              <span className={cn(
                "text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider leading-none",
                item.badgeClass
              )}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
