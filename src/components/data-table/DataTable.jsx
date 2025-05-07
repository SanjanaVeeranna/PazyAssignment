import { useState, useEffect } from "react"
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import * as XLSX from "xlsx"
import { Download } from "lucide-react"

import { Button } from "../ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table"
import { Checkbox } from "../ui/Checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/Tooltip"

import { DraggableColumnHeader } from "../data-table/Header"
import { ResizableHeader } from "../data-table/SecondaryHeader"
import { TablePagination } from "../data-table/Pagination"
import { mockData } from "../data/mockData"

export function DataTable() {
    // State for table data
    const [data, setData] = useState([])

    // Load mock data on component mount
    useEffect(() => {
        setData(mockData)
    }, [])

    // State for row selection
    const [rowSelection, setRowSelection] = useState({})

    // State for sorting
    const [sorting, setSorting] = useState([])

    // State for pagination
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    })

    // Calculate pagination values
    const pageCount = Math.ceil(data.length / pagination.pageSize)

    // State for column order
    const [columnOrder, setColumnOrder] = useState([
        "select",
        "tableId",
        "avatar",
        "name",
        "description",
        "amount",
        "tooltip",
    ])

    // Define columns
    const columns = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-[#dc3545]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="ml-8"
                />
            ),
            enableSorting: false,
            enableResizing: false,
            enableHiding: false,
            meta: {
                isSticky: true,
                width: 60,
            },
        },
        {
            accessorKey: "avatar",
            header: "Avatar",
            cell: ({ row }) => (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-300 flex items-center justify-center mx-auto">
                    <img
                        src={row.original.avatar || "/placeholder.svg"}
                        alt={`${row.original.name}'s avatar`}
                        className="w-full h-full object-cover"
                    />
                </div>
            ),
            enableSorting: false,
            meta: {
                isSticky: true,
                width: 80,
            },
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="font-medium text-indigo-700">{row.getValue("name")}</div>
            ),
            meta: {
                isSticky: true,
                width: 180,
            },
        },
        {
            accessorKey: "description",
            header: () => "Description",
            cell: ({ row }) => (
                <div className="max-w-md text-gray-700">{row.getValue("description")}</div>
            ),
            meta: {
                width: 300,
            },
        },
        {
            accessorKey: "amount",
            header: () => "Amount",
            cell: ({ row }) => {
                const amount = Number.parseFloat(row.getValue("amount"));
                const formatted = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount);

                // Color based on amount value
                const colorClass = amount > 1000
                    ? "text-emerald-600 font-semibold"
                    : amount > 500
                        ? "text-amber-600"
                        : "text-gray-600";

                return (
                    <div className={`text-left ${colorClass}`}>
                        {formatted}
                    </div>
                );
            },
            meta: {
                width: 140,
            },
        },
        {
            accessorKey: "tooltip",
            header: "Info",
            cell: ({ row }) => (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                Info
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-indigo-50 border border-indigo-200 text-indigo-800 shadow-lg">
                            <p>{row.getValue("tooltip")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ),
            meta: {
                width: 100,
            },
        },
        {
            accessorKey: "tableId",
            header: "Table ID",
            cell: ({ row }) => (
                <div className="px-6 font-medium">{row.getValue("tableId")}</div>
            ),
            meta: {
                isSticky: true,
                width: 100,
            },
        },
    ]

    // Initialize table
    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            rowSelection,
            pagination,
            columnOrder,
        },
        enableRowSelection: true,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        onColumnOrderChange: setColumnOrder,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: false,
        pageCount,
    })

    // Function to export table data to Excel
    const exportToExcel = () => {
        // Get visible rows
        const visibleRows = table.getRowModel().rows

        // Map rows to data for export
        const exportData = visibleRows.map((row) => {
            const rowData = {}

            // Skip the select and avatar columns
            columns.forEach((column) => {
                if (column.id !== "select" && column.id !== "avatar") {
                    const id = column.id || String(column.accessorKey)
                    rowData[id] = row.getValue(id)
                }
            })

            return rowData
        })

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData)

        // Create workbook
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data")

        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, "table-data.xlsx")
    }

    const clearAllSelections = () => {
        setRowSelection({})
    }

    return (
        <div className="space-y-6">
            {/* Header with title and export button */}
            <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-bold text-[#dc3545]">Advanced Data Table</h2>
                <Button
                    onClick={exportToExcel}
                    className="bg-[#dc3545] text-white"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Pagination controls */}
            <div className="bg-gray-100 p-3 rounded-md border border-gray-200 shadow-sm">
                <TablePagination table={table} />
            </div>

            {/* Main table */}
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                    <DndProvider backend={HTML5Backend}>
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="bg-[#dc3545] text-white"
                                    >
                                        {headerGroup.headers.map((header) => {
                                            const isSticky = header.column.columnDef.meta?.isSticky;
                                            const columnWidth = header.column.columnDef.meta?.width || "auto";

                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    className="py-3 font-bold text-sm uppercase tracking-wider"
                                                >
                                                    {header.isPlaceholder ? null : (
                                                        <ResizableHeader header={header} table={table}>
                                                            {header.column.getCanSort() ? (
                                                                <DraggableColumnHeader header={header} table={table}>
                                                                    <div className="flex items-center justify-center">
                                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                                    </div>
                                                                </DraggableColumnHeader>
                                                            ) : (
                                                                <div className="flex items-center justify-center">
                                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                                </div>
                                                            )}
                                                        </ResizableHeader>
                                                    )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row, rowIndex) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={`
                                                ${row.getIsSelected() ? "bg-indigo-50" : rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                                hover:bg-indigo-50 transition-colors duration-150
                                            `}
                                        >
                                            {row.getVisibleCells().map((cell) => {
                                                const isSticky = cell.column.columnDef.meta?.isSticky;
                                                const columnWidth = cell.column.columnDef.meta?.width || "auto";

                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        className="py-3"
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DndProvider>
                </div>
            </div>

            {/* Footer with pagination information */}
            <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-500 border-t border-gray-200">
                {/* Information text on the left */}
                <div>
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {
                        Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            data.length
                        )
                    } of {data.length} entries
                </div>

                {/* Clear selection button on the right - disabled when no selections */}
                <div>
                    <Button
                        variant="outline"
                        onClick={clearAllSelections}
                        disabled={Object.keys(rowSelection).length === 0}
                        className="border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                        Clear Selection ({Object.keys(rowSelection).length || 0})
                    </Button>
                </div>
            </div>

        </div>
    )
}