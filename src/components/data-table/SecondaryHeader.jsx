import { useRef, useEffect } from "react"

export function ResizableHeader({ header, table, children, className = "" }) {
    const ref = useRef(null)

    // Check if this is a non-resizable column
    const isCheckbox = header.column.id === "select"
    const isFirstColumn = header.column.id === "tableId"
    const canResize = !isCheckbox && !isFirstColumn && header.column.getCanResize()

    useEffect(() => {
        if (!ref.current || !canResize) return

        const resizer = header.getResizeHandler()
        const startResize = (e) => {
            e.preventDefault()
            document.addEventListener("mousemove", resize)
            document.addEventListener("mouseup", stopResize)
        }

        const resize = (e) => {
            // Update column width as mouse moves
            table.setColumnSizing((old) => ({
                ...old,
                [header.id]: Math.max(
                    header.column.minSize || 50,
                    header.getSize() + e.movementX
                ),
            }))
        }

        const stopResize = () => {
            document.removeEventListener("mousemove", resize)
            document.removeEventListener("mouseup", stopResize)
        }

        // Find the resizer element
        const resizerElement = ref.current.querySelector(".column-resizer")
        if (resizerElement) {
            resizerElement.addEventListener("mousedown", startResize)

            return () => {
                resizerElement.removeEventListener("mousedown", startResize)
                document.removeEventListener("mousemove", resize)
                document.removeEventListener("mouseup", stopResize)
            }
        }
    }, [header, table, canResize])

    // If this is a non-resizable column, just render children
    if (!canResize) {
        return <div className={className}>{children}</div>
    }

    return (
        <div ref={ref} className={`relative ${className}`}>
            {children}
            <div
                className="column-resizer absolute right-0 top-0 h-full w-2 bg-transparent hover:bg-indigo-300 cursor-col-resize"
                data-column-id={header.id}
            />
        </div>
    )
}