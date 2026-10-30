import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-[104px] h-8 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]" />
    );
  }

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
    { value: "dark", label: "Dark", icon: Moon }
  ];

  return (
    <div className="relative flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] shadow-inner transition-all duration-300">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "relative z-10 flex items-center justify-center w-8 h-7 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 focus:outline-none",
              isActive && "text-blue-600 dark:text-white"
            )}
            title={`${opt.label} Mode`}
          >
            <Icon className="h-3.5 w-3.5" />
            {isActive && (
              <motion.div
                layoutId="activeThemeHighlight"
                className="absolute inset-0 -z-10 rounded-full bg-white dark:bg-blue-600 shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-slate-200/50 dark:border-blue-400/20"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
