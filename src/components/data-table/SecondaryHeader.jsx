import { useState } from "react"

export function ResizableHeader({ header, table, children }) {
    const [isResizing, setIsResizing] = useState(false)
    const { column } = header
    const { getState } = table
    const { columnSizingInfo } = getState()
    const isResizingColumn = columnSizingInfo.isResizingColumn === column.id

    const onMouseDown = (e) => {
        e.preventDefault()
        column.getResizeHandler()(e)
        setIsResizing(true)
    }

    const onMouseUp = () => {
        setIsResizing(false)
    }

    if (!column.getCanResize() || column.columnDef.meta?.isSticky) {
        return <div>{children}</div>
    }

    return (
        <div className="relative flex items-center">
            <div className="flex-1">{children}</div>
            <div
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                className={`absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none ${isResizingColumn || isResizing ? "bg-primary/50" : ""
                    }`}
            />
        </div>
    )
}