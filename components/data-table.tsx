"use client";

import { useMemo, useState, useEffect, ReactNode } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { getPageNumbers, cn } from "@/lib/utils";

export interface ColumnDef<T> {
    id: string;
    header: ReactNode | ((sortIndicator: ReactNode) => ReactNode);
    sortable?: boolean;
    defaultSortDirection?: "asc" | "desc";
    getValue?: (item: T) => number | string;
    align?: "left" | "right" | "center";
    className?: string;
    headerClassName?: string;
    cell: (item: T, index: number, globalIndex: number) => ReactNode;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    rowKey: (item: T) => string | number;
    searchPlaceholder?: string;
    searchFilter?: (item: T, query: string) => boolean;
    initialSearchQuery?: string;
    onSearchChange?: (query: string) => void;
    defaultSortField?: string | null;
    defaultSortDirection?: "asc" | "desc";
    pageSizeOptions?: readonly number[];
    defaultPageSize?: number;
    loading?: boolean;
    loadingText?: string;
    emptyText?: string;
    itemLabel?: string;
    onRowClick?: (item: T) => void;
    extraToolbar?: ReactNode;
}

export function DataTable<T>({
    data,
    columns,
    rowKey,
    searchPlaceholder = "Search...",
    searchFilter,
    initialSearchQuery = "",
    onSearchChange,
    defaultSortField = null,
    defaultSortDirection = "desc",
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    defaultPageSize = 10,
    loading = false,
    loadingText = "Loading...",
    emptyText = "No items found.",
    itemLabel = "items",
    onRowClick,
    extraToolbar,
}: DataTableProps<T>) {
    const [filter, setFilter] = useState(initialSearchQuery);
    const [sortField, setSortField] = useState<string | null>(defaultSortField);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultSortDirection);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number>(defaultPageSize);

    // Sync search filter if initialSearchQuery updates externally (e.g. URL query params)
    useEffect(() => {
        if (initialSearchQuery !== undefined) {
            setFilter(initialSearchQuery);
        }
    }, [initialSearchQuery]);

    const handleSort = (column: ColumnDef<T>) => {
        if (!column.sortable) return;

        if (sortField === column.id) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(column.id);
            setSortDirection(column.defaultSortDirection || "desc");
        }
        setCurrentPage(1);
    };

    const renderSortIndicator = (column: ColumnDef<T>) => {
        if (!column.sortable) return null;

        if (sortField !== column.id) {
            return (
                <span className="text-neutral-700 group-hover/btn:text-neutral-400 transition-colors ml-1">
                    ↕
                </span>
            );
        }
        return (
            <span className="text-[#97E600] font-bold ml-1">
                {sortDirection === "asc" ? "↑" : "↓"}
            </span>
        );
    };

    // ── Filtering & sorting ──
    const filteredData = useMemo(() => {
        let result = data;

        if (filter.trim() && searchFilter) {
            const query = filter.toLowerCase().trim();
            result = result.filter((item) => searchFilter(item, query));
        }

        if (sortField) {
            const col = columns.find((c) => c.id === sortField);
            if (col && col.getValue) {
                const getValue = col.getValue;
                result = [...result].sort((a, b) => {
                    const aVal = getValue(a);
                    const bVal = getValue(b);

                    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
                    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
                    return 0;
                });
            }
        }

        return result;
    }, [data, filter, searchFilter, sortField, sortDirection, columns]);

    const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
    const clampedPage = Math.min(currentPage, totalPages);

    const paginatedData = useMemo(() => {
        const start = (clampedPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, clampedPage, pageSize]);

    return (
        <div>
            {extraToolbar}

            {/* Search & Page Size Toolbar */}
            <div className="relative mb-6">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg
                        className="h-4 w-4 text-neutral-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
                <input
                    type="text"
                    value={filter}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFilter(val);
                        if (onSearchChange) onSearchChange(val);
                        setCurrentPage(1);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full font-mono text-sm py-3 pl-9 pr-28 bg-neutral-900/60 border-b border-neutral-800 focus:border-[#97E600]/50 focus:outline-none text-white placeholder-neutral-500 transition-colors"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                    <span className="text-xs text-neutral-500 font-mono hidden sm:inline">Rows</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(v) => {
                            setPageSize(Number(v));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger size="sm" className="h-7 w-[65px] bg-neutral-900 border-neutral-800 text-white font-mono text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-neutral-800 text-white font-mono text-xs">
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={String(size)} className="focus:bg-neutral-800 focus:text-white cursor-pointer">
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <Table>
                <TableHeader className="border-b border-neutral-800/80">
                    <TableRow className="border-b border-neutral-800/80 hover:bg-transparent">
                        {columns.map((column) => (
                            <TableHead
                                key={column.id}
                                className={cn(
                                    "font-mono font-medium text-xs uppercase text-neutral-500 px-3 py-3",
                                    column.align === "right" && "text-right",
                                    column.align === "center" && "text-center",
                                    column.headerClassName || column.className
                                )}
                            >
                                {column.sortable ? (
                                    <button
                                        type="button"
                                        onClick={() => handleSort(column)}
                                        className={cn(
                                            "flex items-center hover:text-white transition-colors group/btn uppercase",
                                            column.align === "right" && "justify-end w-full",
                                            column.align === "center" && "justify-center w-full"
                                        )}
                                    >
                                        {typeof column.header === "function"
                                            ? column.header(renderSortIndicator(column))
                                            : <>
                                                {column.header}
                                                {renderSortIndicator(column)}
                                            </>
                                        }
                                    </button>
                                ) : typeof column.header === "function" ? (
                                    column.header(null)
                                ) : (
                                    column.header
                                )}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-neutral-900">
                    {loading ? (
                        <TableRow className="hover:bg-transparent border-b-0">
                            <TableCell colSpan={columns.length} className="py-12 text-center text-neutral-500 font-mono text-sm">
                                <Loader2 size={16} className="animate-spin inline mr-2" />
                                {loadingText}
                            </TableCell>
                        </TableRow>
                    ) : filteredData.length === 0 ? (
                        <TableRow className="hover:bg-transparent border-b-0">
                            <TableCell colSpan={columns.length} className="py-12 text-center text-neutral-500 font-mono text-sm">
                                {filter ? `No ${itemLabel} matching "${filter}"` : emptyText}
                            </TableCell>
                        </TableRow>
                    ) : (
                        paginatedData.map((item, index) => {
                            const globalIndex = (clampedPage - 1) * pageSize + index;
                            return (
                                <TableRow
                                    key={rowKey(item)}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        "border-b border-neutral-900 hover:bg-neutral-900/60 transition-colors group",
                                        onRowClick && "cursor-pointer"
                                    )}
                                >
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.id}
                                            className={cn(
                                                "px-3 py-3 font-mono text-xs",
                                                column.align === "right" && "text-right",
                                                column.align === "center" && "text-center",
                                                column.className
                                            )}
                                        >
                                            {column.cell(item, index, globalIndex)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {/* Pagination Controls */}
            {!loading && filteredData.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-neutral-900 font-mono text-xs text-neutral-400">
                    <div>
                        Showing{" "}
                        <span className="text-white font-medium">
                            {(clampedPage - 1) * pageSize + 1}
                        </span>{" "}
                        to{" "}
                        <span className="text-white font-medium">
                            {Math.min(clampedPage * pageSize, filteredData.length)}
                        </span>{" "}
                        of{" "}
                        <span className="text-white font-medium">{filteredData.length}</span>{" "}
                        {itemLabel}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                            <button
                                type="button"
                                disabled={clampedPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            >
                                Previous
                            </button>

                            {getPageNumbers(clampedPage, totalPages).map((pageNum, idx) => {
                                if (pageNum === "...") {
                                    return (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-2 py-1.5 text-neutral-600 select-none"
                                        >
                                            ...
                                        </span>
                                    );
                                }
                                const isCurrent = clampedPage === pageNum;
                                return (
                                    <button
                                        key={`page-${pageNum}`}
                                        type="button"
                                        onClick={() => setCurrentPage(Number(pageNum))}
                                        className={`px-3 py-1.5 rounded transition-all cursor-pointer font-medium ${
                                            isCurrent
                                                ? "bg-[#97E600]/15 text-[#97E600] border border-[#97E600]/40 shadow-[0_0_8px_rgba(151,230,0,0.15)]"
                                                : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                disabled={clampedPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
