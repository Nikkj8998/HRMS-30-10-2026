import { useState } from "react";

export function usePagination<T>(items: T[], pageSize = 30) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);

    const paginatedItems = items.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    );

    const reset = () => setCurrentPage(1);

    return {
        currentPage: safePage,
        setCurrentPage,
        totalPages,
        paginatedItems,
        reset,
        pageSize,
        totalItems: items.length,
        startIndex: (safePage - 1) * pageSize + 1,
        endIndex: Math.min(safePage * pageSize, items.length),
    };
}
