import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  LayoutDashboard, Users, Building2, ShieldCheck, Clock,
  CalendarCheck, CalendarClock, FileBarChart, FileSpreadsheet,
  LogOut, ChevronRight, ChevronLeft, ChevronDown, DollarSign, Settings,
  Target, GraduationCap, Briefcase, Car, Package, FileText, Scale,
  UserCheck, BarChart3, Wallet, Receipt, TrendingUp, Award,
  BookOpen, Calendar, ClipboardList, FileCheck, Truck, Box,
  FileSignature, AlertTriangle, Calculator, FileArchive, Download,
  ShieldAlert, Settings2, Play, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { hasAnyPermission } from "@/lib/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  permissions?: string[];
};

type SectionStatus = 'C' | 'WIP' | 'TBD';

type NavSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  items: NavItem[];
  permissions?: string[];
  adminOnly?: boolean;
  status?: SectionStatus;
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();
  const { user, logoutMutation } = useAuth();
  const { organizationName } = useOrganization();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-open-sections');
    return saved ? JSON.parse(saved) : {};
  });

  // Ref to preserve sidebar scroll position when navigating
  const navRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const previousLocationRef = useRef<string>(location);

  useEffect(() => {
    localStorage.setItem('sidebar-open-sections', JSON.stringify(openSections));
  }, [openSections]);

  // Save scroll position on every scroll event to capture the latest position
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const handleScroll = () => {
      sessionStorage.setItem('sidebar-scroll-position', navElement.scrollTop.toString());
    };

    navElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => navElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position on mount & whenever openSections or location changes
  useLayoutEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const savedScroll = sessionStorage.getItem('sidebar-scroll-position');
    if (savedScroll) {
      const scrollPos = parseInt(savedScroll, 10);
      navElement.scrollTop = scrollPos;

      const timer = setTimeout(() => {
        if (navRef.current) {
          navRef.current.scrollTop = scrollPos;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location, openSections]);

  const toggleSection = (sectionId: string) => {
    // No-op for scroll preservation - the browser and our effects already handle this
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isSuperAdmin = user?.role === 'developer' || user?.role === 'admin';
  const isAdminRole = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  const isDeveloper = user?.role === 'developer';

  const developerNavSections: NavSection[] = [
    {
      id: "developer",
      title: "Developer",
      icon: <Settings className="h-5 w-5" />,
      defaultOpen: true,
      items: [
        { title: "System Settings", href: "/developer/system-settings", icon: <Settings className="h-4 w-4" /> },
        { title: "Employee Limit", href: "/developer/employee-limit", icon: <Users className="h-4 w-4" /> }
      ]
    }
  ];

  const navSections: NavSection[] = [
    {
      id: "master-data",
      title: "Administration",
      icon: <Settings2 className="h-5 w-5" />,
      defaultOpen: true,
      status: "TBD" as SectionStatus,
      items: [
        { title: "Master Data", href: "/master-data", icon: <Settings className="h-4 w-4" /> },
        { title: "System Settings", href: "/developer/system-settings", icon: <Settings className="h-4 w-4" /> },
        { title: "Employee Limit", href: "/developer/employee-limit", icon: <ShieldAlert className="h-4 w-4" /> }
      ]
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      defaultOpen: true,
      status: "WIP" as SectionStatus,
      items: [
        { title: "Overview", href: "/", icon: <LayoutDashboard className="h-4 w-4" /> }
      ]
    },
    {
      id: "employee-management",
      title: "Employee Management",
      icon: <Users className="h-5 w-5" />,
      defaultOpen: true,
      status: "C" as SectionStatus,
      items: [
        { title: "Employees", href: "/employees", icon: <Users className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Departments", href: "/departments", icon: <Building2 className="h-4 w-4" />, permissions: ["departments.view"] },
        { title: "Roles & Permissions", href: "/roles", icon: <ShieldCheck className="h-4 w-4" />, permissions: ["roles.view"] },
        { title: "Document Management", href: "/documents", icon: <FileArchive className="h-4 w-4" />, permissions: ["employees.view"] }
      ]
    },
    {
      id: "attendance-leave",
      title: "Attendance & Leave",
      icon: <Clock className="h-5 w-5" />,
      defaultOpen: true,
      status: "C" as SectionStatus,
      items: [
        { title: "Attendance", href: "/attendance", icon: <Clock className="h-4 w-4" />, permissions: ["attendance.view"] },
        { title: "Leave Management", href: "/leave", icon: <CalendarCheck className="h-4 w-4" />, permissions: ["leave.view"] },
        { title: "Holidays", href: "/holidays", icon: <CalendarClock className="h-4 w-4" /> },
        { title: "Shift Management", href: "/shifts", icon: <Calendar className="h-4 w-4" />, permissions: ["attendance.view"] }
      ]
    },
    {
      id: "payroll",
      title: "Payroll Management",
      icon: <DollarSign className="h-5 w-5" />,
      status: "C" as SectionStatus,
      items: [
        { title: "Payroll Dashboard", href: "/payroll", icon: <Wallet className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Salary Structure", href: "/payroll/structure", icon: <Receipt className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Payslip Generation", href: "/payroll/payslips", icon: <FileText className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Bank Transfers", href: "/payroll/transfers", icon: <DollarSign className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "My Payslips", href: "/self-service/payslips", icon: <FileText className="h-4 w-4" />, permissions: ["payroll.view_own"] }
      ]
    },
    {
      id: "recruitment",
      title: "Recruitment & Onboarding",
      icon: <Briefcase className="h-5 w-5" />,
      adminOnly: true,
      status: "TBD" as SectionStatus,
      items: [
        { title: "Offer Letters", href: "/recruitment/offers", icon: <FileSignature className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Digital Joining", href: "/recruitment/joining", icon: <UserCheck className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Document Portal", href: "/recruitment/documents", icon: <FileArchive className="h-4 w-4" />, permissions: ["employees.view"] }
      ]
    },
    {
      id: "performance",
      title: "Performance Management",
      icon: <Target className="h-5 w-5" />,
      status: "TBD" as SectionStatus,
      items: [
        { title: "Goals & KPIs", href: "/performance/goals", icon: <Target className="h-4 w-4" /> },
        { title: "Appraisals", href: "/performance/appraisals", icon: <TrendingUp className="h-4 w-4" /> },
        { title: "360° Feedback", href: "/performance/feedback", icon: <Award className="h-4 w-4" /> },
        { title: "Performance Reports", href: "/performance/reports", icon: <BarChart3 className="h-4 w-4" /> }
      ]
    },
    {
      id: "training",
      title: "Training & Development",
      icon: <GraduationCap className="h-5 w-5" />,
      status: "TBD" as SectionStatus,
      items: [
        { title: "Training Calendar", href: "/training/calendar", icon: <Calendar className="h-4 w-4" /> },
        { title: "Skill Matrix", href: "/training/skills", icon: <ClipboardList className="h-4 w-4" /> },
        { title: "Certifications", href: "/training/certifications", icon: <Award className="h-4 w-4" /> },
        { title: "Training Requests", href: "/training/requests", icon: <BookOpen className="h-4 w-4" /> }
      ]
    },
    {
      id: "expense",
      title: "Expense & Travel",
      icon: <Car className="h-5 w-5" />,
      status: "TBD" as SectionStatus,
      items: [
        { title: "Expense Claims", href: "/expense/claims", icon: <Receipt className="h-4 w-4" /> },
        { title: "Travel Requests", href: "/expense/travel", icon: <Truck className="h-4 w-4" /> },
        { title: "Reimbursements", href: "/expense/reimbursements", icon: <Wallet className="h-4 w-4" /> }
      ]
    },
    {
      id: "assets",
      title: "Asset Management",
      icon: <Package className="h-5 w-5" />,
      adminOnly: true,
      status: "TBD" as SectionStatus,
      items: [
        { title: "Asset Allocation", href: "/assets/allocation", icon: <Box className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Asset Tracking", href: "/assets/tracking", icon: <Package className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Asset Returns", href: "/assets/returns", icon: <FileCheck className="h-4 w-4" />, permissions: ["employees.view"] }
      ]
    },
    {
      id: "letters",
      title: "HR Letters & Documents",
      icon: <FileText className="h-5 w-5" />,
      adminOnly: true,
      status: "TBD" as SectionStatus,
      items: [
        { title: "Appointment Letters", href: "/letters/appointment", icon: <FileSignature className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Increment Letters", href: "/letters/increment", icon: <TrendingUp className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Warning Letters", href: "/letters/warning", icon: <AlertTriangle className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Experience Letters", href: "/letters/experience", icon: <Award className="h-4 w-4" />, permissions: ["employees.view"] }
      ]
    },
    {
      id: "self-service",
      title: "Self Service",
      icon: <UserCheck className="h-5 w-5" />,
      status: "TBD" as SectionStatus,
      items: [
        { title: "My Profile", href: "/self-service/profile", icon: <Users className="h-4 w-4" /> },
        { title: "My Payslips", href: "/self-service/payslips", icon: <FileText className="h-4 w-4" /> },
        { title: "My Documents", href: "/self-service/documents", icon: <Download className="h-4 w-4" /> },
        { title: "My Attendance", href: "/self-service/attendance", icon: <Clock className="h-4 w-4" /> }
      ]
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      adminOnly: true,
      status: "C" as SectionStatus,
      items: [
        { title: "Attendance Reports", href: "/reports/attendance", icon: <FileBarChart className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Leave Reports", href: "/reports/leave", icon: <FileSpreadsheet className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Payroll Reports", href: "/reports/payroll", icon: <DollarSign className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Muster Roll - Form II", href: "/reports/muster-roll", icon: <ClipboardList className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Leave Register - Form 20", href: "/reports/leave-register", icon: <BookOpen className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Provident Fund", href: "/compliance/pf", icon: <Shield className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Employees' State Insurance", href: "/compliance/esi", icon: <Building2 className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Professional Tax", href: "/compliance/pt", icon: <Calculator className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Maharashtra Labour Welfare Fund", href: "/compliance/mlwf", icon: <Shield className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Bonus Reports", href: "/compliance/bonus-reports", icon: <FileSpreadsheet className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Form 16", href: "/compliance/form16-tds", icon: <FileText className="h-4 w-4" />, permissions: ["payroll.view"] }
      ]
    }
  ];

  const sectionsToUse = isDeveloper ? developerNavSections : navSections;

  const filteredSections = sectionsToUse
    .filter(section => {
      if (section.id === "master-data") return isSuperAdmin;
      if (section.adminOnly && !isAdminRole) return false;
      if (section.permissions) {
        return hasAnyPermission(user, section.permissions);
      }
      return true;
    })
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.permissions || item.permissions.length === 0) return true;
        return hasAnyPermission(user, item.permissions);
      })
    }))
    .filter(section => section.items.length > 0);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (user: User) => {
    const f = user?.firstName?.charAt(0) ?? '';
    const l = user?.lastName?.charAt(0) ?? '';
    return `${f}${l}`.toUpperCase() || '?';
  };

  const isSectionActive = (section: NavSection) => {
    return section.items.some(item => location === item.href || location.startsWith(item.href + '/'));
  };

  const StatusBadge = ({ status }: { status?: SectionStatus }) => {
    if (!status) return null;
    const styles: Record<SectionStatus, string> = {
      C: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      WIP: "bg-amber-100 text-amber-700 border border-amber-200",
      TBD: "bg-slate-100 text-slate-500 border border-slate-200",
    };
    return (
      <span className={cn("text-[9px] font-bold px-1 py-0.5 rounded leading-none shrink-0", styles[status])}>
        ({status})
      </span>
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 lg:hidden",
          !collapsed ? "block" : "hidden"
        )}
        onClick={() => toggleSidebar()}
      />

      <aside
        className={cn(
          "fixed z-50 flex flex-col border-r border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0c1427]/95 text-slate-700 dark:text-slate-200 transition-all duration-300 ease-in-out shadow-lg dark:shadow-[10px_0_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl",
          "top-0 bottom-0 left-0 h-screen rounded-none",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "translate-x-0 w-72",
          className
        )}
      >
        <div className={cn(
          "flex items-center border-b border-slate-200 dark:border-white/[0.08] transition-all duration-300",
          collapsed ? "justify-center py-4 px-2" : "justify-between px-5 py-4"
        )}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => toggleSidebar()}
                className="w-12 h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center border border-white/10 shadow-md hover:scale-105 transition-all"
                title="Expand Sidebar"
                data-testid="button-sidebar-expand"
              >
                <img
                  src={`${import.meta.env.BASE_URL}favicon.png`}
                  alt="Favicon"
                  className="w-8 h-8 object-contain"
                />
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-start pl-1">
                <div className="w-44 h-11 flex items-center justify-start">
                  <img
                    src={`${import.meta.env.BASE_URL}images/img.png`}
                    alt="logo"
                    className="w-full h-full object-contain object-left filter brightness-110"
                  />
                </div>
              </div>
              <Button
                onClick={() => toggleSidebar()}
                variant="ghost"
                size="icon"
                className="hidden lg:flex text-slate-400 hover:text-white hover:bg-white/5"
                data-testid="button-sidebar-toggle"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        <nav ref={navRef} className="flex-1 py-4 overflow-y-auto sidebar-scrollbar px-3 space-y-1">
          {filteredSections.map((section) => {
            const isOpen = openSections[section.id] ?? section.defaultOpen ?? false;
            const isActive = isSectionActive(section);

            return (
              <div key={section.id} className="mb-2">
                {collapsed ? (
                  <div className="flex flex-col items-center gap-1">
                    {section.items.slice(0, 1).map((item, j) => (
                      <Link
                        key={j}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300",
                          location === item.href
                            ? "bg-blue-50 dark:bg-gradient-to-r dark:from-blue-500/20 dark:to-purple-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                            : "text-slate-450 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/[0.04] dark:hover:text-white"
                        )}
                        data-testid={`link-${section.id}`}
                      >
                        {section.icon}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                    <CollapsibleTrigger
                      className={cn(
                        "flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 hover:translate-x-0.5",
                        isActive
                          ? "bg-blue-50/50 dark:bg-gradient-to-r dark:from-blue-500/10 dark:to-purple-500/10 !text-blue-600 dark:!text-blue-400 border-l-2 border-blue-500 shadow-sm dark:shadow-[0_0_12px_rgba(59,130,246,0.12)]"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/[0.03] dark:hover:text-white"
                      )}
                      data-testid={`button-section-${section.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("shrink-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500")} >
                          {section.icon}
                        </div>
                        <span className={cn("text-sm font-semibold truncate tracking-wide", isActive ? "!text-blue-600 dark:!text-blue-400 font-bold" : "text-slate-700 dark:text-slate-300")}>{section.title}</span>
                        <StatusBadge status={section.status} />
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-slate-500 transition-transform duration-200",
                          isOpen && "rotate-180 text-slate-700 dark:text-slate-300"
                        )}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1 ml-3 border-l border-slate-200 dark:border-white/[0.06] pl-2 space-y-0.5">
                      {section.items.map((item, j) => {
                        const isItemActive = location === item.href;
                        return (
                          <Link
                            key={j}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 text-xs rounded-lg transition-all duration-300 hover:translate-x-1",
                              isItemActive
                                ? "bg-blue-50 dark:bg-blue-500/20 !text-blue-600 dark:!text-blue-400 font-bold border-l-2 border-blue-500 dark:border-blue-400 shadow-sm dark:shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/[0.02] dark:hover:text-white"
                            )}
                            data-testid={`link-${item.href.replace(/\//g, '-').slice(1)}`}
                          >
                            <div className={cn(
                              "flex-shrink-0",
                              isItemActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500"
                            )}>
                              {item.icon}
                            </div>
                            <span className={cn("flex-1 truncate tracking-wide font-medium", isItemActive ? "!text-blue-600 dark:!text-blue-400 font-bold" : "text-slate-500 dark:text-slate-400")}>{item.title}</span>
                            <StatusBadge status={section.status} />
                          </Link>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 border border-slate-200 dark:border-white/10 shadow-md">
                <AvatarImage src={user.photoUrl || ""} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-sm bg-blue-900/60 text-blue-200">{getInitials(user)}</AvatarFallback>
              </Avatar>

              {!collapsed && (
                <div className="ml-3 mr-auto overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-snug">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize tracking-wider">{user.role}</p>
                </div>
              )}

              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="ml-auto text-slate-450 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

