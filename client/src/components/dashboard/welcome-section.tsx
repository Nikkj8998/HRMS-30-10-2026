import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Clock, CheckCircle2, UserPlus, CalendarCheck, 
  Inbox, FileBarChart, Building2, Calendar, Settings 
} from "lucide-react";

interface ActionItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  gradient: string;
  roles?: string[];
}

export function WelcomeSection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const today = new Date();
  const currentHour = today.getHours();

  // Determine greeting based on time of day
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good afternoon";
  } else if (currentHour >= 17) {
    greeting = "Good evening";
  }

  // Quick Action items mapping
  const actions: ActionItem[] = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "Add Employee",
      description: "Register new staff member",
      path: "/employees",
      gradient: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300 hover:shadow-blue-500/10",
      roles: ["admin", "hr"]
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Mark Attendance",
      description: "Check-in or check-out",
      path: "/attendance",
      gradient: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300 hover:shadow-emerald-500/10"
    },
    {
      icon: <CalendarCheck className="h-5 w-5" />,
      title: "Apply Leave",
      description: "Request time off",
      path: "/leave",
      gradient: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300 hover:shadow-indigo-500/10"
    },
    {
      icon: <Inbox className="h-5 w-5" />,
      title: "Approvals",
      description: "Review pending requests",
      path: "/leave?filter=pending",
      gradient: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 hover:shadow-purple-500/10",
      roles: ["admin", "hr", "manager"]
    },
    {
      icon: <FileBarChart className="h-5 w-5" />,
      title: "Reports",
      description: "View analytics data",
      path: "/reports/attendance",
      gradient: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300 hover:shadow-amber-500/10",
      roles: ["admin", "hr", "manager"]
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "Departments",
      description: "Manage departments",
      path: "/departments",
      gradient: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300 hover:shadow-cyan-500/10",
      roles: ["admin", "hr"]
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Holidays",
      description: "View upcoming holidays",
      path: "/holidays",
      gradient: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-300 hover:shadow-rose-500/10"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Settings",
      description: "Configure system",
      path: "/settings",
      gradient: "from-slate-500/20 to-zinc-500/20 border-slate-500/30 text-slate-300 hover:shadow-slate-500/10",
      roles: ["admin"]
    }
  ];

  // Filter based on roles
  const filteredActions = actions.filter(action => {
    if (!action.roles) return true;
    return user && action.roles.includes(user.role);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, cubicBezier: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[30px] border border-white/10 premium-hero-mesh text-white shadow-[0_30px_70px_rgba(0,0,0,0.6)] p-6 md:p-8 mb-0"
    >
      {/* Background anim elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-1/2 -left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-extrabold tracking-wider uppercase text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>Welcome back to Cybaem Tech HRMS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight select-none">
            {greeting}, <span className="text-blue-400">{user?.firstName || "Navnath"}</span> 👋
          </h1>
          <p className="text-slate-300 text-sm md:text-base font-semibold">
            Here's what's happening in your organization today.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/40 border border-white/10 text-[11px] font-bold text-slate-300 select-none">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span>{format(today, 'EEEE, MMMM do, yyyy')} • {format(today, 'h:mm a')}</span>
          </div>
        </div>

        {/* Embedded Premium Action Tiles */}
        <div className="flex-1 max-w-2xl w-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {filteredActions.slice(0, 4).map((action, index) => (
              <motion.button
                key={index}
                className={`flex flex-col items-start p-4 rounded-2xl border bg-slate-950/40 backdrop-blur-md transition-all duration-300 text-left hover:bg-slate-900/60 ${action.gradient}`}
                onClick={() => setLocation(action.path)}
                whileHover={{ 
                  y: -4,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 mb-3 shadow-inner text-white">
                  {action.icon}
                </div>
                <span className="text-[13px] font-bold text-white leading-snug">{action.title}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 leading-normal">{action.description}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}