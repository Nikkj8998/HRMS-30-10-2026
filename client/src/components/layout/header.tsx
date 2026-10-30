import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTheme } from "next-themes";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckButton } from "@/components/attendance/check-button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Attendance } from "@shared/schema";
import { isToday, format, formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { 
  Menu, BellRing, Settings, User as UserIcon, 
  KeyRound, Sun, Moon, Monitor, LogOut, Mail, Phone, MapPin, 
  Building2, Calendar, IndianRupee, Camera, Upload, X, Check, Trash2, Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Change password form schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { organizationName } = useOrganization();
  const { collapsed, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const getInitials = (u: any) => {
    if (!u) return "";
    return `${u.firstName?.charAt(0) || ""}${u.lastName?.charAt(0) || ""}`.toUpperCase();
  };
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Change password form
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await apiRequest("PUT", "/api/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
      setIsPasswordOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch today's attendance for check-in button
  const { data: myAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", { userId: user?.id }],
    enabled: !!user,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const { data: unreadNotifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Check if user has checked in today
  const todayRecord = myAttendance.find(record => 
    (record.date && isToday(new Date(record.date))) || 
    (record.checkInTime && isToday(new Date(record.checkInTime)))
  );

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Photo upload functionality
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedPhoto(base64);
        // Update user's photo immediately
        updatePhotoMutation.mutate({ photoUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    updatePhotoMutation.mutate({ photoUrl: null });
  };

  // Update photo mutation
  const updatePhotoMutation = useMutation({
    mutationFn: async (data: { photoUrl: string | null }) => {
      const response = await apiRequest("PUT", `/api/employees/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully.",
      });
      // Update the user data in the query cache
      queryClient.setQueryData(["/api/user"], updatedUser);
      setSelectedPhoto(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSelectedPhoto(null);
    },
  });

  // Notification mutations
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("PUT", `/api/notifications/${notificationId}/read`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PUT", "/api/notifications/read-all", {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("DELETE", `/api/notifications/${notificationId}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    },
  });

  const isSuperAdmin = user?.role === "admin";
  const isHR = user?.role === "hr";
  const isManager = user?.role === "manager";

  const getRoleBadge = () => {
    if (isSuperAdmin) return <Badge className="bg-indigo-600 hover:bg-indigo-700">Super Admin</Badge>;
    if (isHR) return <Badge className="bg-teal-600 hover:bg-teal-700">HR Manager</Badge>;
    if (isManager) return <Badge className="bg-blue-600 hover:bg-blue-700">Manager</Badge>;
    return <Badge variant="outline">Employee</Badge>;
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-white/[0.08] bg-white/75 dark:bg-[#0c1427]/75 backdrop-blur-md transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Large Search Bar */}
          <div className="hidden md:flex items-center relative max-w-md w-full">
            <span className="absolute left-3 text-slate-400 text-sm">🔍</span>
            <input 
              type="text" 
              placeholder="Search employees, documents, reports... (Ctrl + K)" 
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-slate-100/50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-xs tracking-wide transition-all"
              disabled
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Date Picker Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Calendar className="h-3 w-3 text-blue-500" />
            <span>{format(new Date(), 'EEE, d MMM yyyy')}</span>
          </div>

          {/* Quick Actions Dropdown shortcut */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:flex text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-xs font-semibold h-8 px-3">
                Quick Action
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200">
              <DropdownMenuItem onClick={() => setLocation('/leave')} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">Apply Leave</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/attendance')} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">Mark Attendance</DropdownMenuItem>
              {user?.role !== 'employee' && (
                <>
                  <DropdownMenuItem onClick={() => setLocation('/employees')} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">Add Employee</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/reports/attendance')} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">View Reports</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle Switcher */}
          <ThemeToggle />

          {/* Messages Mock Icon */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
            onClick={() => setLocation('/announcements')}
          >
            <Mail className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          </Button>

          {/* Calendar Mock Icon */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
            onClick={() => setLocation('/holidays')}
          >
            <Calendar className="h-5 w-5" />
          </Button>

          {/* Test / Client Account 10-Day Expiry Indicator */}
          {user?.expiresAt && (() => {
            const diffDays = Math.max(0, Math.ceil((new Date(user.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                <span>Client Demo &bull; {diffDays} {diffDays === 1 ? 'day' : 'days'} left (Expires {new Date(user.expiresAt).toLocaleDateString()})</span>
              </div>
            );
          })()}

          {/* Check-in button - visible on larger screens (hidden for developers) */}
          {user?.role !== 'developer' && (
            <div className="hidden sm:block">
              <CheckButton currentAttendance={todayRecord} />
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            {/* Notifications Dropdown */}
            <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  <BellRing className="h-5 w-5" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadNotifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsReadMutation.mutate()}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No notifications yet
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b last:border-b-0 hover:bg-slate-50 ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.createdAt && (() => {
                              try {
                                const d = new Date(notification.createdAt);
                                if (isNaN(d.getTime())) return null;
                                return (
                                  <p className="text-xs text-slate-400 mt-1">
                                    {formatInTimeZone(d, 'Asia/Kolkata', 'MMM dd, yyyy hh:mm a')} ({formatDistanceToNow(d, { addSuffix: true })})
                                  </p>
                                );
                              } catch { return null; }
                            })()}
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                className="h-6 w-6"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              className="h-6 w-6 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Settings Dropdown (hidden for developers) */}
            {user?.role !== 'developer' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 rounded-full border border-slate-200 dark:border-white/10 hover:opacity-90 transition focus:outline-none p-0.5" data-testid="button-settings-avatar">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoUrl || ""} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="text-[10px] font-bold bg-blue-900/60 text-blue-200">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200">
                  <DropdownMenuLabel className="text-slate-800 dark:text-slate-200">Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/[0.08]" />
                  
                  {/* Profile Option */}
                  <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </Dialog>
                  
                  {/* Change Password Option */}
                  <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <KeyRound className="mr-2 h-4 w-4" />
                        <span>Change Password</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                  </Dialog>
                  
                  {/* Theme Toggle Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>Theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200">
                      <DropdownMenuItem onClick={() => handleThemeChange('light')} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleThemeChange('dark')} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleThemeChange('system')} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                        <Monitor className="mr-2 h-4 w-4" />
                        <span>System</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/[0.08]" />
                  
                  {/* Settings Page Option */}
                  <DropdownMenuItem onClick={() => setLocation('/settings')} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings Page</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-white/[0.08]" />
                  
                  {/* Logout Option */}
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      
      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg sm:text-2xl font-bold text-slate-900">User Profile</DialogTitle>
          </DialogHeader>
          
          {user && (
            <div className="space-y-4 sm:space-y-6">
              {/* User Photo and Basic Info */}
              <div className="flex flex-col items-center space-y-3 sm:space-y-4 bg-gradient-to-r from-teal-50 to-slate-50 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 py-6 sm:py-8 border-b border-slate-200">
                <div className="relative group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg bg-slate-100 overflow-hidden">
                    {(selectedPhoto || user.photoUrl) ? (
                      <img 
                        src={selectedPhoto || user.photoUrl || ""} 
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Photo Edit Overlay */}
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 sm:space-x-2">
                      {/* Upload Photo Button */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="profile-photo-upload"
                        disabled={updatePhotoMutation.isPending}
                      />
                      <label
                        htmlFor="profile-photo-upload"
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-500 text-white rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer shadow-lg"
                        title="Upload new photo"
                      >
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                      </label>
                      
                      {/* Remove Photo Button */}
                      {(selectedPhoto || user.photoUrl) && (
                        <button
                          type="button"
                          onClick={removePhoto}
                          disabled={updatePhotoMutation.isPending}
                          className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Loading indicator */}
                  {updatePhotoMutation.isPending && (
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">{user.position || "No Position"}</p>
                  <Badge variant="outline" className="mt-2 capitalize text-xs sm:text-sm">
                    {user.role}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-2 hidden sm:block">
                    Hover over photo to edit
                  </p>
                  <p className="text-xs text-slate-500 mt-2 sm:hidden">
                    Tap photo to edit
                  </p>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3 sm:space-y-4 px-1">
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-slate-700">Email</p>
                    <p className="text-sm sm:text-base text-slate-900 break-words">{user.email}</p>
                  </div>
                </div>
                
                {user.phoneNumber && (
                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">Phone</p>
                      <p className="text-sm sm:text-base text-slate-900">{user.phoneNumber}</p>
                    </div>
                  </div>
                )}
                
                {user.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">Address</p>
                      <p className="text-sm sm:text-base text-slate-900 break-words">{user.address}</p>
                    </div>
                  </div>
                )}
                
                {user.dateOfBirth && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">Date of Birth</p>
                      <p className="text-sm sm:text-base text-slate-900">{(() => { try { return format(new Date(user.dateOfBirth), "PPP"); } catch { return String(user.dateOfBirth); } })()}</p>
                    </div>
                  </div>
                )}
                
                {user.joinDate && (
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">Date of Joining</p>
                      <p className="text-sm sm:text-base text-slate-900">{(() => { try { return format(new Date(user.joinDate), "PPP"); } catch { return String(user.joinDate); } })()}</p>
                    </div>
                  </div>
                )}
                
                {user.salary && (
                  <div className="flex items-start space-x-3">
                    <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">Annual Salary</p>
                      <p className="text-sm sm:text-base text-slate-900 font-semibold">₹{user.salary.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Change Password</DialogTitle>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form 
              onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">Current Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your current password"
                        className="h-10 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your new password"
                        className="h-10 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your new password"
                        className="h-10 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPasswordOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
