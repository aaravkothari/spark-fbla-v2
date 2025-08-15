// components/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTableViewOptions } from "@/components/data-table-view-options";

type MetaHandlers<TData> = { busyId?: string | null; [key: string]: any };

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  meta?: MetaHandlers<TData>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  meta,
}: DataTableProps<TData, TValue>) {
  const defaultSort: SortingState = [{ id: "created_at", desc: true }];

  const [sorting, setSorting] = React.useState<SortingState>(defaultSort);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");

  // Guard: never allow empty sorting; force created_at desc as fallback
  const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    const next = typeof updater === "function" ? (updater as any)(sorting) : updater;
    if (!next || next.length === 0) {
      setSorting(defaultSort);
    } else {
      setSorting(next);
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta,
    // Global search: stringify the entire row
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue || "").toLowerCase().trim();
      if (!q) return true;
      // join all primitive values on the row
      const raw = row.original as any;
      const values = Object.values(raw)
        .flatMap((v) => {
          if (v == null) return [];
          if (typeof v === "object") return JSON.stringify(v);
          return String(v);
        })
        .join(" ")
        .toLowerCase();
      return values.includes(q);
    },
  });

  // Two-state sorting just for created_at
  const onHeaderClick = (columnId: string, column: any) => {
    if (!column.getCanSort()) return;
    if (columnId === "created_at") {
      // Toggle asc <-> desc only
      column.toggleSorting(column.getIsSorted() === "asc");
      return;
    }
    // Default behavior for other sortable columns
    column.toggleSorting(undefined);
  };

  const clearFiltersAndResetColumns = () => {
    setColumnFilters([]);
    setGlobalFilter("");
    // show all columns again
    const allVisible: Record<string, boolean> = {};
    table.getAllLeafColumns().forEach((c) => {
      allVisible[c.id] = true;
    });
    table.setColumnVisibility(allVisible);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearFiltersAndResetColumns}>
            Clear filters
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const col = header.column;
                  const id = col.id;
                  const canSort = col.getCanSort();

                  return (
                    <TableHead
                      key={header.id}
                      onClick={() => onHeaderClick(id, col)}
                      className={cn(canSort ? "cursor-pointer select-none" : "")}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(col.columnDef.header, header.getContext())}
                      {canSort && col.getIsSorted() === "asc" && " ▲"}
                      {canSort && col.getIsSorted() === "desc" && " ▼"}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
