import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn, getInitials } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Cake, 
  Sparkles, 
  PartyPopper, 
  Gift, 
  Calendar, 
  Heart, 
  Check, 
  Send,
  Building2,
  ChevronLeft,
  ChevronRight,
  Smile,
  Users,
  CheckCheck
} from "lucide-react";

interface BirthdayEmployee {
  id: number;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  position: string | null;
  departmentId: number | null;
  departmentName: string;
  dateOfBirth: string | Date;
  photoUrl?: string;
}

export function BirthdayAnnouncements() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [wishedUsers, setWishedUsers] = useState<Record<number, boolean>>({});
  const [activeTodayIdx, setActiveTodayIdx] = useState(0);

  // Fetch birthdays for all authenticated users
  const { data: birthdayList = [], isLoading } = useQuery<BirthdayEmployee[]>({
    queryKey: ["/api/announcements/birthdays"],
  });

  const today = new Date();
  const todayMonth = today.getMonth(); // 0-indexed
  const todayDate = today.getDate();

  // 1. Filter Today's Birthdays
  const todaysBirthdays = birthdayList.filter(emp => {
    if (!emp.dateOfBirth) return false;
    const dob = new Date(emp.dateOfBirth);
    if (isNaN(dob.getTime())) return false;
    return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
  });

  // Ensure active index is within bounds
  const safeIdx = Math.min(activeTodayIdx, Math.max(0, todaysBirthdays.length - 1));
  const featuredToday = todaysBirthdays[safeIdx] || todaysBirthdays[0];

  // 2. Filter Upcoming Birthdays (next 30 days)
  interface UpcomingItem {
    employee: BirthdayEmployee;
    daysRemaining: number;
    formattedDate: string;
  }

  const upcomingBirthdays: UpcomingItem[] = birthdayList
    .map(emp => {
      if (!emp.dateOfBirth) return null;
      const dob = new Date(emp.dateOfBirth);
      if (isNaN(dob.getTime())) return null;

      const birthMonth = dob.getMonth();
      const birthDay = dob.getDate();

      // Skip if today
      if (birthMonth === todayMonth && birthDay === todayDate) return null;

      // Next birthday in current year
      let nextBday = new Date(today.getFullYear(), birthMonth, birthDay);
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // If already passed this year, look at next year
      if (nextBday < startOfToday) {
        nextBday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
      }

      const diffTime = nextBday.getTime() - startOfToday.getTime();
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0 && daysRemaining <= 30) {
        const formattedDate = nextBday.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return {
          employee: emp,
          daysRemaining,
          formattedDate,
        };
      }
      return null;
    })
    .filter((item): item is UpcomingItem => item !== null)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Send wish to an individual employee
  const handleSendWish = async (emp: BirthdayEmployee) => {
    if (wishedUsers[emp.id]) return;
    setWishedUsers(prev => ({ ...prev, [emp.id]: true }));
    try {
      const senderName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "A colleague";
      const senderRole = currentUser?.role ? ` (${currentUser.role.toUpperCase()})` : "";
      await apiRequest("POST", "/api/notifications", {
        userId: emp.id,
        type: "birthday",
        title: `🎂 Birthday Wish from ${senderName}!`,
        message: `${senderName}${senderRole} sent you warm birthday wishes: "Wishing you a joyful Birthday and a wonderful year ahead!" 🎉🎈`,
        isRead: false
      });
    } catch (err) {
      console.error("Failed to save birthday notification:", err);
    }
    toast({
      title: "🎉 Birthday Wishes Sent!",
      description: `Your heartfelt birthday wishes have been delivered to ${emp.firstName} ${emp.lastName}! 🥳🎂`,
    });
  };

  // Send wishes to ALL celebrants today at once
  const handleSendWishAll = async () => {
    const unWished = todaysBirthdays.filter(emp => !wishedUsers[emp.id]);
    const updated = { ...wishedUsers };
    for (const emp of unWished) {
      updated[emp.id] = true;
      try {
        const senderName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "A colleague";
        const senderRole = currentUser?.role ? ` (${currentUser.role.toUpperCase()})` : "";
        await apiRequest("POST", "/api/notifications", {
          userId: emp.id,
          type: "birthday",
          title: `🎂 Birthday Wish from ${senderName}!`,
          message: `${senderName}${senderRole} sent you warm birthday wishes: "Wishing you a joyful Birthday and a wonderful year ahead!" 🎉🎈`,
          isRead: false
        });
      } catch (err) {
        console.error("Failed to save birthday notification for", emp.id, err);
      }
    }
    setWishedUsers(updated);
    toast({
      title: "🎉 Birthday Wishes Sent to All!",
      description: `Delivered birthday wishes to all ${todaysBirthdays.length} celebrants today! 🥳🎂`,
    });
  };

  const allWished = todaysBirthdays.length > 0 && todaysBirthdays.every(emp => wishedUsers[emp.id]);

  return (
    <div className="w-full">
      {/* 2-Column Responsive Spotlight Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ======================================================== */}
        {/* COLUMN 1: Today's Birthday Spotlight (7 cols on desktop) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7">
          {featuredToday ? (
            <div className="relative overflow-hidden rounded-[24px] border border-purple-500/30 dark:border-purple-400/25 bg-gradient-to-br from-purple-50/95 via-pink-50/80 to-amber-50/70 dark:from-[#1b1235]/95 dark:via-[#16102a]/90 dark:to-[#0c1322]/95 shadow-[0_10px_35px_rgba(168,85,247,0.12)] p-6 md:p-7 flex flex-col justify-between min-h-[300px]">
              
              {/* Background ambient celebratory glow */}
              <div className="absolute -top-16 -right-16 w-60 h-60 bg-purple-500/15 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-pink-500/15 dark:bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Header Row: Title Badge + Multiple Celebrants Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/25">
                      <Cake className="h-3.5 w-3.5" />
                      {todaysBirthdays.length > 1
                        ? `${todaysBirthdays.length} Birthdays Today!`
                        : "Today's Birthday Celebration"}
                    </span>
                    {todaysBirthdays.length > 1 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                        <Users className="h-3 w-3" />
                        Joint Celebration
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 px-2 py-0.5 rounded-full border border-purple-300 dark:border-purple-800">
                        ✨ Special Day
                      </span>
                    )}
                  </div>

                  {/* Multi-Celebrant Switcher Controls (Prev / Next & Counter) */}
                  {todaysBirthdays.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-900/80 p-1 rounded-xl border border-purple-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
                      <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 px-2 select-none">
                        {safeIdx + 1} of {todaysBirthdays.length}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setActiveTodayIdx(prev => (prev > 0 ? prev - 1 : todaysBirthdays.length - 1))}
                        className="h-6 w-6 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                        title="Previous Celebrant"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setActiveTodayIdx(prev => (prev < todaysBirthdays.length - 1 ? prev + 1 : 0))}
                        className="h-6 w-6 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                        title="Next Celebrant"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* MULTI-CELEBRANT TABS: Shown when 2 or more birthdays exist on the same day */}
                {todaysBirthdays.length > 1 && (
                  <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                      Celebrants:
                    </span>
                    {todaysBirthdays.map((emp, idx) => {
                      const isActive = idx === safeIdx;
                      const isWished = wishedUsers[emp.id];
                      return (
                        <button
                          key={emp.id}
                          onClick={() => setActiveTodayIdx(idx)}
                          className={cn(
                            "group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 shrink-0 select-none",
                            isActive
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md shadow-purple-500/25 scale-[1.02]"
                              : "bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border-purple-200/70 dark:border-white/10 hover:border-purple-400 hover:bg-white"
                          )}
                        >
                          <Avatar className="h-5 w-5 border border-white/20">
                            <AvatarImage src={emp.photoUrl || ""} alt={`${emp.firstName} ${emp.lastName}`} className="object-cover" />
                            <AvatarFallback className="text-[9px] bg-purple-700 text-white font-bold">
                              {getInitials(emp.firstName, emp.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{emp.firstName} {emp.lastName}</span>
                          {isWished ? (
                            <Heart className={cn("h-3 w-3 fill-rose-300 text-rose-300", !isActive && "fill-rose-500 text-rose-500")} />
                          ) : (
                            <span className={cn("h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse", isActive && "bg-white")} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Main Animated Celebrant Profile Section */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={featuredToday.id}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col sm:flex-row items-center sm:items-start gap-5"
                  >
                    {/* Avatar with Celebration Halo */}
                    <div className="relative shrink-0">
                      <div className="p-1 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-xl shadow-purple-500/20">
                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-white dark:border-slate-900">
                          <AvatarImage 
                            src={featuredToday.photoUrl || ""} 
                            alt={`${featuredToday.firstName} ${featuredToday.lastName}`}
                            className="object-cover" 
                          />
                          <AvatarFallback className="bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-black text-2xl">
                            {getInitials(featuredToday.firstName, featuredToday.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md border-2 border-white dark:border-slate-900">
                        <PartyPopper className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Name, Position, Department & Personalized Wish */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {featuredToday.firstName} {featuredToday.lastName}
                        </h3>
                        {featuredToday.employeeId && (
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-700">
                            {featuredToday.employeeId}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">
                        {featuredToday.position && (
                          <span className="font-semibold text-purple-700 dark:text-purple-300">
                            {featuredToday.position}
                          </span>
                        )}
                        {featuredToday.position && featuredToday.departmentName && (
                          <span className="text-slate-400">•</span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {featuredToday.departmentName}
                        </span>
                      </div>

                      {/* Warm Personalized Birthday Message */}
                      <div className="mt-3 p-3 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-purple-200/60 dark:border-white/[0.06] backdrop-blur-sm">
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-purple-100/90 leading-relaxed italic">
                          "Wishing you a very Happy Birthday, <span className="font-bold text-purple-600 dark:text-purple-300">{featuredToday.firstName}</span>! 🎉 May your day be filled with celebration, joy, and wonderful milestones in the year ahead!"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-4 pt-3.5 border-t border-purple-200/50 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {todaysBirthdays.length > 1
                    ? `Celebrating ${todaysBirthdays.length} team birthdays today!`
                    : "Celebrating with the whole team today"}
                </span>

                <div className="flex items-center gap-2">
                  {/* Single Wish Button for the Currently Featured Employee */}
                  <Button
                    size="sm"
                    onClick={() => handleSendWish(featuredToday)}
                    disabled={wishedUsers[featuredToday.id]}
                    className={`h-9 px-4 rounded-xl font-bold text-xs shadow-md transition-all duration-300 ${
                      wishedUsers[featuredToday.id]
                        ? "bg-emerald-600 text-white hover:bg-emerald-600 cursor-default"
                        : "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/25 active:scale-95"
                    }`}
                  >
                    {wishedUsers[featuredToday.id] ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Wished {featuredToday.firstName}! ❤️
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Wish {featuredToday.firstName} 🎈
                      </>
                    )}
                  </Button>

                  {/* Multi-Wish Button: "Wish Both / Wish All" */}
                  {todaysBirthdays.length > 1 && !allWished && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSendWishAll}
                      className="h-9 px-3.5 rounded-xl font-bold text-xs border-purple-400/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 shadow-sm active:scale-95"
                    >
                      <CheckCheck className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                      Wish All ({todaysBirthdays.length}) 🎉
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // State when no birthdays fall exactly on today
            <div className="relative overflow-hidden rounded-[24px] border border-slate-200 dark:border-white/[0.08] bg-white/70 dark:bg-slate-900/60 p-6 md:p-7 flex flex-col justify-between min-h-[300px] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <PartyPopper className="h-3.5 w-3.5 text-purple-500" />
                  Team Celebrations & Announcements
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 my-auto py-2">
                <div className="h-16 w-16 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Cake className="h-8 w-8 text-purple-500" />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    No Birthdays Today
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                    There are no employee birthdays scheduled for today. Have a productive day, and keep an eye on upcoming celebrations on the right! 🎈
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] text-xs text-slate-400 flex items-center justify-between">
                <span>Active company notifications & announcements</span>
                <span className="font-semibold text-purple-500">Upcoming birthdays tracked</span>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: Upcoming Birthdays List (5 cols on desktop)    */}
        {/* ======================================================== */}
        <div className="lg:col-span-5">
          <div className="h-full rounded-[24px] border border-slate-200 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/70 p-5 md:p-6 flex flex-col justify-between shadow-sm">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06] mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Upcoming Birthdays
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Next 30 Days
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40">
                  {upcomingBirthdays.length} upcoming
                </Badge>
              </div>

              {/* List of Upcoming */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {upcomingBirthdays.length > 0 ? (
                  upcomingBirthdays.slice(0, 4).map(({ employee, daysRemaining, formattedDate }) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] hover:border-purple-500/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0 border border-slate-200 dark:border-white/10">
                          <AvatarImage src={employee.photoUrl || ""} alt={`${employee.firstName} ${employee.lastName}`} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs">
                            {getInitials(employee.firstName, employee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {employee.position || employee.departmentName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                          {formattedDate}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block ${
                          daysRemaining <= 3
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        }`}>
                          {daysRemaining === 1 ? "Tomorrow" : `In ${daysRemaining} days`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <Calendar className="h-7 w-7 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      No upcoming birthdays in the next 30 days
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Summary note */}
            <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.04] mt-2">
              <span>Automatic celebration alerts</span>
              <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
                <Smile className="h-3 w-3" />
                Spread Joy
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
