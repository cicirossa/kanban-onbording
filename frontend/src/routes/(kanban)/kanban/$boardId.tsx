import { Link, createFileRoute } from '@tanstack/react-router'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { Button, Spinner } from '@heroui/react'
import { ArrowLeft, Plus } from 'lucide-react'
import { useKanbanBoard } from '@/hooks/use-kanban-board'
import { KanbanColumn } from '@/components/features/kanban/column'
import { KanbanCard } from '@/components/features/kanban/card'
import { ColumnModal } from '@/components/features/kanban/column-modal'
import { CardModal } from '@/components/features/kanban/card-modal'
import { PageHeader } from '@/components/templates/page-header'

export const Route = createFileRoute('/(kanban)/kanban/$boardId')({
  component: KanbanBoardPage,
})

function KanbanBoardPage() {
  const { boardId } = Route.useParams()
  const {
    board,
    columns,
    isLoading,
    hasPermission,
    activeId,
    dnd,
    columnActions,
    cardActions,
    columnModalProps,
    cardModalProps,
  } = useKanbanBoard(Number(boardId))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columnIds = columns.map((c) => `col:${c.id}`)

  // Resolve the lifted item for the drag overlay.
  const activeCard = activeId?.startsWith('card:')
    ? columns
        .flatMap((c) => c.cards)
        .find((c) => `card:${c.id}` === activeId)
    : null
  const activeColumn = activeId?.startsWith('col:')
    ? columns.find((c) => `col:${c.id}` === activeId)
    : null

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={board?.title ?? 'Board'}
        breadcrumbs={[
          { label: 'Kanban', href: '/kanban' },
          { label: board?.title ?? 'Board', isCurrent: true },
        ]}
        actions={
          <Button
            as={Link}
            to="/kanban"
            variant="flat"
            startContent={<ArrowLeft size={16} />}
            className="font-medium"
          >
            All boards
          </Button>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={dnd.handleDragStart}
        onDragEnd={dnd.handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddCard={cardActions.onAdd}
                onEditColumn={columnActions.onEdit}
                onDeleteColumn={columnActions.onDelete}
                onViewCard={cardActions.onView}
                onEditCard={cardActions.onEdit}
                onDeleteCard={cardActions.onDelete}
                hasPermission={hasPermission}
              />
            ))}
          </SortableContext>

          {hasPermission('columns.create') && (
            <Button
              variant="flat"
              startContent={<Plus size={16} />}
              onPress={columnActions.onAdd}
              className="h-12 w-72 shrink-0 justify-start font-medium text-default-500"
            >
              Add column
            </Button>
          )}
        </div>

        <DragOverlay>
          {activeCard ? (
            <KanbanCard
              card={activeCard}
              onView={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              canEdit={false}
              canDelete={false}
            />
          ) : activeColumn ? (
            <div className="w-72 rounded-3xl bg-default-100 p-3 opacity-90">
              <h3 className="px-1 text-sm font-semibold">
                {activeColumn.title}
              </h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ColumnModal {...columnModalProps} />
      <CardModal {...cardModalProps} />
    </div>
  )
}
