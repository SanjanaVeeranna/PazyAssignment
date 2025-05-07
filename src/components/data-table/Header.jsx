import { useDrag, useDrop } from "react-dnd"

export function DraggableColumnHeader({ header, table, children }) {
    const { getState, setColumnOrder } = table
    const { columnOrder } = getState()
    const { column } = header

    const [, dropRef] = useDrop({
        accept: "column",
        drop: (draggedColumn) => {
            const newColumnOrder = [...columnOrder]
            const currentIndex = newColumnOrder.findIndex((id) => id === draggedColumn.id)
            const targetIndex = newColumnOrder.findIndex((id) => id === column.id)

            if (currentIndex !== -1 && targetIndex !== -1) {
                newColumnOrder.splice(currentIndex, 1)
                newColumnOrder.splice(targetIndex, 0, draggedColumn.id)
                setColumnOrder(newColumnOrder)
            }
        },
    })

    const [{ isDragging }, dragRef, previewRef] = useDrag({
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        item: () => column,
        type: "column",
        canDrag: () => !column.columnDef.meta?.isSticky,
    })

    return (
        <div ref={dropRef} className={`flex items-center ${isDragging ? "opacity-50" : ""}`}>
            <div
                ref={column.columnDef.meta?.isSticky ? undefined : dragRef}
                className={`flex items-center ${column.columnDef.meta?.isSticky ? "" : "cursor-move"}`}
            >
                <div ref={previewRef} className="flex items-center">
                    {children}
                </div>
            </div>
        </div>
    )
}