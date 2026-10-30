import { ReactNode } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Users } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  autoHeight?: boolean;
}

export function AppLayout({ children, autoHeight = false }: AppLayoutProps) {
  const { collapsed } = useSidebar();

  const navigation = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Building2, label: "Master Data", href: "/master-data" },
    { icon: Users, label: "Employees", href: "/employees" },
  ];

  return (
    <div className={cn("flex bg-background text-foreground dashboard-mesh-bg", autoHeight ? "min-h-screen overflow-hidden" : "h-screen overflow-hidden")}>
      <Sidebar />
      
      <div className={cn("flex flex-col flex-1 min-w-0 transition-all duration-300", collapsed ? "lg:ml-20" : "lg:ml-72", autoHeight ? "" : "overflow-hidden")}>
        <Header />
        
        <main className={cn(autoHeight ? "h-auto overflow-visible" : "flex-1 overflow-y-auto", "p-4 md:p-6 lg:p-8")}>
          {children}
        </main>

        {/* Footer */}
        <footer className="p-4 border-t border-border text-center text-xs text-muted-foreground bg-card/30 backdrop-blur-sm">
          Powered by <a href="https://www.cybaemtech.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Cybaem Tech</a>
        </footer>
      </div>
    </div>
  );
}
