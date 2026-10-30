import { cn } from "@/lib/utils";
import { UserCheck, UserMinus, CalendarCheck, ArrowUpRight, ArrowDownRight, Minus, MoreVertical, Wallet, Receipt, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  total: string | number;
  percentage: number;
  status: "present" | "leave" | "absent";
  sparkline?: "blue" | "orange" | "purple" | "green";
  trendLabel?: string;
}

export function StatCard({ title, value, total, percentage, status, sparkline, trendLabel }: StatCardProps) {
  const formattedPercentage = Math.round(percentage);

  if (sparkline) {
    const getSparklineSvg = () => {
      switch (sparkline) {
        case "blue":
          return (
            <svg className="w-16 h-8 shrink-0" viewBox="0 0 100 40">
              <path d="M0,25 Q15,30 30,10 T60,18 T90,5" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          );
        case "orange":
          return (
            <svg className="w-16 h-8 shrink-0" viewBox="0 0 100 40">
              <path d="M0,35 Q15,30 30,32 T60,25 T80,15 T100,20" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          );
        case "purple":
          return (
            <svg className="w-16 h-8 shrink-0" viewBox="0 0 100 40">
              <path d="M0,25 Q25,15 50,30 T100,10" stroke="#8b5cf6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          );
        case "green":
          return (
            <svg className="w-16 h-8 shrink-0" viewBox="0 0 100 40">
              <path d="M0,30 Q20,20 40,25 T80,10 T100,22" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          );
      }
    };

    const getIcon = () => {
      switch (sparkline) {
        case "blue":
          return <UserCheck className="h-5 w-5 text-blue-400" />;
        case "orange":
          return <Wallet className="h-5 w-5 text-amber-500" />;
        case "purple":
          return <Receipt className="h-5 w-5 text-purple-400" />;
        case "green":
          return <Building2 className="h-5 w-5 text-emerald-400" />;
      }
    };

    const getIconBg = () => {
      switch (sparkline) {
        case "blue":
          return "bg-blue-500/10 border-blue-500/20";
        case "orange":
          return "bg-amber-500/10 border-amber-500/20";
        case "purple":
          return "bg-purple-500/10 border-purple-500/20";
        case "green":
          return "bg-emerald-500/10 border-emerald-500/20";
      }
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="premium-card-glass p-5 relative overflow-hidden flex flex-col justify-between h-[145px] hover:translate-y-[-4px] hover:shadow-xl transition-all duration-300 border border-white/[0.06] rounded-[20px]"
      >
        <div className="flex items-center justify-between z-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</span>
          <MoreVertical className="h-4 w-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
        </div>

        <div className="flex items-center justify-between gap-3 my-2 z-10">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl border flex items-center justify-center shrink-0 shadow-md", getIconBg())}>
              {getIcon()}
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white leading-tight">{value}</span>
              {total && total !== value && (
                <span className="text-[10px] font-bold text-slate-500 mt-0.5">{total}</span>
              )}
            </div>
          </div>
          {getSparklineSvg()}
        </div>

        <div className="flex items-center text-[10px] font-bold text-emerald-400 z-10 mt-1 select-none">
          <ArrowUpRight className="h-3.5 w-3.5 mr-0.5 shrink-0" />
          <span>{trendLabel || `${formattedPercentage}% vs last month`}</span>
        </div>
      </motion.div>
    );
  }

  // Configure icon and colors based on status
  const config = {
    present: {
      icon: <UserCheck className="h-6 w-6" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
      textColor: "text-emerald-400",
      glowClass: "premium-card-border-glow-blue",
      trendIcon: <ArrowUpRight className="h-4 w-4 text-emerald-400 mr-1 shrink-0" />,
      trendLabel: "vs last month"
    },
    leave: {
      icon: <CalendarCheck className="h-6 w-6" />,
      iconBg: "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
      textColor: "text-amber-400",
      glowClass: "premium-card-border-glow-purple",
      trendIcon: <ArrowDownRight className="h-4 w-4 text-amber-400 mr-1 shrink-0" />,
      trendLabel: "vs yesterday"
    },
    absent: {
      icon: <UserMinus className="h-6 w-6" />,
      iconBg: "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
      textColor: "text-rose-400",
      glowClass: "premium-card-border-glow-purple",
      trendIcon: <ArrowUpRight className="h-4 w-4 text-rose-400 mr-1 shrink-0" />,
      trendLabel: "unplanned absence"
    }
  };

  const { icon, iconBg, textColor, glowClass, trendIcon, trendLabel: defaultTrendLabel } = config[status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "premium-card-glass p-6 relative overflow-hidden flex flex-col justify-between h-[155px]"
      )}
    >
      {/* Background soft glow orbs inside the card */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between z-10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
        <div className={cn("p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300", iconBg)}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between z-10">
        <div className="flex items-baseline">
          <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
          {total !== value && (
            <span className="ml-1.5 text-xs font-semibold text-slate-500">/ {total}</span>
          )}
        </div>
        
        <div className="flex items-center text-xs font-bold px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-slate-300">
          {trendIcon}
          <span>{formattedPercentage}%</span>
        </div>
      </div>

      <div className="mt-3 overflow-hidden h-1.5 w-full rounded-full bg-slate-800/40 relative z-10 border border-white/[0.02]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${formattedPercentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className={cn("h-full rounded-full bg-gradient-to-r", 
            status === "present" ? "from-emerald-500 to-teal-400" :
            status === "leave" ? "from-amber-500 to-orange-400" :
            "from-rose-500 to-pink-400"
          )}
        />
      </div>
    </motion.div>
  );
}

