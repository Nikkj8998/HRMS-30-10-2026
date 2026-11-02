import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  yearRange?: { from: number; to: number }
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  yearRange,
  month: propsMonth,
  onMonthChange: propsOnMonthChange,
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(() => propsMonth || new Date())

  const years = React.useMemo(() => {
    if (yearRange) {
      const { from, to } = yearRange
      return Array.from({ length: to - from + 1 }, (_, i) => from + i)
    }
    const currentYear = new Date().getFullYear()
    return Array.from({ length: currentYear - 1940 + 1 }, (_, i) => 1940 + i)
  }, [yearRange?.from, yearRange?.to])

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month.getFullYear(), parseInt(monthIndex, 10), 1)
    setMonth(newMonth)
    propsOnMonthChange?.(newMonth)
  }

  const handleYearChange = (year: string) => {
    const newMonth = new Date(parseInt(year, 10), month.getMonth(), 1)
    setMonth(newMonth)
    propsOnMonthChange?.(newMonth)
  }

  React.useEffect(() => {
    if (propsMonth && propsMonth instanceof Date && !isNaN(propsMonth.getTime())) {
      setMonth(propsMonth)
    }
  }, [propsMonth?.getTime()])

  return (
    <div className={cn("p-3", className)}>
      {/* Year and Month native selectors - won't close parent popovers */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <select
          value={month.getMonth().toString()}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
        >
          {months.map((monthName, index) => (
            <option key={index} value={index.toString()}>
              {monthName}
            </option>
          ))}
        </select>

        <select
          value={month.getFullYear().toString()}
          onChange={(e) => handleYearChange(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
        >
          {years.map(year => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        month={month}
        onMonthChange={(newMonth) => {
          setMonth(newMonth)
          propsOnMonthChange?.(newMonth)
        }}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ className, ...props }) => (
            <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
          ),
          IconRight: ({ className, ...props }) => (
            <ChevronRight className={cn("h-4 w-4", className)} {...props} />
          ),
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
