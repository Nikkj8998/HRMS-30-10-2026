import React from "react";
import { LeaveRequest, User, Department } from "@shared/schema";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  UserCheck, 
  ShieldCheck, 
  Send, 
  BellRing,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeaveJourneyTrackerProps {
  request: LeaveRequest;
  employee?: User | null;
  department?: Department | null;
  lineManager?: User | null;
  hod?: User | null;
  lineManagerApprover?: User | null;
  hodApprover?: User | null;
  rejectedByUser?: User | null;
  variant?: "compact" | "full";
}

export function LeaveJourneyTracker({
  request,
  employee,
  department,
  lineManager,
  hod,
  lineManagerApprover,
  hodApprover,
  rejectedByUser,
  variant = "full",
}: LeaveJourneyTrackerProps) {
  const isRejected = request.status === "rejected";
  const isApproved = request.status === "approved" || request.approvalStage === "completed";
  const stage = request.approvalStage || (isApproved ? "completed" : isRejected ? "rejected" : "line_manager");

  // Step 1: Employee Submission
  const step1 = {
    title: "Employee",
    subtitle: employee ? `${employee.firstName} ${employee.lastName}` : "Employee",
    role: "Requested Leave",
    date: request.createdAt ? format(new Date(request.createdAt), "MMM d, hh:mm a") : null,
    status: "completed" as const,
  };

  // Step 2: Line Manager (Department Manager) - Approval #1
  const lmName = lineManagerApprover 
    ? `${lineManagerApprover.firstName} ${lineManagerApprover.lastName}`
    : lineManager 
      ? `${lineManager.firstName} ${lineManager.lastName}` 
      : "Department Manager";

  const isLMApproved = !!request.lineManagerApprovedById || stage === "hod" || isApproved;
  const isLMRejected = isRejected && request.rejectionStage === "line_manager";
  const isLMCurrent = stage === "line_manager" && !isRejected;

  const step2 = {
    title: "Line Manager",
    subtitle: lmName,
    role: "Approval #1",
    date: request.lineManagerApprovedAt ? format(new Date(request.lineManagerApprovedAt), "MMM d, hh:mm a") : null,
    status: isLMApproved ? ("completed" as const) : isLMRejected ? ("rejected" as const) : isLMCurrent ? ("current" as const) : ("pending" as const),
    comments: request.lineManagerComments,
  };

  // Step 3: HOD (Head of Department) - Approval #2
  const hodName = hodApprover 
    ? `${hodApprover.firstName} ${hodApprover.lastName}`
    : hod 
      ? `${hod.firstName} ${hod.lastName}` 
      : "Head of Dept";

  const isHODApproved = !!request.hodApprovedById || isApproved;
  const isHODRejected = isRejected && request.rejectionStage === "hod";
  const isHODCurrent = stage === "hod" && !isRejected;

  const step3 = {
    title: "HOD",
    subtitle: hodName,
    role: "Approval #2",
    date: request.hodApprovedAt ? format(new Date(request.hodApprovedAt), "MMM d, hh:mm a") : null,
    status: isHODApproved ? ("completed" as const) : isHODRejected ? ("rejected" as const) : isHODCurrent ? ("current" as const) : ("pending" as const),
    comments: request.hodComments,
  };

  // Step 4: HR Intimation
  const isHRIntimated = isApproved || !!request.hrIntimatedAt;
  const step4 = {
    title: "HR Team",
    subtitle: "Payroll & Records",
    role: "Intimation",
    date: request.hrIntimatedAt ? format(new Date(request.hrIntimatedAt), "MMM d, hh:mm a") : null,
    status: isHRIntimated ? ("completed" as const) : ("pending" as const),
  };

  // Step 5: End of Journey
  const step5 = {
    title: isRejected ? "Rejected" : isApproved ? "Complete" : "In Progress",
    subtitle: isRejected ? "End of Journey" : isApproved ? "Leave Granted" : "Awaiting Approvals",
    role: "End of Journey",
    status: isRejected ? ("rejected" as const) : isApproved ? ("completed" as const) : ("pending" as const),
  };

  const steps = [step1, step2, step3, step4, step5];

  if (variant === "compact") {
    return (
      <div className="py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-350 uppercase tracking-wider">Leave Approval Path</span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] font-bold px-2 py-0 h-4 border",
              isApproved && "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
              isRejected && "bg-rose-500/10 text-rose-300 border-rose-500/30",
              stage === "line_manager" && "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse",
              stage === "hod" && "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 animate-pulse"
            )}
          >
            {isApproved ? "Journey Complete" : isRejected ? "Rejected" : stage === "line_manager" ? "Stage 1: Line Manager" : "Stage 2: HOD"}
          </Badge>
        </div>

        {/* Compact visual stepper line */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
          {/* Step 1 */}
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Applied</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* Step 2: Line Manager */}
          <div className={cn(
            "flex items-center gap-1 font-medium",
            isLMApproved && "text-emerald-400",
            isLMCurrent && "text-amber-400 font-bold",
            isLMRejected && "text-rose-400",
            !isLMApproved && !isLMCurrent && !isLMRejected && "text-slate-500"
          )}>
            {isLMApproved ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> :
             isLMRejected ? <XCircle className="w-3.5 h-3.5 shrink-0" /> :
             isLMCurrent ? <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" /> :
             <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />}
            <span title={`Line Manager: ${lmName}`}>LM (#1)</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* Step 3: HOD */}
          <div className={cn(
            "flex items-center gap-1 font-medium",
            isHODApproved && "text-emerald-400",
            isHODCurrent && "text-indigo-400 font-bold",
            isHODRejected && "text-rose-400",
            !isHODApproved && !isHODCurrent && !isHODRejected && "text-slate-500"
          )}>
            {isHODApproved ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> :
             isHODRejected ? <XCircle className="w-3.5 h-3.5 shrink-0" /> :
             isHODCurrent ? <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" /> :
             <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />}
            <span title={`HOD: ${hodName}`}>HOD (#2)</span>
          </div>
          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />

          {/* Step 4: HR Intimated */}
          <div className={cn(
            "flex items-center gap-1 font-medium",
            isHRIntimated && "text-teal-400",
            !isHRIntimated && "text-slate-500"
          )}>
            {isHRIntimated ? <BellRing className="w-3.5 h-3.5 shrink-0" /> :
             <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />}
            <span>HR Intimated</span>
          </div>
        </div>
      </div>
    );
  }

  // Full detailed visual tracker (for View Details dialog)
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            Approval Journey & Audit Trail
          </h4>
          <p className="text-xs text-slate-400">
            Path: Employee → Line Manager (#1) → HOD (#2) → HR Intimation → Complete
          </p>
        </div>
        <Badge
          className={cn(
            "font-bold text-xs px-2.5 py-1 border",
            isApproved && "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
            isRejected && "bg-rose-500/10 text-rose-300 border-rose-500/30",
            stage === "line_manager" && "bg-amber-500/10 text-amber-300 border-amber-500/30",
            stage === "hod" && "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
          )}
        >
          {isApproved ? "✓ Fully Approved" : isRejected ? "✕ Rejected" : stage === "line_manager" ? "Stage 1: Line Manager Review" : "Stage 2: HOD Review"}
        </Badge>
      </div>

      <div className="relative pl-6 border-l-2 border-white/[0.1] space-y-6 my-2">
        {/* Step 1: Employee */}
        <div className="relative">
          <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">1. Leave Request Submitted</span>
              {step1.date && <span className="text-[11px] text-slate-400">{step1.date}</span>}
            </div>
            <p className="text-sm font-semibold text-white">{step1.subtitle}</p>
            <p className="text-xs text-slate-400">{department ? department.name : "Department"}</p>
          </div>
        </div>

        {/* Step 2: Line Manager (Approval #1) */}
        <div className="relative">
          <div className={cn(
            "absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center",
            isLMApproved && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
            isLMRejected && "bg-rose-500/20 border-rose-500 text-rose-400",
            isLMCurrent && "bg-amber-500/20 border-amber-500 text-amber-400 animate-pulse",
            !isLMApproved && !isLMRejected && !isLMCurrent && "bg-white/[0.04] border-slate-600 text-slate-500"
          )}>
            {isLMApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> :
             isLMRejected ? <XCircle className="w-3.5 h-3.5" /> :
             isLMCurrent ? <Clock className="w-3.5 h-3.5" /> :
             <UserCheck className="w-3 h-3" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-bold",
                isLMApproved && "text-emerald-300",
                isLMRejected && "text-rose-300",
                isLMCurrent && "text-amber-300",
                !isLMApproved && !isLMRejected && !isLMCurrent && "text-slate-400"
              )}>
                2. Line Manager (Department Manager) - Approval #1
              </span>
              {step2.date && <span className="text-[11px] text-slate-400">{step2.date}</span>}
            </div>
            <p className="text-sm font-semibold text-white">{step2.subtitle}</p>
            <p className="text-xs text-slate-400">
              {isLMApproved ? "✓ Approved & forwarded to HOD" :
               isLMRejected ? "✕ Rejected by Line Manager" :
               isLMCurrent ? "⏳ Currently reviewing request" : "Pending prior review"}
            </p>
            {step2.comments && (
              <p className="text-xs italic bg-white/[0.03] p-2 rounded border border-white/[0.06] text-slate-300 mt-1">
                "{step2.comments}"
              </p>
            )}
          </div>
        </div>

        {/* Step 3: HOD (Approval #2) */}
        <div className="relative">
          <div className={cn(
            "absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center",
            isHODApproved && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
            isHODRejected && "bg-rose-500/20 border-rose-500 text-rose-400",
            isHODCurrent && "bg-indigo-500/20 border-indigo-500 text-indigo-400 animate-pulse",
            !isHODApproved && !isHODRejected && !isHODCurrent && "bg-white/[0.04] border-slate-600 text-slate-500"
          )}>
            {isHODApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> :
             isHODRejected ? <XCircle className="w-3.5 h-3.5" /> :
             isHODCurrent ? <Clock className="w-3.5 h-3.5" /> :
             <ShieldCheck className="w-3 h-3" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-bold",
                isHODApproved && "text-emerald-300",
                isHODRejected && "text-rose-300",
                isHODCurrent && "text-indigo-300",
                !isHODApproved && !isHODRejected && !isHODCurrent && "text-slate-400"
              )}>
                3. Head of Department (HOD) - Approval #2
              </span>
              {step3.date && <span className="text-[11px] text-slate-400">{step3.date}</span>}
            </div>
            <p className="text-sm font-semibold text-white">{step3.subtitle}</p>
            <p className="text-xs text-slate-400">
              {isHODApproved ? "✓ Final approval granted" :
               isHODRejected ? "✕ Rejected by HOD" :
               isHODCurrent ? "⏳ Awaiting HOD final decision" : "Waiting for Line Manager approval"}
            </p>
            {step3.comments && (
              <p className="text-xs italic bg-white/[0.03] p-2 rounded border border-white/[0.06] text-slate-300 mt-1">
                "{step3.comments}"
              </p>
            )}
          </div>
        </div>

        {/* Step 4: HR Intimation */}
        <div className="relative">
          <div className={cn(
            "absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center",
            isHRIntimated && "bg-teal-500/20 border-teal-500 text-teal-400",
            !isHRIntimated && "bg-white/[0.04] border-slate-600 text-slate-500"
          )}>
            <BellRing className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-bold", isHRIntimated ? "text-teal-300" : "text-slate-400")}>
                4. HR Intimation
              </span>
              {step4.date && <span className="text-[11px] text-slate-400">{step4.date}</span>}
            </div>
            <p className="text-sm font-semibold text-white">HR Department</p>
            <p className="text-xs text-slate-400">
              {isHRIntimated ? "✓ Leave approval intimated to HR team for payroll & attendance records" : "Intimation will trigger automatically upon HOD approval"}
            </p>
          </div>
        </div>

        {/* Step 5: End of Journey */}
        <div className="relative">
          <div className={cn(
            "absolute -left-[31px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center",
            isApproved && "bg-emerald-500/20 border-emerald-500 text-emerald-400",
            isRejected && "bg-rose-500/20 border-rose-500 text-rose-400",
            !isApproved && !isRejected && "bg-white/[0.04] border-slate-600 text-slate-500"
          )}>
            {isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> :
             isRejected ? <XCircle className="w-3.5 h-3.5" /> :
             <Clock className="w-3.5 h-3.5" />}
          </div>
          <div className="space-y-0.5">
            <span className={cn(
              "text-xs font-bold",
              isApproved && "text-emerald-300",
              isRejected && "text-rose-300",
              !isApproved && !isRejected && "text-slate-400"
            )}>
              5. End of Journey
            </span>
            <p className="text-xs text-slate-400">
              {isApproved ? "Leave cycle completed and employee calendar updated." :
               isRejected ? "Request was rejected. Workflow ended." :
               "Workflow in progress through approval checkpoints."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

