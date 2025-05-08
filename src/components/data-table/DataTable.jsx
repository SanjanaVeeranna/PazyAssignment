import { useState, useEffect, useRef } from "react"
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import * as XLSX from "xlsx"
import { Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import { Button } from "../ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table"
import { Checkbox } from "../ui/Checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/Tooltip"

import { ResizableHeader } from "../data-table/SecondaryHeader"
import { TablePagination } from "../data-table/Pagination"
import { mockData } from "../data/mockData"

// Enhanced DraggableColumnHeader component with actual drag and drop functionality
const DraggableColumnHeader = ({ header, table, children }) => {
    const { getState, setColumnOrder } = table;
    const { columnOrder } = getState();
    const ref = useRef(null);

    // Set up drag source
    const [{ isDragging }, drag] = useDrag({
        type: 'COLUMN',
        item: () => ({
            id: header.id,
            index: columnOrder.indexOf(header.id),
        }),
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    // Set up drop target
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: 'COLUMN',
        drop: (item) => {
            if (item.id !== header.id) {
                const newColumnOrder = [...columnOrder];
                const fromIndex = columnOrder.indexOf(item.id);
                const toIndex = columnOrder.indexOf(header.id);

                // Remove the item from its original position
                newColumnOrder.splice(fromIndex, 1);
                // Insert it at the new position
                newColumnOrder.splice(toIndex, 0, item.id);

                setColumnOrder(newColumnOrder);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    });

    // Combine ref functions for both drag and drop
    const dragDropRef = (el) => {
        drag(el);
        drop(el);
        ref.current = el;
    };

    // Visual styles based on drag state
    const opacity = isDragging ? 0.5 : 1;
    const dragStyles = isDragging
        ? "shadow-lg scale-105 z-50 border-2 border-indigo-400 bg-indigo-100 bg-opacity-30"
        : "";
    const dropStyles = isOver && canDrop
        ? "bg-indigo-100 border-2 border-indigo-500"
        : "";

    return (
        <div
            ref={dragDropRef}
            className={`relative cursor-move rounded-sm ${dragStyles} ${dropStyles} transition-all duration-150`}
            style={{ opacity }}
        >
            {children}
        </div>
    );
};

// Sorting icon component
const SortingIcon = ({ column }) => {
    if (!column.getCanSort()) return null;

    if (column.getIsSorted() === "asc") {
        return <ArrowUp className="ml-1 h-4 w-4" />;
    } else if (column.getIsSorted() === "desc") {
        return <ArrowDown className="ml-1 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
};

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

    // State for column resizing
    const [columnResizing, setColumnResizing] = useState({})
    const [columnSizingInfo, setColumnSizingInfo] = useState({})

    // Define columns
    const columns = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="border-white mr-2 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-[#dc3545]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="ml-20 "
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
                <div className="font-medium text-center text-indigo-700">{row.getValue("name")}</div>
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
            header: ({ column }) => (
                <div className="flex items-center justify-center cursor-pointer" onClick={() => column.toggleSorting()}>
                    Amount
                    <SortingIcon column={column} />
                </div>
            ),
            cell: ({ row }) => {
                const amount = Number.parseFloat(row.getValue("amount"));
                const formatted = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(amount);

                // Color based on amount value
                const colorClass = amount > 1000
                    ? "text-emerald-600 font-semibold text-center"
                    : amount > 500
                        ? "text-amber-600 text-center"
                        : "text-gray-600 text-center";

                return (
                    <div className={`text-left ${colorClass}`}>
                        {formatted}
                    </div>
                );
            },
            enableSorting: true,
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
                <div className="px-6 font-medium text-center">{row.getValue("tableId")}</div>
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
            columnResizing,
            columnSizingInfo,
        },
        enableRowSelection: true,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        onColumnOrderChange: setColumnOrder,
        onColumnResizingChange: setColumnResizing,
        onColumnSizingInfoChange: setColumnSizingInfo,
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

    // Function to reset column order to default
    const resetColumnOrder = () => {
        setColumnOrder([
            "select",
            "tableId",
            "avatar",
            "name",
            "description",
            "amount",
            "tooltip",
        ]);
    }

    return (
        <div className="space-y-6">
            {/* Header with title and export button */}
            <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-bold text-[#dc3545]">PAZY (DATA TABLE)</h2>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={resetColumnOrder}
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                        Reset Column Order
                    </Button>
                    <Button
                        onClick={exportToExcel}
                        className="bg-[#dc3545] text-white"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
            </div>

            {/* Drag instruction */}
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-blue-800 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Drag column headers to reorder them. Click on column edges to resize.</span>
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
                                            const columnWidth = header.getSize();

                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    className="py-3 font-bold text-sm uppercase tracking-wider relative"
                                                    style={{
                                                        width: `${columnWidth}px`,
                                                    }}
                                                >
                                                    {header.isPlaceholder ? null : (
                                                        <ResizableHeader header={header} table={table}>
                                                            {header.column.columnDef.id !== "select" ? (
                                                                <DraggableColumnHeader header={header} table={table}>
                                                                    <div className="flex items-center justify-center p-1">
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
                                                    {header.column.getCanResize() && (
                                                        <div
                                                            className={`absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize select-none touch-none ${header.column.getIsResizing() ? "bg-indigo-500 w-1.5" : ""}`}
                                                            onMouseDown={header.getResizeHandler()}
                                                            onTouchStart={header.getResizeHandler()}
                                                        />
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
                                                const columnWidth = cell.column.getSize();

                                                return (
                                                    <TableCell
                                                        key={cell.id}
                                                        className="py-3"
                                                        style={{
                                                            width: `${columnWidth}px`,
                                                        }}
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