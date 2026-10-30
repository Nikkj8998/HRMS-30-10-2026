import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Holiday } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { Calendar, DollarSign, ClipboardList } from "lucide-react";

interface UpcomingEventsProps {
  holidays?: Holiday[];
}

export function UpcomingEvents({ holidays = [] }: UpcomingEventsProps) {
  // Generate upcoming company events (meetings, reviews, etc.)
  const today = new Date();
  const companyEvents = [
    {
      title: "Company Town Hall",
      date: addDays(today, 3),
      time: "10:00 AM - 11:30 AM",
      type: "meeting" // meeting, event, review
    },
    {
      title: "Team Building Event",
      date: addDays(today, 10),
      time: "All Day Event",
      type: "event"
    },
    {
      title: "Monthly Review",
      date: addDays(today, 15),
      time: "2:00 PM - 4:00 PM",
      type: "review"
    }
  ];

  // Determine background color based on event type
  const getEventColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-500/10 border-blue-500/20 text-blue-300";
      case "event":
        return "bg-pink-500/10 border-pink-500/20 text-pink-300";
      case "review":
        return "bg-amber-500/10 border-amber-500/20 text-amber-300";
      default:
        return "bg-white/[0.02] border-white/[0.04] text-slate-300";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Calendar className="h-4 w-4 text-blue-400" />;
      case "event":
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case "review":
        return <ClipboardList className="h-4 w-4 text-purple-400" />;
      default:
        return <Calendar className="h-4 w-4 text-slate-400" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-500/10 border-blue-500/20";
      case "event":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "review":
        return "bg-purple-500/10 border-purple-500/20";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  const formattedEvents = [
    {
      dateDay: "08",
      dateMonth: "MAY",
      title: "Monthly Team Meeting",
      time: "10:00 AM - 11:30 AM",
      location: "Conference Room A",
      type: "meeting"
    },
    {
      dateDay: "12",
      dateMonth: "MAY",
      title: "Payroll Processing",
      time: "09:00 AM - 12:00 PM",
      location: "Finance Department",
      type: "event"
    },
    {
      dateDay: "15",
      dateMonth: "MAY",
      title: "Performance Review Discussion",
      time: "02:00 PM - 04:00 PM",
      location: "HR Department",
      type: "review"
    }
  ];

  return (
    <div className="premium-card-glass flex flex-col justify-between border border-white/[0.06] rounded-[20px] p-5 h-[270px]">
      <div className="pb-3 border-b border-white/[0.08] flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upcoming Events</h2>
        <Button 
          variant="link" 
          className="text-blue-400 hover:text-blue-300 p-0 font-extrabold text-[10px] tracking-wide"
          onClick={() => {
            window.location.href = "/holidays";
          }}
        >
          View Calendar
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col justify-between py-2 divide-y divide-white/[0.04]">
        {formattedEvents.map((event, index) => (
          <div key={index} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-center min-w-0">
              <div className="flex flex-col items-center mr-3 shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-xl px-2 py-1 min-w-[42px] select-none">
                <span className="text-xs font-black text-white leading-none">
                  {event.dateDay}
                </span>
                <span className="text-[8px] text-slate-400 uppercase font-bold mt-0.5">
                  {event.dateMonth}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-extrabold text-white truncate leading-tight">
                  {event.title}
                </h4>
                <p className="text-[9px] text-slate-400 truncate mt-0.5 font-medium leading-none">
                  {event.time} <span className="text-slate-600 px-1">•</span> {event.location}
                </p>
              </div>
            </div>
            <div className={cn("p-1.5 rounded-lg border flex items-center justify-center shrink-0 shadow-sm ml-3", getIconBg(event.type))}>
              {getEventIcon(event.type)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
