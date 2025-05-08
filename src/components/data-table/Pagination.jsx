import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "../ui/Button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select"

export function TablePagination({ table }) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            {/* Selection info with badge */}
            <div className="flex items-center">
                {table.getFilteredSelectedRowModel().rows.length > 0 ? (
                    <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                        <span>
                            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
                        </span>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">
                        No rows selected
                    </div>
                )}
            </div>

            {/* Pagination controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {/* Rows per page selector */}
                <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-gray-700">Rows per page</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-9 w-[70px] border-gray-300 rounded-md bg-white hover:bg-gray-50 shadow-sm">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top" className="border-gray-200 shadow-lg">
                            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`} className="hover:bg-indigo-50">
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Page info */}
                <div className="px-4 py-1 bg-gray-100 rounded-md text-sm font-medium text-gray-700 min-w-[120px] text-center">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        className="h-9 w-9 p-0 rounded-md border-gray-300 bg-white hover:bg-indigo-50 hover:text-indigo-600 hidden sm:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-9 w-9 p-0 rounded-md border-gray-300 bg-white hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-9 w-9 p-0 rounded-md border-gray-300 bg-white hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-9 w-9 p-0 rounded-md border-gray-300 bg-white hover:bg-indigo-50 hover:text-indigo-600 hidden sm:flex"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}