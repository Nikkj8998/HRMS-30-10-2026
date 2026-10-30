import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Clock,
  CalendarCheck,
  Inbox,
  FileBarChart,
  Settings,
  Building2,
  Calendar,
} from "lucide-react";

interface ActionItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  gradient: string;
  shadowColor: string;
  roles?: string[];
}

interface QuickActionsProps {
  cols?: number;
}

export function QuickActions({ cols = 4 }: QuickActionsProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const actions: ActionItem[] = [
    {
      icon: <UserPlus className="h-5.5 w-5.5" />,
      title: "Add Employee",
      description: "Register a new employee",
      path: "/employees",
      gradient: "from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-400 group-hover:border-blue-500/40",
      shadowColor: "rgba(59,130,246,0.15)",
      roles: ["admin", "hr"]
    },
    {
      icon: <Clock className="h-5.5 w-5.5" />,
      title: "Mark Attendance",
      description: "Check-in or check-out",
      path: "/attendance",
      gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40",
      shadowColor: "rgba(16,185,129,0.15)"
    },
    {
      icon: <CalendarCheck className="h-5.5 w-5.5" />,
      title: "Apply Leave",
      description: "Request time off",
      path: "/leave",
      gradient: "from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-400 group-hover:border-indigo-500/40",
      shadowColor: "rgba(99,102,241,0.15)"
    },
    {
      icon: <Inbox className="h-5.5 w-5.5" />,
      title: "Approvals",
      description: "Review pending requests",
      path: "/leave?filter=pending",
      gradient: "from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400 group-hover:border-purple-500/40",
      shadowColor: "rgba(168,85,247,0.15)",
      roles: ["admin", "hr", "manager"]
    },
    {
      icon: <FileBarChart className="h-5.5 w-5.5" />,
      title: "Reports",
      description: "View analytics data",
      path: "/reports/attendance",
      gradient: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400 group-hover:border-amber-500/40",
      shadowColor: "rgba(245,158,11,0.15)",
      roles: ["admin", "hr", "manager"]
    },
    {
      icon: <Building2 className="h-5.5 w-5.5" />,
      title: "Departments",
      description: "Manage departments",
      path: "/departments",
      gradient: "from-cyan-500/10 to-blue-500/10 border-cyan-500/20 text-cyan-400 group-hover:border-cyan-500/40",
      shadowColor: "rgba(6,182,212,0.15)",
      roles: ["admin", "hr"]
    },
    {
      icon: <Calendar className="h-5.5 w-5.5" />,
      title: "Holidays",
      description: "View upcoming holidays",
      path: "/holidays",
      gradient: "from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-400 group-hover:border-rose-500/40",
      shadowColor: "rgba(244,63,94,0.15)"
    },
    {
      icon: <Settings className="h-5.5 w-5.5" />,
      title: "Settings",
      description: "Configure system",
      path: "/settings",
      gradient: "from-slate-500/10 to-zinc-500/10 border-slate-500/20 text-slate-400 group-hover:border-slate-500/40",
      shadowColor: "rgba(100,116,139,0.15)",
      roles: ["admin"]
    }
  ];

  const filteredActions = actions.filter(action => {
    if (!action.roles) return true;
    return user && action.roles.includes(user.role);
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="premium-card-glass p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-5 z-10 relative">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center">
          <span>System Quick Actions</span>
        </h2>
        <div className="h-[1px] flex-grow bg-white/5 ml-4"></div>
      </div>
      
      <motion.div 
        className={cn(
          "grid gap-4 relative z-10",
          cols === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
        )}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filteredActions.map((action, index) => (
          <motion.button
            key={index}
            className={`group flex flex-col items-start p-5 rounded-2xl border bg-slate-950/40 backdrop-blur-md transition-all duration-300 text-left hover:bg-slate-900/60 ${action.gradient}`}
            onClick={() => setLocation(action.path)}
            variants={item}
            whileHover={{ 
              y: -4,
              boxShadow: `0 12px 30px -10px ${action.shadowColor}, 0 4px 15px -3px ${action.shadowColor}`
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 mb-4 transition-all duration-300">
              {action.icon}
            </div>
            <span className="text-[14px] font-extrabold text-white tracking-wide leading-snug">{action.title}</span>
            <span className="text-[11px] text-slate-500 mt-1 leading-normal font-medium">{action.description}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

