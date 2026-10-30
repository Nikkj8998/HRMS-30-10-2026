import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/use-organization";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Holiday } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Plus, 
  Pencil, 
  Trash2,
  CalendarDays,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Award,
  Star,
  Target,
  Settings,
  Eye,
  Search,
  Filter,
  Crown,
  Sparkles,
  Zap,
  Gift,
  Download
} from "lucide-react";
import { format, isSameMonth, isToday, isSameDay, isPast, isFuture, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, addDays, subDays, getYear } from "date-fns";
import jsPDF from 'jspdf';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

// Form schema for holiday
const holidayFormSchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.date({
    required_error: "Holiday date is required",
  }),
  description: z.string().optional(),
});

type HolidayFormValues = z.infer<typeof holidayFormSchema>;

export default function HolidaysPage() {
  const { toast } = useToast();
  const { organizationName } = useOrganization();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Fetch all holidays
  const { data: holidays = [], isLoading } = useQuery<Holiday[]>({
    queryKey: ["/api/holidays"],
  });
  
  // Holiday dates for calendar highlighting
  const holidayDates = holidays.map(holiday => new Date(holiday.date));
  
  // Filter holidays for the current month
  const currentMonthHolidays = holidays.filter(holiday => 
    isSameMonth(new Date(holiday.date), selectedDate)
  );
  
  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Group holidays by past, today, and upcoming
  const pastHolidays = sortedHolidays.filter(holiday => 
    isPast(new Date(holiday.date)) && !isToday(new Date(holiday.date))
  );
  
  const todayHoliday = sortedHolidays.find(holiday => 
    isToday(new Date(holiday.date))
  );
  
  const upcomingHolidays = sortedHolidays.filter(holiday => 
    isFuture(new Date(holiday.date))
  );
  
  // Calculate holiday statistics
  const totalHolidays = holidays.length;
  const thisMonth = new Date();
  const nextMonth = addDays(thisMonth, 30);
  
  const upcomingHolidaysCount = holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= thisMonth && holidayDate <= nextMonth;
  }).length;
  
  const thisMonthHolidaysCount = holidays.filter(holiday => 
    isSameMonth(new Date(holiday.date), thisMonth)
  ).length;
  
  const pastHolidaysCount = holidays.filter(holiday =>
    isPast(new Date(holiday.date)) && !isToday(new Date(holiday.date))
  ).length;

  // Generate available years (current year + 5 years ahead)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear + i);

  // Filter holidays by selected year
  const holidaysForSelectedYear = holidays.filter(holiday => 
    getYear(new Date(holiday.date)) === parseInt(selectedYear)
  );

  // PDF generation function
  const generateHolidayPDF = () => {
    const doc = new jsPDF();
    const year = selectedYear;
    const sortedYearHolidays = [...holidaysForSelectedYear].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // PDF Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`Holiday Calendar ${year}`, 20, 30);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Holidays: ${sortedYearHolidays.length}`, 20, 45);
    
    // Header line
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);
    
    let yPosition = 65;
    
    if (sortedYearHolidays.length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(120, 120, 120);
      doc.text('No holidays found for this year.', 20, yPosition);
    } else {
      // Holiday list
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      
      sortedYearHolidays.forEach((holiday, index) => {
        const holidayDate = new Date(holiday.date);
        const dateStr = format(holidayDate, 'EEEE, MMMM d, yyyy');
        
        // Holiday name
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${holiday.name}`, 20, yPosition);
        
        // Holiday date
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(dateStr, 25, yPosition + 6);
        
        // Holiday description if available
        if (holiday.description) {
          doc.setTextColor(120, 120, 120);
          doc.text(holiday.description, 25, yPosition + 12);
          yPosition += 25;
        } else {
          yPosition += 18;
        }
        
        // Add page break if needed
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setTextColor(60, 60, 60);
      });
    }
    
    // Footer
    const pageCount = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${format(new Date(), 'PPP')} - Page ${i} of ${pageCount}`, 20, 285);
      doc.text(`${organizationName} - Holiday Management System`, 130, 285);
    }
    
    // Download the PDF
    doc.save(`Holiday-Calendar-${year}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: `Holiday calendar for ${year} has been downloaded successfully.`,
    });
  };

  
  // Create holiday mutation
  const createHolidayMutation = useMutation({
    mutationFn: async (values: HolidayFormValues) => {
      return await apiRequest("POST", "/api/holidays", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Holiday created",
        description: "The holiday has been added to the calendar.",
      });
      addForm.reset({
        name: "",
        date: new Date(),
        description: "",
      });
      setIsAddOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update holiday mutation
  const updateHolidayMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: HolidayFormValues }) => {
      return await apiRequest("PUT", `/api/holidays/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Holiday updated",
        description: "The holiday has been updated successfully.",
      });
      setIsEditOpen(false);
      setSelectedHoliday(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete holiday mutation
  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Holiday deleted",
        description: "The holiday has been removed from the calendar.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add holiday form
  const addForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      description: "",
    },
  });
  
  // Edit holiday form
  const editForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: selectedHoliday?.name || "",
      date: selectedHoliday ? new Date(selectedHoliday.date) : new Date(),
      description: selectedHoliday?.description || "",
    },
  });
  
  // Reset edit form when selectedHoliday changes
  useEffect(() => {
    if (selectedHoliday) {
      editForm.reset({
        name: selectedHoliday.name,
        date: new Date(selectedHoliday.date),
        description: selectedHoliday.description || "",
      });
    }
  }, [selectedHoliday, editForm]);
  
  // Handle add form submission
  const onAddSubmit = (values: HolidayFormValues) => {
    createHolidayMutation.mutate(values);
  };
  
  // Handle edit form submission
  const onEditSubmit = (values: HolidayFormValues) => {
    if (selectedHoliday) {
      updateHolidayMutation.mutate({ id: selectedHoliday.id, values });
    }
  };
  
  // Table columns for holidays
  const columns: ColumnDef<Holiday>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.date), 'MMM d, yyyy'),
    },
    {
      accessorKey: "name",
      header: "Holiday Name",
      cell: ({ row }) => row.getValue("name"),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.getValue("description") || "No description",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const holiday = row.original;
        
        // Only admin can edit/delete holidays
        if (user?.role !== 'admin') {
          return (
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">View only</span>
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setSelectedHoliday(holiday);
                setIsEditOpen(true);
              }}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-red-500"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this holiday? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  // Holiday Card Component
  const HolidayCard = ({ holiday, index, variant = 'default' }: { holiday: Holiday; index: number; variant?: 'default' | 'upcoming' | 'today' }) => {
    const holidayDate = new Date(holiday.date);
    const isHolidayToday = isToday(holidayDate);
    const isHolidayPast = isPast(holidayDate) && !isHolidayToday;
    const isHolidayUpcoming = isFuture(holidayDate);
    
    const getHolidayIcon = () => {
      if (isHolidayToday) return <Sparkles className="w-5 h-5" />;
      if (isHolidayUpcoming) return <Star className="w-5 h-5" />;
      return <Gift className="w-5 h-5" />;
    };
    
    const getCardStyles = () => {
      if (variant === 'today') return 'border-amber-500/30 bg-[#0c1427]/60 text-slate-200';
      if (variant === 'upcoming') return 'border-emerald-500/30 bg-[#0c1427]/60 text-slate-200';
      return 'border-white/[0.08] bg-[#0c1427]/60 text-slate-200';
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Card className={cn("group border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative", getCardStyles())}>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-550/5 via-transparent to-emerald-555/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-4 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-xl shadow-md",
                    variant === 'today' ? 'bg-amber-500/10 text-amber-400' :
                    variant === 'upcoming' ? 'bg-emerald-500/10 text-emerald-450' :
                    'bg-white/[0.04] text-slate-350'
                  )}>
                    {getHolidayIcon()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors duration-300">
                      {holiday.name}
                    </h3>
                    <p className="text-sm text-slate-400 font-medium">
                      {format(holidayDate, 'EEEE, MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setSelectedHoliday(holiday);
                        setIsEditOpen(true);
                      }}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/[0.04]"
                    >
                      <Settings className="h-4 w-4 text-blue-400" />
                    </Button>
                  </div>
                )}
              </div>
              
              {holiday.description && (
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <CalendarDays className="w-4 h-4 text-blue-400" />
                  <span className="truncate">{holiday.description}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                <Badge 
                  variant={isHolidayToday ? 'default' : isHolidayUpcoming ? 'secondary' : 'outline'} 
                  className={cn(
                    "text-xs font-medium border",
                    isHolidayToday ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                    isHolidayUpcoming ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                    'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                  )}
                >
                  {isHolidayToday ? 'Today' : isHolidayUpcoming ? 'Upcoming' : 'Past'}
                </Badge>
                
                <span className="text-xs text-slate-500">
                  {format(holidayDate, 'MMM d')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <PageHeader
          title="Holiday Calendar"
          description="Manage company holidays and track upcoming celebrations."
          icon={<CalendarIcon className="w-6 h-6 text-blue-600" />}
          actions={
            <div className="flex items-center space-x-3">
              <div className="bg-white/[0.03] rounded-xl px-4 py-1.5 border border-white/[0.08] shadow-sm flex items-center space-x-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Holidays</div>
                  <div className="text-base font-black text-white leading-none">{totalHolidays}</div>
                </div>
              </div>
              {user?.role !== 'employee' && (
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold rounded-xl shadow-sm px-4 h-10 flex items-center border-none">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Holiday
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200 rounded-3xl p-6">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-black text-white">
                        Add New Holiday
                      </DialogTitle>
                      <DialogDescription className="text-slate-450">
                        Create a new company holiday for the calendar.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[70vh] mt-4">
                      <Form {...addForm}>
                        <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                          <FormField
                            control={addForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-slate-300">Holiday Name *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter holiday name"
                                    {...field}
                                    className="h-10 border border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addForm.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel className="text-xs font-bold text-slate-300">Holiday Date *</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal h-10 border border-white/[0.08] rounded-xl bg-white/[0.02] text-white hover:bg-white/[0.04]",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(new Date(field.value), "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value ? new Date(field.value) : undefined}
                                      onSelect={(date) => field.onChange(date?.toISOString())}
                                      disabled={(date) =>
                                        date.getFullYear() < 2020
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={addForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-slate-300">Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Optional details"
                                    className="border border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl min-h-[80px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)} className="flex-1 rounded-xl border-white/[0.08] bg-transparent text-slate-300 hover:bg-white/[0.04]">
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createHolidayMutation.isPending}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            >
                              {createHolidayMutation.isPending && (
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              )}
                              Create
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          }
        />

         {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border border-white/[0.08] shadow-lg bg-[#0c1427]/60 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Holidays</div>
                    <div className="text-3xl font-bold text-white">{totalHolidays}</div>
                    <div className="text-xs text-slate-550 mt-1">Company holidays</div>
                  </div>
                  <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border border-white/[0.08] shadow-lg bg-[#0c1427]/60 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">This Month</div>
                    <div className="text-3xl font-bold text-white">{thisMonthHolidaysCount}</div>
                    <div className="text-xs text-slate-550 mt-1">Holidays this month</div>
                  </div>
                  <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border border-white/[0.08] shadow-lg bg-[#0c1427]/60 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Upcoming</div>
                    <div className="text-3xl font-bold text-white">{upcomingHolidaysCount}</div>
                    <div className="text-xs text-slate-550 mt-1">Next 30 days</div>
                  </div>
                  <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400">
                    <Star className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border border-white/[0.08] shadow-lg bg-[#0c1427]/60 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Past Events</div>
                    <div className="text-3xl font-bold text-white">{pastHolidaysCount}</div>
                    <div className="text-xs text-slate-550 mt-1">Completed holidays</div>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-xl text-purple-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border border-white/[0.08] shadow-lg bg-[#0c1427]/60 backdrop-blur-md text-slate-200">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500/10 p-3 rounded-xl shadow-md">
                    <CalendarIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Interactive Calendar</CardTitle>
                    <p className="text-slate-450 text-sm mt-1">View holidays throughout the year</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Year Selector and PDF Download */}
                <div className="flex items-center justify-between p-4 bg-white/[0.01] rounded-xl border border-white/[0.08]">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                      <Label className="text-sm font-medium text-slate-350">Select Year:</Label>
                    </div>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-32 h-8 text-sm border-white/[0.08] bg-white/[0.02] text-slate-200 rounded-xl">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {holidaysForSelectedYear.length} holidays
                    </Badge>
                  </div>
                  <Button
                    onClick={generateHolidayPDF}
                    size="sm"
                    className="!bg-blue-600 hover:!bg-blue-700 text-white rounded-xl shadow-lg border-none"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-xl border border-white/[0.08] shadow-lg bg-[#0c1427]/30 text-white"
                    modifiers={{
                      holiday: (date) => holidays.some(h => isSameDay(new Date(h.date), date))
                    }}
                    modifiersStyles={{
                      holiday: {
                        backgroundColor: 'rgba(16,185,129,0.15)',
                        color: '#34d399',
                        fontWeight: '700',
                        borderRadius: '8px',
                        border: '1px solid rgba(16,185,129,0.3)'
                      }
                    }}
                    showOutsideDays={false}
                  />
                </div>

                {/* Holiday Legend */}
                <div className="flex items-center gap-4 justify-center bg-white/[0.01] p-3 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-emerald-555 bg-emerald-500/20 border border-emerald-500/30" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Holiday</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-teal-655 bg-blue-600" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-white/[0.04] border border-white/[0.08]" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today</span>
                  </div>
                </div>
                
                {/* Current month holidays */}
                {currentMonthHolidays.length > 0 && (
                  <div className="bg-white/[0.01] p-6 rounded-xl border border-white/[0.08]">
                    <div className="flex items-center space-x-2 mb-4">
                      <CalendarDays className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">
                        Holidays in {format(selectedDate, 'MMMM yyyy')}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {currentMonthHolidays.map((holiday, index) => (
                        <div key={holiday.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg shadow-sm border border-white/[0.06] hover:bg-white/[0.04] transition-shadow duration-200">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-500/10 p-2 rounded-lg">
                              <Gift className="w-4 h-4 text-blue-450" />
                            </div>
                            <div>
                              <span className="font-semibold text-white">{holiday.name}</span>
                              {holiday.description && (
                                <p className="text-sm text-slate-400">{holiday.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-slate-200">
                              {format(new Date(holiday.date), 'MMM d')}
                            </span>
                            <div className="text-xs text-slate-500">
                              {format(new Date(holiday.date), 'EEEE')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Holiday Lists Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-6"
          >
            {/* Today's Holiday */}
            {todayHoliday && (
              <Card className="border border-amber-500/30 shadow-lg bg-[#0c1427]/60 text-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <CardTitle className="text-lg font-bold text-white">Today's Holiday</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <HolidayCard holiday={todayHoliday} index={0} variant="today" />
                </CardContent>
              </Card>
            )}
            
            {/* Upcoming Holidays */}
            <Card className="border border-white/[0.08] shadow-lg hover:shadow-xl transition-all duration-300 bg-[#0c1427]/60 backdrop-blur-md text-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-emerald-450" />
                    <CardTitle className="text-lg font-bold text-white">Upcoming Holidays</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {upcomingHolidays.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingHolidays.length > 0 ? (
                  upcomingHolidays.slice(0, 3).map((holiday, index) => (
                    <HolidayCard key={holiday.id} holiday={holiday} index={index} variant="upcoming" />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-350" />
                    <p className="text-sm">No upcoming holidays</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Past Holidays */}
            {pastHolidays.length > 0 && (
              <Card className="border border-white/[0.08] shadow-lg hover:shadow-xl transition-all duration-300 bg-[#0c1427]/60 backdrop-blur-md text-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-slate-400" />
                      <CardTitle className="text-lg font-bold text-white">Recent Past</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                      {pastHolidays.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pastHolidays.slice(-2).reverse().map((holiday, index) => (
                    <HolidayCard key={holiday.id} holiday={holiday} index={index} />
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* All Holidays Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="border border-white/[0.08] shadow-lg hover:shadow-xl transition-all duration-300 bg-[#0c1427]/60 backdrop-blur-md text-slate-200">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500/10 p-3 rounded-xl shadow-md">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-white">All Holidays</CardTitle>
                    <p className="text-slate-450 text-sm mt-1">Complete list of company holidays</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-base px-3 py-1 font-bold">
                  {holidays.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={holidays} 
                searchColumn="name"
                searchPlaceholder="Search holidays..."
              />
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Edit holiday dialog */}
        {selectedHoliday && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#0c1427]/95 backdrop-blur-xl border border-white/[0.08] text-slate-200 rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-white">Edit Holiday</DialogTitle>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 px-1">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Holiday Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter holiday name" {...field} className="h-10 border border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-slate-300">Date</FormLabel>
                        <div className="w-full flex justify-center">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            className="rounded-xl border border-white/[0.08] bg-[#0c1427]/30 text-white w-fit"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add description" 
                            className="border border-white/[0.08] bg-white/[0.02] text-white focus:border-blue-500/50 rounded-xl min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditOpen(false)}
                      className="w-full sm:w-auto border-white/[0.08] bg-transparent text-slate-300 hover:bg-white/[0.04]"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-white rounded-xl"
                      disabled={updateHolidayMutation.isPending}
                    >
                      {updateHolidayMutation.isPending && (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      )}
                      Update Holiday
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}