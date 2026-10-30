import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

const ELLIPSIS = "...";

export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  itemLabel = "records",
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  // Improved page range logic for better UX
  const getPages = () => {
    const pages: (number | typeof ELLIPSIS)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, ELLIPSIS, totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, ELLIPSIS, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, ELLIPSIS, currentPage - 1, currentPage, currentPage + 1, ELLIPSIS, totalPages);
      }
    }
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
      <div className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-700">{startIndex}</span>–
        <span className="font-semibold text-slate-700">{endIndex}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalItems}</span> {itemLabel}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((item, idx) =>
          item === ELLIPSIS ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
          ) : (
            <Button
              key={`page-${item}`}
              variant={currentPage === item ? "default" : "ghost"}
              size="icon"
              className={cn(
                "h-8 w-8 text-sm",
                currentPage === item && "bg-teal-600 hover:bg-teal-700 text-white"
              )}
              onClick={() => onPageChange(item as number)}
              aria-label={`Page ${item}`}
              disabled={currentPage === item}
            >
              {item}
            </Button>
          )
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
